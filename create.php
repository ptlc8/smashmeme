<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>Création d'animations</title>
		<style>
html, body {
	margin: 0;
	width: 100%;
	height: 100%;
}
#preview, #editing, #json, #buttons, #images, #folding {
	position: absolute;
}
@media (orientation: landscape) {
	#preview {
		width: 70vh;
		height: 70vh;
		left: 0;
	}
	#editing {
		width: calc(100vw - 70vh);
		height: 92vh;
		right: 0;
		top: 3vh;
	}
	#json {
		width: 70vh;
		height: 20vh;
		left: 0;
		bottom: 0;
	}
	#buttons {
		width: 70vh;
		height: 10vh;
		left: 0;
		top: 70vh;
	}
	#buttons > select {
		width: 100%;
		height: 50%;
	}
	#buttons > input[type=button] {
		width: calc(33.33% - 3px);
		height: calc(50% - 2px);
	}
	#images {
		width: calc(100vw - 70vh);
		height: 5vh;
		right: 0;
		bottom: 0;
	}
	#folding {
	    width: calc(100vw - 70vh);
		height: 3vh;
		right: 0;
	}
}
@media (orientation: portrait) {
	#preview {
		width: 75vw;
		height: 75vw;
		top: 0;
	}
	#editing {
		width: 97vw;
		height: calc(100vh - 80vw);
		bottom: 0;
		right: 0;
	}
	#json {
		width: 25vw;
		height: 60vw;
		top: 0;
		right: 0;
	}
	#buttons {
		width: 25vw;
		height: 20vw;
		top: 60vw;
		right: 0;
	}
	#buttons > select {
		width: 100%;
		height: 25%;
	}
	#buttons > input[type=button] {
		width: 100%;
		height: 25%;
	}
	#images {
	    width: 75vw;
	    height: 5vw;
	    top: 75vw;
	}
	#folding {
	    bottom: 0;
        transform-origin: left bottom;
        transform: rotate(-90deg) translateY(100%);
        width: calc(100vh - 80vw);
        height: 3vw;
	}
}
#json {
	padding: 0;
	resize: none;
}
#editing {
	overflow: auto;
}
#editing fieldset {
	overflow: hidden;
	/*background: linear-gradient(45deg, #31b39e, rgba(255, 255, 255, 128));*/
}
#editing fieldset legend {
	cursor: pointer;
}
#editing fieldset img {
	height: 4em;
	vertical-align: middle;
	margin-left: 1em;
}
#editing input, #editing select {
	/*background-color: #61e3be;*/
}
#images {
	border: 1px solid black;
    border-width: 1px 0 0 1px;
}
#images input[type=file] {
    display: none;
}
#images input[type=button] {
    width: calc(50% - 2.5px);
    height: 100%;
}
#folding input[type=button] {
    width: calc(50% - 2px);
    height: 100%;
}
.close-button, .add-button {
	cursor: pointer;
}
.add-button {
	display: block;
}
#query-bg {
	position: fixed;
	width: 100%;
	height: 100%;
    background-color: rgba(50,50,50,.8);
}
#query {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    background-color: rgba(150,150,150,.8);
    padding: 32px;
    border-radius: 16px;
    font-size: x-large;
    text-align: center
}
#query > span {
	display: block;
}
		</style>
		<script src="easing.js"></script>
		<script src="models.js?6"></script>
	</head>
	<body>
		<canvas id="preview">
			Can't preview...
		</canvas>
		<div id="buttons">
			<select id="anim-select"></select>
			<input type="button" value="Charger JSON" onclick="loadFromJSON()" />
			<input type="button" value="Copier JSON" onclick="copyJSON()" />
			<input type="button" value="Sauvegarder" onclick="save()" />
		</div>
		<textarea id="json"></textarea>
		<div id="editing" onchange="loadFromEditing()"></div>
		<div id="images">
			<input type="file" onchange="loadImageFromUpload(this)" />
			<input type="button" value="Charger une image" onclick="this.parentElement.querySelector('input[type=file]').click()" />
		</div>
		<div id="folding">
		    <input type="button" value="⊞ Tout déplier" onclick="for (let legend of document.getElementById('editing').querySelectorAll('legend')) if (legend.parentElement.style.height == '0px') legend.click()" />
		    <input type="button" value="⊟ Tout replier" onclick="for (let legend of document.getElementById('editing').querySelectorAll('legend')) if (legend.parentElement.style.height == '') legend.click()" />
		</div>
		<script>

var background;
var model;
var zoom = 1;

window.addEventListener("load", async () => {
	var cvs = document.getElementById("preview");
	cvs.width = cvs.height = 600;
	cvs.addEventListener("wheel", (e) => {
	    e.preventDefault();
	    zoom *= Math.pow(2, -e.deltaY*0.001);
	});
	background = newModel({
		img: "grid.png"
	});
	model = <?php echo isset($_REQUEST['from']) ? 'await loadModelFromJSONFile("'.$_REQUEST['from'].'.json")' : 'newModel({})' ?>;
	<?php if (!isset($_REQUEST['from'])) echo 'loadFromSave();' ?>
	refreshEditing();
	refreshJSON();
	refreshAnimSelect()
	var startT = Date.now();
	var animSelect = document.getElementById("anim-select");
	setInterval(() => {
		var ctx = a=cvs.getContext("2d");
		if (ctx.resetTransform) ctx.resetTransform();
		ctx.globalAlpha = 1;
		ctx.clearRect(0, 0, cvs.width, cvs.height);
		ctx.translate(300, 400);
		ctx.scale(zoom, zoom);
		renderModel(ctx, background, Date.now()-startT, "default");
		renderModel(ctx, model, Date.now()-startT, animSelect.value);
		ctx.scale(1/zoom, 1/zoom);
		ctx.translate(-300, -400);
	}, 1000/30);
});

function refreshEditing() {
	refreshEditingModel(document.getElementById("editing"), model);
}

function refreshJSON() {
	document.getElementById("json").value = JSON.stringify(model);
}

function save() {
    if (localStorage) {
        localStorage.setItem("creating-model", JSON.stringify(model));
        alert("Le modèle a bien été enregistré localement sur votre navigateur.");
    } else {
        alert("Votre navigateur n'est pas compatible avec ce système de sauvegarde local");
    }
}

function loadFromEditing() {
	model = getModelFromEditing(document.getElementById("editing"));
	refreshAnimSelect();
	refreshJSON();
}

function loadFromJSON() {
	model = JSON.parse(document.getElementById("json").value);
	refreshAnimSelect();
	refreshEditing();
}

function loadFromSave() {
    if (!localStorage.getItem("creating-model")) return;
    model = JSON.parse(localStorage.getItem("creating-model"));
    console.info("Model loaded from local storage");
    refreshAnimSelect();
    refreshJSON();
    refreshEditing();
}

function refreshAnimSelect() {
	var animSelect = document.getElementById("anim-select");
	let animNames = getAnimNames(model);
	for (let i = animSelect.children.length-1; i >= 0; i--)
		if (!animNames.includes(animSelect.children[i].value))
			animSelect.removeChild(animSelect.children[i]);
		else animNames.splice(animNames.indexOf(animSelect.children[i].value), 1);
	for (let animName of animNames) {
		let option = document.createElement("option");
		option.innerText = option.value = animName;
		animSelect.appendChild(option);
	}
}
function getAnimNames(model) {
	let animNames = [];
	if (model.anims)
		for (let animName of Object.keys(model.anims)) for (let subAnimName of animName.split("|"))
			if (!animNames.includes(subAnimName)) animNames.push(subAnimName);
	for (let pinned of model.pinneds)
		for (animName of getAnimNames(pinned))
			if (!animNames.includes(animName)) animNames.push(animName);
	return animNames;
}

function copyJSON() {
	document.getElementById("json").select();
	document.execCommand("copy");
}

function newInput(type, value, name="", placeholder="") {
	var input = document.createElement("input");
	input.type = type;
	if (value != undefined) input.value = value;
	if (type == "checkbox") input.checked = value;
	input.name = name;
	input.placeholder = placeholder;
	if (type == "number") input.step = 0.01;
	return input;
}

function newSelect(values=[], value=undefined, name="") {
	var select = document.createElement("select");
	select.name = name;
	for (let value of values) {
		let option = document.createElement("option");
		option.innerText = option.value = value;
		select.appendChild(option);
	}
	if (value) select.value = value;
	return select;
}

function newFieldSet(title, name="", type="object", inputs=[]) {
	var fieldset = document.createElement("fieldset");
	fieldset.name = name;
	if (type=="array") fieldset.array = true;
	if (type=="linearable") fieldset.linearable = true;
	let legend = document.createElement("legend");
	legend.innerText = "⊟ " + title;
	fieldset.appendChild(legend);
	var open = true;
	legend.addEventListener("click", (e) => {
		fieldset.style.height = open ? "0" : "";
		legend.innerText = (open ? "⊞ " : "⊟ ") + title;
		open = !open;
	});
	for (let input of inputs)
		fieldset.appendChild(input);
	return fieldset;
}

function refreshEditingModel(fieldset, model) {
	for (let i = fieldset.children.length-1; i >= 0; i--)
		if (fieldset.children[i].tagName.toLowerCase() != "legend")
			fieldset.removeChild(fieldset.children[i]);
	var imageInput = newInput("text", model.img, "img", "URL de l'image");
	var imagePreview = newImage(getImage(model.img, true).src);
	imageInput.addEventListener("change", () => imagePreview.src = getImage(imageInput.value, true).src);
	fieldset.appendChild(newFieldSet("Image", "img", "linearable", [imageInput, imagePreview]));
	fieldset.appendChild(newFieldSet("Derrière le parent ?", "bh", "linearable", [newInput("checkbox", model.bh, "bh")]));
	fieldset.appendChild(newFieldSet("Origine", "origin", "model", [newInput("number", model.origin.x, "x", "X"), newInput("number", model.origin.y, "y", "Y")]));
	fieldset.appendChild(newFieldSet("Position", "pos", "model", [newInput("number", model.pos.x, "x", "X"), newInput("number", model.pos.y, "y", "Y")]));
	fieldset.appendChild(newFieldSet("Rotation", "rot", "linearable", [newInput("number", model.rot, "rot", "en degrés")]));
	fieldset.appendChild(newFieldSet("Scale", "scale", "model", [newInput("number", model.scale.x, "x", "Largeur"), newInput("number", model.scale.y, "y", "Hauteur")]));
	fieldset.appendChild(newFieldSet("Transparence", "trsp", "linearable", [newInput("number", model.trsp, "trsp", "transparence (0 = visible, 1 = invisible)")]));
	let anims = newFieldSet("Animations", "anims");
	if (model.anims) for (let i = 0; i < Object.keys(model.anims).length; i++) {
		let anim = newFieldSet("Animation " + Object.keys(model.anims)[i], Object.keys(model.anims)[i], "array");
		refreshEditingAnim(anim, model.anims[Object.keys(model.anims)[i]]);
		anims.appendChild(anim);
		addDeleteCross(anim, "Supprimer l'animation " + Object.keys(model.anims)[i] + " ⬆");
	}
	fieldset.appendChild(anims);
	addAddButton(anims, "Ajouter une animation", async () => {
		let animName = await query("Nom de l'animation ?");
		/*if (Object.keys(model.anims).includes(animName)) {
			alert("L'animation \""+animName+"\" existe déjà sur cet objet");
			return;
		}*/
		let anim = newFieldSet("Animation " + animName, animName, "array");
		refreshEditingAnim(anim, []);
		anims.appendChild(anim);
		addDeleteCross(anim, "Supprimer l'animation " + animName + " ⬆");
		loadFromEditing();
	});
	let pinneds = newFieldSet("Enfants", "pinneds", "array");
	for (let i = 0; i < model.pinneds.length; i++) {
		let pinned = newFieldSet("Enfant " + i, "", "object");
		refreshEditingModel(pinned, model.pinneds[i]);
		pinneds.appendChild(pinned);
		addDeleteCross(pinned, "Supprimer l'enfant " + i + " ⬆");
	}
	fieldset.appendChild(pinneds); 
	addAddButton(pinneds, "Ajouter un enfant", () => {
		let o = newModel({});
		let pinned = newFieldSet("Enfant", "", "object");
		refreshEditingModel(pinned, o);
		pinneds.appendChild(pinned);
		addDeleteCross(pinned, "Supprimer l'enfant ⬆");
		loadFromEditing();
	});
}

function refreshEditingAnim(fieldset, anim) {
	for (let el of fieldset.children)
		if (el.tagName.toLowerCase() != "legend")
			fieldset.removeChild(el);
	for (a of anim) {
		let steps = newFieldSet("étapes", "steps", "array");
		refreshEditingAnimSteps(steps, a.steps);
		let move = newFieldSet("", "", "object", [newSelect(["posX","posY","rot","originX","originY","scaleX","scaleY","trsp"], a.on, "on"), steps, newInput("number", a.in, "in", "durée"), newSelect(Object.keys(EasingFunctions), a.func, "func")]);
		fieldset.appendChild(move);
		addDeleteCross(move, "Supprimer ce mouvement d'animation ⬆");
	}
	addAddButton(fieldset, "Ajouter un mouvement d'animation", () => {
		let a = newAnim();
		let steps = newFieldSet("étapes", "steps", "array");
		refreshEditingAnimSteps(steps, a.steps);
		let move = newFieldSet("", "", "object", [newSelect(["posX","posY","rot","originX","originY","scaleX","scaleY","trsp"], a.on, "on"), steps, newInput("number", a.in, "in", "durée"), newSelect(Object.keys(EasingFunctions), a.func, "func")]);
		fieldset.appendChild(move);
		addDeleteCross(move, "Supprimer ce mouvement d'animation ⬆");
		loadFromEditing();
	});
}

function refreshEditingAnimSteps(fieldset, steps=[]) {
	for (let el of fieldset.children)
		if (el.tagName.toLowerCase() != "legend")
			fieldset.removeChild(el);
	for (let step of steps) {
		let stepInput = newInput("number", step);
		fieldset.appendChild(stepInput);
		addDeleteCross(stepInput);
	}
	addAddButton(fieldset, "Ajouter une étape", () => {
		let stepInput = newInput("number", 0);
		fieldset.appendChild(stepInput);
		addDeleteCross(stepInput);
		loadFromEditing();
	});
}

function getModelFromEditing(el) {
	if (!el) return undefined;
	if (["input", "select"].includes(el.tagName.toLowerCase()) && el.type!="file") return el.type=="number" ? parseFloat(el.value) : el.type=="checkbox" ? el.checked : el.value;
	if (["fieldset", "div"].includes(el.tagName.toLowerCase())) {
		if (el.linearable) return getModelFromEditing(el.querySelector("input, select, fieldset, div"));
		var data = el.array ? [] : {};
		for (let input of el.children) {
			let value = getModelFromEditing(input);
			if (value!==undefined) {
				if (el.array) data.push(value);
				else data[input.name] = value;
			}
		}
		return data;
	}
	return undefined;
}

function loadImageFromUpload(fileInput) {
	if (!fileInput.files || !fileInput.files[0]) return;
	let reader = new FileReader();
	reader.addEventListener("load", () => {
		images["assets/"+fileInput.files[0].name] = newImage(reader.result);
		alert("L'image a bien été chargée et est utilisable avec l'URL : " + fileInput.files[0].name)
		console.info("Image got from file : " + fileInput.files[0].name);
	});
	reader.readAsDataURL(fileInput.files[0]);
}

function addDeleteCross(el, text="") {
	let close = document.createElement("span");
	close.innerText = "❌ " + text;
	close.className = "close-button";
	close.addEventListener("click", () => {
		el.parentElement.removeChild(el);
		close.parentElement.removeChild(close);
		loadFromEditing();
	});
	el.parentElement.appendChild(close);
	return el;
}

function addAddButton(div, text="", onclick=()=>{}) {
	let addButton = document.createElement("span");
	addButton.innerText = "➕ " + text;
	addButton.className = "add-button";
	addButton.addEventListener("click", onclick);
	div.appendChild(addButton);
}

function query(text) {
	var promise = new Promise((resolve, reject) => {
		var bg = document.createElement('div');
		bg.id = "query-bg";
		var div = document.createElement('div');
		div.id = "query";
		document.body.appendChild(bg);
		bg.addEventListener('click', (e) => {
			div.parentElement.removeChild(div);
			bg.parentElement.removeChild(bg);
			reject("Query aborted by user");
		});
		document.body.appendChild(div);
		var span = document.createElement('span');
		span.innerText = text + " ";
		div.appendChild(span);
		var input = document.createElement('input');
		input.type = 'text';
		input.addEventListener('keypress', (e) => {
			if (e.keyCode == 13) {
				div.parentElement.removeChild(div);
				bg.parentElement.removeChild(bg);
				resolve(input.value);
			}
		});
		div.appendChild(input);
		input.focus();
	});
	return promise;
}

		</script>
	</body>
</html>
