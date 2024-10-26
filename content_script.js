const addButtom = document.createElement("div");
addButtom.className = "soulignerAdd";
addButtom.id = "soulignerAdd";
addButtom.innerText = "TEST";
document.body.appendChild(addButtom);

//MO TODO check if this works on mobile
//MO TODO change button icon depending on context
//MO TODO "+" if not yet clicked else "x" for abort
document.addEventListener("selectionchange", async () => {
	const selection = window.getSelection();
	if (!selection || selection.isCollapsed) {
		addButtom.classList.remove("showButton");
		return;
	}
	addButtom.classList.add("showButton");

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
	const addButtonRect = addButtom.getBoundingClientRect();
	const offsetY = buttonOnTop ? -addButtonRect.height - 20 : 50;

	addButtom.style.transform = `translate(${baseX}px, ${baseY + offsetY}px)`;

	// chrome.runtime.sendMessage(null, {
	// 	event: "selectionChange",
	// 	selection: ,
	// });
});
