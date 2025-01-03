/* jshint esversion: 8 */

async function fetchJson(url, options) {
	if (!options) {
		options = {};
	}
	const result = await fetch(url, options);
	if (!result.ok) {
		throw new Error("Cant fetch " + url + ": " + result.status + " " + await result.text());
	}
	const json = await result.json();
	if ("error" in json) {
		throw new Error("Error from url " + url + ": " + json.error);
	}
	return json;
}

function createSelect(name, selected, options) {
	const select = document.createElement("select");
	select.setAttribute("name", name);
	for (const option of options) {
		const optElem = document.createElement("option");
		optElem.setAttribute("value", option);
		if (option == selected) {
			optElem.setAttribute("selected", "");
		}
		optElem.appendChild(document.createTextNode(option));
		select.appendChild(optElem);
	}
	return select;
}

function createForm(url) {
	const form = document.createElement("form");
	form.setAttribute("method", "POST");
	form.setAttribute("action", url);
	form.setAttribute("enctype", "application/x-www-form-urlencoded");
	return form;
}

function addSubmitBtn(form, text) {
	const btn = document.createElement("input");
	btn.setAttribute("type", "submit");
	btn.setAttribute("value", text);
	form.appendChild(btn);
}

function outTemp(div, room, status) {
	const form = createForm("radiator.py?cmd=temp&room=" + room);

	const currentTemp = parseFloat(status.temperature);
	const temps = [5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
	if (!temps.includes(currentTemp)) {
		temps.push(parseFloat(currentTemp));
	}
	temps.sort((a, b) => a - b);
	const select = createSelect("temp", status.temperature, temps);

	form.appendChild(document.createTextNode("Temp "));
	form.appendChild(select);
	form.appendChild(document.createTextNode(" (Valve " + status.valve + "%) "));

	addSubmitBtn(form, "Set Temp");

	div.appendChild(form);
}

function outMode(div, room, status) {
	const form = createForm("radiator.py?cmd=mode&room=" + room);
	const isAuto = status.mode.auto ? true : false;

	form.appendChild(document.createTextNode("Mode " + (isAuto ? "auto" : "manual") + " "));

	const hiddenInput = document.createElement("input");
	hiddenInput.setAttribute("type", "hidden");
	hiddenInput.setAttribute("name", "mode");
	hiddenInput.setAttribute("value", isAuto ? "manual" : "auto");
	form.appendChild(hiddenInput);

	addSubmitBtn(form, "Mode " + (isAuto ? "manual" : "auto"));

	div.appendChild(form);
}

function stateBoolToText(text, bool) {
	const outerSpan = document.createElement("span");

	outerSpan.appendChild(document.createTextNode(text + " "));

	const innerSpan = document.createElement("span");
	if (bool) {
		innerSpan.setAttribute("class", "red");
		innerSpan.appendChild(document.createTextNode("YES"));
	} else {
		innerSpan.appendChild(document.createTextNode("No"));
	}
	outerSpan.appendChild(innerSpan);

	return outerSpan;
}

function outState(div, status) {
	const stateDiv = document.createElement("div");
	stateDiv.appendChild(stateBoolToText("Low Battery?", status.mode["low battery"]));
	stateDiv.appendChild(document.createTextNode("; "));
	stateDiv.appendChild(stateBoolToText("Window open?", status.mode["open window"]));
	stateDiv.appendChild(document.createTextNode("; "));
	stateDiv.appendChild(stateBoolToText("Vacation?", status.mode["vacation"]));

	div.appendChild(stateDiv);
}

async function addRoom(room) {
	const status = await fetchJson("radiator.py?room=" + room + "&cmd=status");
	console.log("Room " + room + " status: ", status);

	const div = document.createElement("div");
	const title = document.createElement("h1");
	title.appendChild(document.createTextNode(room));
	div.appendChild(title);

	outTemp(div, room, status);
	outMode(div, room, status);
	outState(div, status);

	document.getElementById("content").appendChild(div);
}

async function start() {
	console.log("Start");

	const rooms = (await fetchJson("radiator.py?cmd=rooms"))["rooms"];
	console.log("Rooms: ", rooms);

	for (const room of rooms) {
		await addRoom(room);
	}
	document.getElementById("loading").remove();
}

document.addEventListener("DOMContentLoaded", start);
