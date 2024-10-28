const prompter = injectElement("div", document.body);
const promptButton = injectElement("button", prompter);
const promptButtonText = injectElement("p", promptButton);

(function main(): void {
	buildPrompter();

	const promptButtonState = {
		forCancellation: false,
		aborter: new AbortController(),
	};
	document.addEventListener("selectionchange", async () => {
		if (!promptButtonState.aborter.signal.aborted) promptButtonState.aborter.abort();

		resetPrompter();
		if (!elementInViewport(prompter)) {
			prompter.classList.add("no-transition");
			setSLVariable("prompt-x", `${window.scrollX + window.innerWidth / 2}px`);
			setSLVariable("prompt-y", `${window.scrollY + window.innerHeight / 2}px`);
			prompter.offsetHeight; // force browser CSS reflow
			prompter.classList.remove("no-transition");
		}

		const selection = window.getSelection();
		const promptInfo = await showPrompter(selection);
		if (!promptInfo) return;

		promptButtonState.aborter = new AbortController();
		promptButton.addEventListener("click", () => onPromptButtonClick(selection, promptInfo, promptButtonState), {
			signal: promptButtonState.aborter.signal,
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

function elementInViewport(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
}

function buildPrompter(): void {
	prompter.classList.add("sl-prompt");

	promptButton.classList.add("sl-prompt-button");

	promptButtonText.classList.add("sl-prompt-button-text");
	promptButtonText.innerText = "+";
}

function resetPrompter(): void {
	prompter.classList.remove("sl-prompt-show");
	setSLVariable("prompt-button-rot", 0);
}

async function showPrompter(selection: Selection | null): Promise<
	| {
			onRight: boolean;
			onTop: boolean;
	  }
	| undefined
> {
	if (!selection || selection.isCollapsed) {
		prompter.classList.remove("sl-prompt-show");
		return;
	}
	prompter.classList.add("sl-prompt-show");

	const focusNode = selection.focusNode;
	const focusOffset = selection.focusOffset;

	let baseX, baseY;
	if (selection.containsNode(focusNode)) {
		const focus = document.createRange();
		focus.setStart(focusNode, focusOffset);
		focus.setEnd(focusNode, focusOffset);
		const focusRect = focus.getBoundingClientRect();

		baseX = window.scrollX + focusRect.left;
		baseY = window.scrollY + focusRect.top;
	} else {
		const mouseEv: MouseEvent = await new Promise((res) =>
			document.addEventListener("mousemove", res, {
				once: true,
			}),
		);
		baseX = mouseEv.pageX;
		baseY = mouseEv.pageY;
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
	const addButtonRect = prompter.getBoundingClientRect();

	const buttonOnRight = baseX > window.innerWidth / 2;
	const buttonOnTop = baseY < anchorY;

	const offsetY = buttonOnTop ? -addButtonRect.height - 20 : 50;
	setSLVariable("prompt-x", `${baseX}px`);
	setSLVariable("prompt-y", `${baseY + offsetY}px`);

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
	promptButtonState: {
		forCancellation: boolean;
		aborter: AbortController;
	},
): void {
	if (promptButtonState.forCancellation) {
		promptButtonState.forCancellation = false;
		promptButtonState.aborter.abort();
		selection.empty();
		resetPrompter();
		return;
	}
	promptButtonState.forCancellation = true;
	setSLVariable("prompt-button-rot", promptInfo.onRight !== promptInfo.onTop ? "-45deg" : "45deg");
	showInputPrompt(promptInfo);
}

function showInputPrompt(promptInfo: { onRight: boolean; onTop: boolean }) {
	promptInfo;
}
