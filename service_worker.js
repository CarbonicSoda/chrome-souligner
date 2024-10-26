chrome.runtime.onMessage.addListener((ev) => {
	switch (ev.event) {
		case "selectionChange":
			onSelectionChange(ev.selection);
			break;
	}
});

/**
 * @param {Selection} selection
 */
function onSelectionChange(selection) {
	if (!selection) return;
	console.log(selection.toString());
}

//MO TODO depending on explorer opened state, set icon
//MO TODO if explorer closed, set to "S" else "X"
