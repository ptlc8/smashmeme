<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>Visualisation de modèle</title>
		<style>
html, body {
	margin: 0;
	width: 100%;
	height: 100%;
}
#aff {
	max-height: 100%;
	max-width: 100%;
	vertical-align: middle;
}
		</style>
		<script src="easing.js"></script>
		<script src="models.js"></script>
	</head>
	<body>
		<canvas id="aff"></canvas>
		<select id="anims"></select>
		<script>

window.addEventListener("load", async () => {
	var cvs = document.getElementById("aff");
	cvs.width = 800;
	cvs.height = 800;
	var startT = Date.now();
	var model = await loadModelFromJSONFile("<?php echo $_REQUEST['model']; ?>.json");
	var bg = newModel({
		img: "grid.png"
	});
	refreshAnimSelect(document.getElementById("anims"), model);
	setInterval(() => {
		var ctx = cvs.getContext("2d");
		ctx.resetTransform();
		ctx.clearRect(0, 0, cvs.width, cvs.height);
		ctx.translate(400, 400);
		renderModel(ctx, bg, 0, "default");
		renderModel(ctx, model, Date.now()-startT, document.getElementById("anims").value);
		ctx.translate(-400, -400);
	}, 1000/60);
});

function refreshAnimSelect(animSelect, model) {
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

		</script>
	</body>
</html>
