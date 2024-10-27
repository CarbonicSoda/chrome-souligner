/**
 * @type {HTMLDivElement}
 */
let prompter;
/**
 * @type {HTMLButtonElement}
 */
let promptButton;
/**
 * @type {HTMLParagraphElement}
 */
let promptButtonText;

/**
 * @type {AbortController}
 */
let promptButtonAbort;
let isButtonCancellation = false;

buildPrompt();
document.addEventListener("selectionchange", async () => {
	if (promptButtonAbort && !promptButtonAbort.signal.aborted) promptButtonAbort.abort();
	resetPrompt();

	const selection = window.getSelection();
	await showPrompt(selection);

	promptButtonAbort = new AbortController();
	promptButton.addEventListener("click", () => onPromptButtonClick(selection), {
		signal: promptButtonAbort.signal,
	});

	// chrome.runtime.sendMessage(null, {
	// 	event: "selectionChange",
	// 	selection: ,
	// });
});

function buildPrompt() {
	prompter = document.createElement("div");
	prompter.classList.add("slInjected", "slPrompt");

	promptButton = document.createElement("button");
	promptButton.classList.add("slInjected", "slPromptButton");

	promptButtonText = document.createElement("p");
	promptButton.classList.add("slInjected", "slPromptButtonText");
	promptButtonText.innerText = "+";

	promptButton.append(promptButtonText);
	prompter.append(promptButton);
	document.body.append(prompter);
}

/**
 * @param {Selection | null} selection
 */
async function showPrompt(selection) {
	if (!selection || selection.isCollapsed) {
		prompter.classList.remove("slShowPrompt");
		return;
	}
	prompter.classList.add("slShowPrompt");

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
		mouseEv = await new Promise((res) =>
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

function resetPrompt() {
	prompter.classList.remove("slShowPrompt");
	promptButton.classList.remove("slCancelButton");
}

/**
 * @param {Selection | null} selection
 */
function onPromptButtonClick(selection) {
	if (isButtonCancellation) {
		isButtonCancellation = false;
		promptButtonAbort.abort();
		selection.empty();
		resetPrompt();
		return;
	}
	isButtonCancellation = true;
	promptButton.classList.add("slCancelButton");
}
