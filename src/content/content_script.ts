const prompter = injectElement("div", document.body);
const promptButton = injectElement("button", prompter);
const promptButtonText = injectElement("p", promptButton);

(function main(): void {
	buildPrompter();

	const global = {
		buttonAbortable: false,
		buttonClickAbort: new AbortController(),

		selectionChangeAbort: new AbortController(),
		selectionIdleTimeout: <NodeJS.Timeout>(<unknown>-1),
	};
	document.addEventListener("selectionchange", async () => {
		global.buttonClickAbort.abort("removeOldListener");
		global.selectionChangeAbort.abort("removeOldListener");
		clearTimeout(global.selectionIdleTimeout);
		resetPrompter();

		const selectionIdleThreshold = 200;
		global.selectionChangeAbort = new AbortController();
		const selectionIdle = await new Promise<boolean>((res) => {
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

function buildPrompter(): void {
	prompter.classList.add("sl-prompt");

	promptButton.classList.add("sl-prompt-button");

	promptButtonText.classList.add("sl-prompt-button-text");
	promptButtonText.innerText = "+";
}

function resetPrompter(): void {
	prompter.classList.remove("sl-prompt-show");
	setSLVariable("prompt-translate", "0 0");
	setSLVariable("prompt-button-rot", 0);
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

	const promptButtonRect = promptButton.getBoundingClientRect();
	y += buttonOnTop ? -promptButtonRect.height - 20 : 50;

	const marginX = window.innerWidth * 0.05;
	const marginY = window.innerHeight * 0.05;
	const leftBound = window.scrollX + marginX;
	const topBound = window.scrollY + marginY;
	const rightBound = window.scrollX + window.innerWidth - marginX - promptButtonRect.width;
	const bottomBound = window.scrollY + window.innerHeight - marginY - promptButtonRect.height;

	if (x < leftBound) x = leftBound;
	if (y < topBound) y = topBound;
	if (x > rightBound) x = rightBound;
	if (y > bottomBound) y = bottomBound;

	setSLVariable("prompt-translate", `${x}px ${y}px`);
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
		globalInfo.buttonClickAbort.abort("userAbortPrompt");
		selection.empty();
		resetPrompter();
		return;
	}
	globalInfo.buttonAbortable = true;
	//MO FIX rotation wrong
	setSLVariable("prompt-button-rot", promptInfo.onRight === promptInfo.onTop ? "45deg" : "-45deg");
	showInputPrompt(promptInfo);
}

function showInputPrompt(promptInfo: { x: number; y: number; onRight: boolean; onTop: boolean }) {
	promptInfo;
}
