var background;
var model;
var zoom = 1;
var x = 0;
var y = 0;

window.addEventListener("load", async () => {
	var cvs = document.getElementById("preview");
	cvs.width = cvs.height = 600;
	cvs.addEventListener("wheel", (e) => {
	    e.preventDefault();
	    zoom *= Math.pow(2, -e.deltaY*0.001);
	});
	cvs.addEventListener("mousemove", function(e) {
		if (e.buttons%2==1) {
			e.target.style.cursor = "grabbing";
			x += e.movementX;
			y += e.movementY;
		} else
			e.target.style.cursor = "grab";
	});
	background = newModel({
		img: "grid.png"
	});
    var urlParams = new URLSearchParams(window.location.search);
    model = urlParams.has("from") ? await loadModelFromJSONFile(urlParams.get("from")+".json") : newModel({});
	if (!urlParams.has("from")) loadFromSave();
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
		ctx.translate(300+x, 400+y);
		ctx.scale(zoom, zoom);
		renderModel(ctx, background, Date.now()-startT, "default");
		renderModel(ctx, model, Date.now()-startT, animSelect.value);
		ctx.scale(1/zoom, 1/zoom);
		ctx.translate(-300-x, -400-y);
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

function convertToGif(duration, delay, quality) {
	if (duration===undefined)
		duration = parseInt(prompt("Quelle durée du gif en ms ?"));
	if (delay===undefined)
		delay = parseInt(prompt("Quelle durée entre deux images em ms ?"));
	if (quality===undefined)
		quality = parseInt(prompt("Quelle qualité ? (4 : bonne, 10 : correct, 20 : légère)"));
	var gif = new GIF({
		quality: quality
	});
	var animName = document.getElementById("anim-select").value;
	console.log("[GIF] Création des images");
	for (var i = 0; i < duration; i+=delay) {
		var cvs = document.createElement("canvas");
		cvs.width = cvs.height = 600;
		var ctx = cvs.getContext("2d");
		ctx.translate(300+x, 400+y);
		ctx.scale(zoom, zoom);
		renderModel(ctx, model, i, animName);
		ctx.scale(1/zoom, 1/zoom);
		ctx.translate(-300+x, -400+y);
		gif.addFrame(cvs, {delay:delay});
	}
	gif.on("finished", function(blob) {
		window.open(URL.createObjectURL(blob));
		console.log("[GIF] Gif créé");
	});
	console.log("[GIF] Conversion en gif");
	gif.render();
}