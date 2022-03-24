<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>Création d'animations</title>
		<link rel="stylesheet" href="style.css" />
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
		<script src="create.js"></script>
	</body>
</html>
