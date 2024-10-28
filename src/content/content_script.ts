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

		const selection = window.getSelection();
		await showPrompter(selection);

		promptButtonState.aborter = new AbortController();
		promptButton.addEventListener("click", () => onPromptButtonClick(selection, promptButtonState), {
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

function buildPrompter(): void {
	prompter.classList.add("sl-prompt");

	promptButton.classList.add("sl-prompt-button");

	promptButtonText.classList.add("sl-prompt-button-text");
	promptButtonText.innerText = "+";
}

function resetPrompter(): void {
	prompter.classList.remove("sl-prompt-show");
	promptButtonText.classList.remove("sl-prompt-button-for-cancellation");
}

async function showPrompter(selection: Selection | null): Promise<void> {
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
		anchorY = 1e9;
	}

	const buttonOnTop = baseY < anchorY;
	const addButtonRect = prompter.getBoundingClientRect();
	const offsetY = buttonOnTop ? -addButtonRect.height - 20 : 50;

	prompter.style.translate = `${baseX}px ${baseY + offsetY}px`;
}

function onPromptButtonClick(
	selection: Selection | null,
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
	promptButtonText.classList.add("sl-prompt-button-for-cancellation");
}
