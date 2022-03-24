/**
 * 2D models rendering
 * Ambi 2020
 * v1.3
 * + miror option
 * + | dans les noms d'animations
 * + bh option
 * v1.2
 * + angles en degrés
 * + transparence
 * v1.1
 * + origine relative
 * + scale relatif
 * + sauvegarde
 * v1.0
 * image, origine, position, rotation, scale, enfants, animations, json, images
**/

var newImage = (src) => {
	var img = new Image();
	img.src = src;
	return img;
}

var images = {no: newImage("assets/no.png"), loading: newImage("assets/loading.png")};
var getImage = (src, ignoreLoading=false) => {
	src = "assets/" + src;
	if (images[src]) return images[src].complete || ignoreLoading ? images[src] : images.loading;
	console.info("Getting image : " + src);
	var img = new Image();
	img.onerror = () => {
		images[src] = images.no;
		console.info("Can't get image : " + src);
	}
	img.onload = () => {
		console.info("Image got : " + src);
	}
	img.src = src;
	images[src] = img;
	return ignoreLoading ? img : images.loading;
}

var models = {};
var getModel = (src) => {
	//src = "models/" + src;
	if (models[src]) return models[src]=="loading" ? models.loading : models[src];
	console.info("Getting model : " + src);
	loadModelFromJSONFile(src).then((model) => {
	    models[src] = model;
	    console.info("Model got : " + src);
	}).catch((reason) => {
	    models[src] = models.no;
	    console.info("Can't get model "+(reason?"("+reason+") ":"")+": " + src);
	}).catch(alert);
	models[src] = "loading";
	return models.loading;
}

var newModel = (data) => {
	var model = {};
	model.img = data.img || "no.png";
	model.origin = data.origin ? {x:data.origin.x!==undefined?data.origin.x:.5, y:data.origin.y!==undefined?data.origin.y:.5} : {x:.5, y:.5};
	model.pos = data.pos ? {x:data.pos.x||0, y:data.pos.y||0} : {x:0, y:0};
	model.rot = data.rot || 0;
	model.scale = data.scale ? {x:data.scale.x||1, y:data.scale.y||1} : {x:1, y:1};
	model.anims = data.anims || {};
	//model.pinneds = data.pinneds || [];
	model.pinneds = [];
	if (data.pinneds) for (let pinned of data.pinneds)
		model.pinneds.push(newModel(pinned));
	model.trsp = data.trsp || 0;
	model.bh = data.bh || false;
	return model;
}

var newAnim = (on="", steps=[], iN=1000, func="linear") => {
	var anim = {};
	anim.on = on;
	anim.steps = steps;
	anim.in = iN;
	if (!EasingFunctions[func]) throw "Unknow anim function : " + func;
	anim.func = func;
	return anim;
}

var loadModelFromJSONFile = (filePath, external=false) => {
	if (!external) filePath = "models/" + filePath;
	var promise = new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open("GET", filePath);
		request.onreadystatechange = function() {
			if (this.readyState == XMLHttpRequest.DONE && this.status == 200)
				resolve(JSON.parse(this.response));
			if (this.status == 404)
			    reject("404");
		}
		request.send();
	});
	return promise;
}

loadModelFromJSONFile("no.json").then((model)=>models.no=model);
loadModelFromJSONFile("loading.json").then((model)=>models.loading=model);

function renderModel(ctx, model, t, animName, options={}) { // t en ms
	let a = {};
	if (model.anims)
		for (let [name, subAnims] of Object.entries(model.anims)) if (name.split("|").includes(animName))
			for (let anim of subAnims) {
				let step = ~~(t%anim.in/anim.in*(anim.steps.length-1));
				let stepsN = (anim.steps.length-1);
				a[anim.on] = anim.steps[step]+EasingFunctions[anim.func](t%(anim.in/stepsN)/(anim.in/stepsN))*(anim.steps[step+1]-anim.steps[step]);
			}
	if (options.miror) ctx.scale(-1, 1);
	if (model.scale.x*(a.scaleX||1) !== 0 && model.scale.y*(a.scaleY||1) !== 0) {
		ctx.translate(model.pos.x+(a.posX||0), model.pos.y+(a.posY||0));
		ctx.rotate((model.rot+(a.rot||0))*Math.PI/180);
		ctx.scale(model.scale.x*(a.scaleX||1), model.scale.y*(a.scaleY||1));
		let img = getImage(model.img)
		ctx.translate(img.width*(-model.origin.x-(a.originX||0)), img.height*(-model.origin.y-(a.originY||0)));
		ctx.globalAlpha -= model.trsp+(a.trsp||0);
		for (let pinned of model.pinneds)
			if (pinned.bh) renderModel(ctx, pinned, t, animName);
		ctx.drawImage(img, 0, 0);
		for (let pinned of model.pinneds)
			if (!pinned.bh) renderModel(ctx, pinned, t, animName);
		ctx.globalAlpha += model.trsp+(a.trsp||0);
		ctx.translate(img.width*(model.origin.x+(a.originX||0)), img.height*(model.origin.y+(a.originY||0)));
		ctx.scale(1/model.scale.x/(a.scaleX||1), 1/model.scale.y/(a.scaleY||1));
		ctx.rotate((-model.rot-(a.rot||0))*Math.PI/180);
		ctx.translate(-model.pos.x-(a.posX||0), -model.pos.y-(a.posY||0));
	}
	if (options.miror) ctx.scale(-1, 1);
}
