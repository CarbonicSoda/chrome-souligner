const prompter = injectElement("div", document.body);

const promptButton = injectElement("button", prompter);
const [promptButtonWidth, prompButtonHeight] = [40, 40];

const promptButtonText = injectElement("p", promptButton);

const inputPrompt = injectElement("div", prompter);
const [inputPromptWidth, inputPromptHeight] = [356, 200];

(function main(): void {
	buildPrompter();

	const global = {
		buttonAbortable: false,
		buttonClickAbort: new AbortController(),

		selectionChangeResolve: (selectionIdle: boolean) => {},
		selectionChangeAbort: new AbortController(),
		selectionIdleTimeout: <NodeJS.Timeout>(<unknown>-1),
	};
	document.addEventListener("selectionchange", async () => {
		global.buttonClickAbort.abort("removeOldListener");
		global.selectionChangeResolve(false);
		global.selectionChangeAbort.abort("removeOldListener");
		clearTimeout(global.selectionIdleTimeout);
		resetPrompter();

		const selectionIdleThreshold = 200;
		global.selectionChangeAbort = new AbortController();
		const selectionIdle = await new Promise((res) => {
			global.selectionChangeResolve = res;
			global.selectionIdleTimeout = setTimeout(() => {
				res(true);
				global.selectionChangeAbort.abort("selectionIdle");
			}, selectionIdleThreshold);
			document.addEventListener(
				"selectionchange",
				() => {
					res(false);
					clearTimeout(global.selectionIdleTimeout);
				},
				{ once: true, signal: global.selectionChangeAbort.signal },
			);
		});
		if (!selectionIdle) return;

		const selection = window.getSelection();
		const promptInfo = await showPrompter(selection);
		if (!promptInfo) {
			resetPrompter();
			return;
		}

		global.buttonAbortable = false;
		global.buttonClickAbort.abort("removeOldListener");
		global.buttonClickAbort = new AbortController();
		promptButton.addEventListener("click", () => onPromptButtonClick(selection, promptInfo, global), {
			signal: global.buttonClickAbort.signal,
		});
	});
})();

function buildPrompter(): void {
	prompter.classList.add("sl-prompt");

	promptButton.classList.add("sl-prompt-button");

	promptButtonText.classList.add("sl-prompt-button-text");
	promptButtonText.innerText = "+";

	inputPrompt.classList.add("sl-input-prompt");
}

async function resetPrompter(): Promise<void> {
	prompter.classList.remove("sl-prompt-show");
	inputPrompt.classList.remove("sl-input-prompt-show");
	setSLVariable("prompt-button-text-rot", 0);

	const transitions = [prompter, promptButtonText, inputPrompt].map(
		(element) => new Promise((res) => element.addEventListener("transitioned", res, { once: true })),
	);
	await Promise.all(transitions);

	setSLVariable("prompt-translate", "0, 0");
}

async function showPrompter(selection: Selection | null): Promise<
	| {
			x: number;
			y: number;
			onRight: boolean;
			onTop: boolean;
	  }
	| undefined
> {
	if (!selection || selection.isCollapsed) return;

	const focusNode = selection.focusNode;
	const focusOffset = selection.focusOffset;

	let x, y;
	if (selection.containsNode(focusNode)) {
		const focus = document.createRange();
		focus.setStart(focusNode, focusOffset);
		focus.setEnd(focusNode, focusOffset);
		const focusRect = focus.getBoundingClientRect();

		x = window.scrollX + focusRect.left;
		y = window.scrollY + focusRect.top;
	} else {
		const mouseEv: MouseEvent = await new Promise((res) =>
			document.addEventListener("mousemove", res, {
				once: true,
			}),
		);
		x = mouseEv.pageX;
		y = mouseEv.pageY;
	}

	const anchorNode = selection.anchorNode;
	let anchorY;
	if (selection.containsNode(anchorNode)) {
		const anchorOffset = selection.anchorOffset;
		const anchor = document.createRange();
		anchor.setStart(anchorNode, anchorOffset);
		anchor.setEnd(anchorNode, anchorOffset);
		const anchorRect = anchor.getBoundingClientRect();

		anchorY = window.scrollY + anchorRect.top;
	} else {
		anchorY = 9e9;
	}
	const buttonOnRight = x > window.innerWidth / 2;
	const buttonOnTop = y < anchorY;

	y += buttonOnTop ? -50 - prompButtonHeight / 2 : 50;

	const marginX = window.innerWidth * 0.05;
	const marginY = window.innerHeight * 0.2;
	const leftBound = window.scrollX + marginX;
	const topBound = window.scrollY + marginY;
	const rightBound = window.scrollX + window.innerWidth - marginX - promptButtonWidth;
	const bottomBound = window.scrollY + window.innerHeight - marginY - prompButtonHeight;

	if (x < leftBound) x = leftBound;
	if (y < topBound) y = topBound;
	if (x > rightBound) x = rightBound;
	if (y > bottomBound) y = bottomBound;

	setSLVariable("prompt-translate", `${x}px, ${y}px`);
	prompter.classList.add("sl-prompt-show");

	return {
		x: x,
		y: y,
		onRight: buttonOnRight,
		onTop: buttonOnTop,
	};
}

function onPromptButtonClick(
	selection: Selection | null,
	promptInfo: {
		x: number;
		y: number;
		onRight: boolean;
		onTop: boolean;
	},
	globalInfo: {
		buttonAbortable: boolean;
		buttonClickAbort: AbortController;
		[other: string]: any;
	},
): void {
	if (globalInfo.buttonAbortable) {
		globalInfo.buttonClickAbort.abort("promptAbortedByUser");
		selection.empty();
		resetPrompter();
		return;
	}
	globalInfo.buttonAbortable = true;
	setSLVariable("prompt-button-text-rot", promptInfo.onRight === promptInfo.onTop ? "45deg" : "-45deg");
	showInputPrompt(promptInfo);
}

function showInputPrompt(promptInfo: { onRight: boolean; onTop: boolean; [other: string]: any }): void {
	const padding = 15;
	const offsetX = promptInfo.onRight ? -inputPromptWidth - padding : promptButtonWidth + padding;
	const offsetY = promptInfo.onTop ? -inputPromptHeight + prompButtonHeight : 0;
	setSLVariable("input-prompt-translate", `${offsetX}px ${offsetY}px`);
	setSLVariable(
		"input-prompt-transform-pivot",
		`${promptInfo.onTop ? "bottom" : "top"} ${promptInfo.onRight ? "right" : "left"}`,
	);
	inputPrompt.classList.add("sl-input-prompt-show");
}

// Auxiliary Start
function injectElement<T extends keyof HTMLElementTagNameMap>(
	tagName: T,
	parent: ParentNode,
): HTMLElementTagNameMap[T] {
	const element = document.createElement(tagName);
	element.className = "sl-injected";
	return parent.appendChild(element);
}

function setSLVariable(varName: string, value: any): void {
	document.documentElement.style.setProperty(`--sl-${varName}`, String(value));
}

// Auxiliary End
