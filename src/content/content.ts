import "./content.scss";

const prompter = injectElement("div", document.body, "prompt");

const promptButton = injectElement("button", prompter, "button");
const [promptButtonWidth, prompButtonHeight] = [40, 40];

// const promptButtonText = injectElement("p", promptButton, "");

const notePrompt = injectElement("div", prompter, "note-prompt");
const [notePromptWidth, notePromptHeight] = [356, 200];

const notePromptTextArea = injectElement("textarea", notePrompt, "note-prompt-textarea");

(function main(): void {
	const global = {
		buttonAbortable: false,
		buttonClickAbort: new AbortController(),

		selectionChangeResolve: (_selectionIdle: boolean) => {},
		selectionChangeAbort: new AbortController(),
		selectionIdleTimeout: <NodeJS.Timeout>(<unknown>-1),
	};
	document.addEventListener("selectionchange", async () => {
		if (notePromptTextArea === document.activeElement) return;

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

async function resetPrompter(): Promise<void> {
	removeClass(prompter, "prompt-show");
	removeClass(notePrompt, "note-prompt-show");
	setVariable("button-icon-rot", 0);

	await new Promise((res) => prompter.addEventListener("transitioned", res, { once: true }));

	setVariable("prompt-translate", "0 0");
}

async function showPrompter(selection: Selection | null): Promise<
	| {
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

	setVariable("prompt-translate", `${x}px ${y}px`);
	addClass(prompter, "prompt-show");

	return {
		onRight: buttonOnRight,
		onTop: buttonOnTop,
	};
}

function onPromptButtonClick(
	selection: Selection | null,
	promptInfo: {
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
	setVariable("button-icon-rot", promptInfo.onRight === promptInfo.onTop ? "45deg" : "-45deg");
	showInputPrompt(promptInfo);
}

//MO TODO shall show Tag Picker first, and transit to this details prompt
//MO TODO textarea will be aligned on top and confirm button on bottom
//MO TODO a placeholder pseudo will be in the textarea first then move to title pos
function showInputPrompt(promptInfo: { onRight: boolean; onTop: boolean }): void {
	const padding = 15;
	const offsetX = promptInfo.onRight ? -notePromptWidth - padding : promptButtonWidth + padding;
	const offsetY = promptInfo.onTop ? -notePromptHeight + prompButtonHeight : 0;
	setVariable("note-prompt-translate", `${offsetX}px ${offsetY}px`);
	setVariable(
		"note-prompt-transform-origin",
		`${promptInfo.onTop ? "bottom" : "top"} ${promptInfo.onRight ? "right" : "left"}`,
	);
	addClass(notePrompt, "note-prompt-show");
}

// Auxiliary Start
function injectElement<T extends keyof HTMLElementTagNameMap>(
	tagName: T,
	parent: ParentNode,
	className: string,
): HTMLElementTagNameMap[T] {
	const element = document.createElement(tagName);
	addClass(element, "injected", className);
	return parent.appendChild(element);
}

function addClass(element: Element, ...classNames: string[]): void {
	element.classList.add(...classNames.map((cls) => `sl-${cls}`));
}

function removeClass(element: Element, ...classNames: string[]): void {
	element.classList.remove(...classNames.map((cls) => `sl-${cls}`));
}

function setVariable(varName: string, value: any): void {
	document.documentElement.style.setProperty(`--sl-${varName}`, String(value));
}

// Auxiliary End
