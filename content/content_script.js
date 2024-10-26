const prompter = document.createElement("div");
prompter.classList.add("slInjected", "slPrompt");

const promptButton = document.createElement("button");
promptButton.classList.add("slInjected", "slPromptButton");

const promptButtonText = document.createElement("p");
promptButton.classList.add("slInjected", "slPromptButtonText");
promptButtonText.innerText = "+";

promptButton.append(promptButtonText);
prompter.append(promptButton);
document.body.append(prompter);

//MO TODO check if this works on mobile
//MO TODO change button icon depending on context
//MO TODO "+" if not yet clicked else "x" for abort
document.addEventListener("selectionchange", async () => {
	await showPrompt();

	// chrome.runtime.sendMessage(null, {
	// 	event: "selectionChange",
	// 	selection: ,
	// });
});

async function showPrompt() {
	const selection = window.getSelection();
	if (!selection || selection.isCollapsed) {
		prompter.classList.remove("slPromptShow");
		return;
	}
	prompter.classList.add("slPromptShow");

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
