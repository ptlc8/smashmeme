<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<title></title>
		<style>
html, body, #aff {
	margin: 0;
	width: 100%;
	height: 100%;
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
		<script src="models.js"></script>
	</head>
	<body>
		<canvas id="aff"></canvas>
		<script>

var background;
var menu = "connecting";
var cvs;
var ctx;
var wss;
var ping;
var allsmashers;
var self = {};
var players = [];
var startTime = 0; // en ms
var gameTime = 0; // en s/30
var smashers = {};
var entities = [];
var map;
var keysBuffer = {};
var gameBuffer = [];

window.addEventListener("load", async (e) => {
	cvs = document.getElementById("aff");
	cvs.width = parseInt(getComputedStyle(cvs).width);
	cvs.height = parseInt(getComputedStyle(cvs).height);
	if (!WebSocket) alert("Votre navigateur ne supporte pas les websockets :'(");
	wss = new WebSocket("<?php echo isset($_REQUEST['local']) ? "ws://localhost:13028" : "wss://play.agnd.fr:13028" ?>");
	wss.addEventListener("open", onopen);
	wss.addEventListener("message", onmessage);
	wss.addEventListener("error", onerror);
	wss.addEventListener("close", onclose);
	map = await loadMapFromJSONFile("crab-rave-island.json");
	background = {};
	background.model = await loadModelFromJSONFile("crab-rave-island.json");
	background.anim = {name: "default", start: Date.now()};
	allsmashers = {
		"knuckle": {name: "Knuckle", id: "knuckle", model: await loadModelFromJSONFile("knuckle.json?2"), behaviours: await loadBehaviourFromJSONFile("knuckle.json?2")},
		"coffin-dancers": {name: "Coffin dancers", id: "coffin-dancers", model: await loadModelFromJSONFile("coffin-dancers.json?2"), behaviours: await loadBehaviourFromJSONFile("coffin-dancers.json?2")},
		"buffed-doge": {name: "Buffed doge", id: "buffed-doge", model: await loadModelFromJSONFile("buffed-doge.json?8"), behaviours: await loadBehaviourFromJSONFile("buffed-doge.json?6")},
		"glob": {name: "Globglogabgalab", id: "glob", model: await loadModelFromJSONFile("glob.json?1"), behaviours: await loadBehaviourFromJSONFile("glob.json?1")},
		"raptor": {name: "Raptor Jésus", id: "raptor", model: await loadModelFromJSONFile("raptor.json?1"), behaviours: await loadBehaviourFromJSONFile("raptor.json")},
		"bongo-cat": {name: "Bongo cat", id: "bongo-cat", model: await loadModelFromJSONFile("bongo-cat.json?2"), behaviours: await loadBehaviourFromJSONFile("bongo-cat.json?5")}
	};
	ctx = cvs.getContext("2d");
	var startT = Date.now();
	setInterval(() => {
		render(ctx, startT);
	}, 1000/40);
	setInterval(() => {
		update();
	}, 1000/30);
});

window.addEventListener("resize", (e) => {
	cvs.width = parseInt(getComputedStyle(cvs).width);
	cvs.height = parseInt(getComputedStyle(cvs).height);
});

var keys = {up:false, right:false, down:false, left:false, jump:false, attack:false, special:false, shield:false};
var keysXCode = [["KeyW","jump"], ["KeyW","up"], ["KeyD","right"], ["KeyS","down"], ["KeyA","left"], ["Space","jump"], ["KeyO","attack"], ["KeyK","special"], ["Semicolon","shield"], ["ShiftLeft","shield"]];
window.addEventListener("keydown", (e) => {
	for (let [code, action] of keysXCode)
		if (code == e.code && !keys[action]) {
			keys[action] = true;
			if (menu == "game") wss.send("keys " + shortifyKeys(keys));
		}
});
window.addEventListener("keyup", (e) => {
	for (let [code, action] of keysXCode)
		if (code == e.code && keys[action]) {
			keys[action] = false;
			if (menu == "game") wss.send("keys " + shortifyKeys(keys));
		}
});


async function onopen(e) {
	console.info("[WSS] Connected");
	//wss.send("ping " + Date.now());
	wss.send("setname " + await query("Pseudonyme ?"));
}
function onmessage(e) {
	console.info("[WSS] Server : " + e.data);
	let command = e.data.split(" ")[0];
	let arg = e.data.replace(command, "").trim()
	let json, args;
	switch (command) {
	/*case "pong":
		ping = (Date.now() - parseInt(arg));
		console.info("[WSS] Ping : " + ping + " ms")
		break;*/
	case "pong":
	    wss.send(e.data);
	    break;
	case "ping":
	    ping = parseInt(arg);
		console.info("[WSS] Ping : " + ping + " ms")
	    break;
	case "welcome":
		self.id = arg;
		break;
	case "namesetted":
		self.name = arg;
		menu = "main";
		break;
	case "gamejoined":
		players = JSON.parse(arg);
		menu = "choose";
		break;
	case "playerjoined":
		players.push(JSON.parse(arg));
		break;
	case "smasherchoosed":
		for (let player of players) if (player.id == arg.split(" ")[0]) player.smasherName = arg.replace(player.id, "").trim();
		break;
	case "ready":
		for (let player of players) if (player.id == arg) player.ready = true;
		break;
	case "start":
		json = JSON.parse(arg);
		players = json.players;
		map = json.map;
		startTime = Date.now()+1000; // tmp : rollback forced
		gameTime = 0;
		smashers = {};
		entities = [];
		gameBuffer = [];
		for (let player of players) {
			entities.push(smashers[player.id] = newSmasher(allsmashers[player.smasherName], player.id));
		}
		gameBuffer[0] = clone(entities);
		menu = "game";
		break;
	case "keys":
		args = arg.split(" ");
		if (!keysBuffer[parseInt(args[1])]) keysBuffer[parseInt(args[1])] = {0: {up:false, right:false, down:false, left:false, jump:false, attack:false, special:false, shield:false}};
		keysBuffer[parseInt(args[1])][parseInt(args[0])] = parseKeys(parseInt(args[2]));
		if (parseInt(args[0]) < gameTime) { // rollback
			gameTime = parseInt(parseInt(args[0])/30) * 30;
			entities = clone(gameBuffer[parseInt(parseInt(args[0])/30)]);
		}
		break;
	/*case "fresh":
		for (let e of arg.split(",")) {
			let d = e.split(" ");
			for (let entity of entities) if (entity.id == parseInt(d[0])) {
				entity.pos.x = parseInt(d[1]);
				entity.pos.y = parseInt(d[2]);
				entity.spd.x = parseInt(d[3]);
				entity.spd.y = parseInt(d[4]);
				entity.acc.x = parseInt(d[5]);
				entity.acc.y = parseInt(d[6]);
			}
		}
		break;*/
	}
}
function onerror(e, f) {
	console.info("[WSS] Error");
}
function onclose(e) {
	console.info("[WSS] Disconnected" + (e.reason ? " : " + e.reason : ""));
}


function render(ctx, startT) {
	if (ctx.resetTransform) ctx.resetTransform();
	ctx.clearRect(0, 0, cvs.width, cvs.height);
	switch (menu) {
		case "choose":
			renderChooseMenu(ctx, startT);
			break;
			
		case "game":
			renderGame(ctx, startT);
			break;
		
		case "main":
			renderText(ctx, "Cliquez pour rejoindre une partie", cvs.width/2, cvs.height/2, 96);
			break;
	}
}


window.addEventListener("click", (e) => {
	var w = cvs.width, h = cvs.height;
	switch (menu) {
		case "choose":
			let perL = 6;
			if (e.button == 0 && w/8 < e.clientX && e.clientX < 7*w/8) {
				let index = parseInt(e.clientY/(w/8))*perL+parseInt(e.clientX/(w/8)-1);
				if (index < Object.keys(allsmashers).length) wss.send("choosesmasher " + Object.keys(allsmashers)[index]);
			}
			if (e.button == 0 && h-250 < e.clientY && e.clientY <= h-186)
				wss.send("ready");
			break;
		case "main":
			wss.send("joingame");
			break;
	}
	e.clientX, e.clientY, e.button==0;
});


function update() {
	switch (menu) {
		case "choose":
			updateChooseMenu();
			break;
		
		case "game":
			while (gameTime < (Date.now()-startTime)/33) updateGame(); // (int)(1000/3) = 33
			break;
	}
}


function renderChooseMenu(ctx, startT) {
	var w = cvs.width;
	var h = cvs.height;
	var z = w/3200;
	// Affichage du fond
	ctx.translate(w/2, h/2);
	renderModel(ctx, background.model, Date.now()-background.anim.start, background.anim.name);
	ctx.translate(-w/2, -h/2);
	// Affichage des persos
	ctx.scale(z, z);
	ctx.translate(200+w/8/z, 400);
	let perL = 6; // = parseInt(w/400/z*3/4)
	for (let i = 0; i < Object.keys(allsmashers).length/perL; i++) {
		for (let j = 0; j < perL && j+perL*i < Object.keys(allsmashers).length; j++) {
			ctx.translate(j*400, i*400);
			let smasher = Object.values(allsmashers)[i*perL+j];
			let behaviours = allbehaviours[smasher.behaviours];
			renderModel(ctx, smasher.model, Date.now()-startT, "idle" + (behaviours["idle"]&&behaviours["idle"].directionable?"-right":""));
			renderText(ctx, smasher.name, 0, 64, 48, "#f5f5f5");
			ctx.translate(-j*400, -i*400);
		}
	}
	ctx.translate(-200-w/8/z, -400);
	ctx.scale(1/z, 1/z);
	// Affichage du bouton prêt
	ctx.fillStyle = "#111111";
	ctx.fillRect(0, h-250, w, 64);
	renderText(ctx, players.find(p=>p.id==self.id).ready?"PRÊT !":"PRÊT ?", w/2, h-200, 48, "#f5f5f5");
	// Affichage des joueurs
	ctx.scale(.5, .5);
	ctx.translate(0, 2*h-100);
	for (let i = 0; i < players.length; i++) {
		ctx.translate((i+.5)*w/players.length*2, 0);
		if (players[i].smasherName) renderModel(ctx, allsmashers[players[i].smasherName].model, Date.now()-startT, "idle");
		renderText(ctx, players[i].name + (players[i].ready ? " [PRÊT]" : ""), 0, 64, 48, "#f5f5f5");
		ctx.translate(-(i+.5)*w/players.length*2, 0);
	}
	ctx.translate(0, -2*h+100);
	ctx.scale(2, 2);
}

function updateChooseMenu() {
	
}


function renderGame(ctx, startT) { // t en ms
	ctx.translate(cvs.width/2, cvs.height/2);
	renderModel(ctx, background.model, Date.now()-background.anim.start, background.anim.name);
	
	var z = Math.max(400/cvs.width, 400/cvs.height);
	var centerZ = entities[0] ? {x:entities[0].pos.x, y:entities[0].pos.y-100} : {x:0, y:0};
	for (let i = 0; i < entities.length; i++) for (let j = i+1; j < entities.length; j++) {
		let nz;
		if ((nz = Math.max((Math.abs(entities[i].pos.x - entities[j].pos.x)+400)/cvs.width, (Math.abs(entities[i].pos.y - entities[j].pos.y)+400)/cvs.height)) > z) {
			z = nz;
			centerZ.x = (entities[i].pos.x+entities[j].pos.x) / 2;
			centerZ.y = (entities[i].pos.y+entities[j].pos.y) / 2 - 100;
		}
	}
	ctx.scale(1/z/2, 1/z/2);
	ctx.translate(-centerZ.x, -centerZ.y);
	for (let platform of map.platforms) {
		ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
	}
	for (let entity of entities) {
	    let behaviours = allbehaviours[entity.behaviours];
		ctx.translate(entity.pos.x, entity.pos.y);
		/*if (behaviours[entity.anim.name] && Date.now()-entity.anim.start > behaviours[entity.anim.name].in) {
			entity.anim.name = "idle" + ((behaviours.idle && behaviours.idle.directionable)?"-"+entity.direction:"");;
			entity.anim.start = Date.now();
		}*/
		renderModel(ctx, entity.model, (gameTime-entity.anim.start)*30, entity.anim.name);
		ctx.translate(-entity.pos.x, -entity.pos.y);
	}
	ctx.translate(centerZ.x, centerZ.y);
	ctx.scale(z*2, z*2);
	
	ctx.translate(-cvs.width/2, -cvs.height/2);
}

function updateGame() {
	for (let entity of entities) {
		if (Object.keys(keysBuffer).includes(entity.id+"")) {
			let keys = keysBuffer[entity.id][Object.keys(keysBuffer[entity.id]).reduce((a,b) => parseInt(a)<parseInt(b) && parseInt(b)<gameTime ? b : a, 0)];
			let behaviours = allbehaviours[entity.behaviours];
			let behaviour = behaviours[entity.anim.name] || {};
			
			if (entity.attacking && gameTime-entity.anim.start >= behaviour.in/30) {
	    	    entity.attacking = false;
	    	    entity.anim.name = "idle" + (behaviours.idle&&behaviours.idle.directionable?"-"+entity.direction:"");
	    	    behaviour = behaviours[entity.anim.name] || {};
	        }
			
			if (true) {
				if (!behaviour["block-move"]) {
					if (keys.right && !keys.left) {
						entity.acc.x += behaviours.speed;
						if (entity.anim.name != "walk-right" && !entity.attacking) {
							entity.direction = "right";
							entity.anim.name = "walk-right";
							entity.anim.start = gameTime;
						}
					} else if (keys.left && !keys.right) {
						entity.acc.x += -behaviours.speed;
						if (entity.anim.name != "walk-left" && !entity.attacking) {
							entity.direction = "left";
							entity.anim.name = "walk-left";
							entity.anim.start = gameTime;
						}
					} else {
						if (entity.anim.name == "walk-left" || entity.anim.name == "walk-right") {
							entity.anim.name = "idle" + ((behaviours.idle && behaviours.idle.directionable)?"-"+entity.direction:"");
							entity.anim.start = gameTime;
						}
					}
				}
				if (keys.attack && !entity.attacking) {
					if (keys.right && !keys.left) {
						entity.anim.name = "attack-right";
						entity.anim.start = gameTime;
						entity.attacking = true;
					} else if (keys.left && !keys.right) {
						entity.anim.name = "attack-left";
						entity.anim.start = gameTime;
						entity.attacking = true;
					} else if (keys.up && !keys.down) {
						entity.anim.name = "attack-up";
						entity.anim.start = gameTime;
						entity.attacking = true;
					} else if (keys.down && !keys.up) {
						entity.anim.name = "attack-down";
						entity.anim.start = gameTime;
						entity.attacking = true;
					}
				} else if (keys.special && !entity.attacking) {
					if (keys.right && !keys.left) {
						entity.anim.name = "special-right";
						entity.anim.start = gameTime;
						entity.attacking = true;
					} else if (keys.left && !keys.right) {
						entity.anim.name = "special-left";
						entity.anim.start = gameTime;
						entity.attacking = true;
					} else if (keys.up && !keys.down && !entity.specialUp) {
						let animName = "special-up"+(behaviours["special-up"].directionable?"-"+entity.direction:"");
						entity.anim.name = animName;
						entity.anim.start = gameTime;
						entity.attacking = true;
						entity.specialUp = true;
					} else if (keys.down && !keys.up) {
						let animName = "special-down"+(behaviours["special-down"].directionable?"-"+entity.direction:"");
						entity.anim.name = animName;
						entity.anim.start = gameTime;
						entity.attacking = true;
					}
				}
				
				behaviour = behaviours[entity.anim.name] || {};
				if (keys.jump && !behaviour["block-jump"] && entity.jumps < behaviours.jumps) {
					if (!entity.hasJump) {
						entity.spd.y += -behaviours.jump.value;
						if (!entity.attacking) {
							entity.anim.start = gameTime;
							entity.anim.name = "jump";
						}
						entity.hasJump = true;
						entity.jumps++;
					}
				} else entity.hasJump = false;
			} 
			if (entity.attacking) {
				if (behaviour) {
					if (behaviour.move ) {
						entity.acc.x += behaviour.move.x;
						entity.acc.y += behaviour.move.y;
					}
				}
			}
			entity.weight = keys.down ? 1 : .5;
		}
		
		// Application des forces de déplacements
		entity.pos.x += entity.spd.x;
		entity.spd.x += entity.acc.x;
		entity.spd.x /= 1.5; // frottement x
		entity.acc.x = 0;
		entity.spd.y = Math.min(entity.spd.y, getDistanceFromFloor(entity.pos.x, entity.pos.y))
		entity.pos.y += entity.spd.y;
		entity.spd.y += entity.acc.y;
		entity.spd.y /= 1.5; // frottement y
		if (getDistanceFromFloor(entity.pos.x, entity.pos.y) <= 0 && entity.spd.y >= 0) { // si au sol
			if (entity.acc.y > 0) entity.acc.y = 0;
			entity.jumps = 0;
			entity.specialUp = false;
		} else {
			entity.acc.y = entity.weight*32.7; // g sur Terre en cm.(s/30)^-2 /3
		}
	}
	gameTime++;
	if (gameTime%30 == 0) {
		gameBuffer[gameTime/30] = clone(entities);
	}
}


function renderText(ctx, text="", x=0, y=0, size=10, color) {
	ctx.textAlign = "center";
	ctx.font = size + "px Arial";
	if (color) ctx.fillStyle = color;
	ctx.fillText(text, x, y);
}


function shortifyKeys(keys) {
	var shortedKeys = keys.shield?1:0;
	shortedKeys *= 2;
	shortedKeys += keys.special?1:0;
	shortedKeys *= 2;
	shortedKeys += keys.attack?1:0;
	shortedKeys *= 2;
	shortedKeys += keys.jump?1:0;
	shortedKeys *= 2;
	shortedKeys += keys.left?1:0;
	shortedKeys *= 2;
	shortedKeys += keys.down?1:0;
	shortedKeys *= 2;
	shortedKeys += keys.right?1:0;
	shortedKeys *= 2;
	shortedKeys += keys.up?1:0;
	return shortedKeys;
}

function parseKeys(shortedKeys) {
	var keys = {};
	keys.up = shortedKeys%2 == 1;
	shortedKeys = parseInt(shortedKeys / 2);
	keys.right = shortedKeys%2 == 1;
	shortedKeys = parseInt(shortedKeys / 2);
	keys.down = shortedKeys%2 == 1;
	shortedKeys = parseInt(shortedKeys / 2);
	keys.left = shortedKeys%2 == 1;
	shortedKeys = parseInt(shortedKeys / 2);
	keys.jump = shortedKeys%2 == 1;
	shortedKeys = parseInt(shortedKeys / 2);
	keys.attack = shortedKeys%2 == 1;
	shortedKeys = parseInt(shortedKeys / 2);
	keys.special = shortedKeys%2 == 1;
	shortedKeys = parseInt(shortedKeys / 2);
	keys.shield = shortedKeys%2 == 1;
	return keys;
}


function getDistanceFromFloor(x, y) {
	let dist = Infinity;
	for (let platform of map.platforms) {
		if (platform.x <= x && x <= platform.x+platform.w && y <= platform.y) {
			dist = Math.min(dist, platform.y-y);
		}
	}
	return dist;
}


function newSmasher(data={}, id) {
	var smasher = newEntity(data, id);
	//smasher.keysBuffer = {0: {up:false, right:false, down:false, left:false, jump:false, attack:false, special:false, shield:false}};
	return smasher;
}

function newEntity(data={}, id=undefined) {
	var entity = {};
	entity.id = id || -1; // TODO
	entity.pos = data.pos ? {x:data.pos.x||0, y:data.pos.y||0} : {x:0, y:0};
	entity.model = data.model || ""; // TODO : default model ?
	entity.anim = data.anim ? {start:data.anim.start||gameTime, name:data.anim.name||"idle"} : {start:gameTime, name:"idle"};
	entity.behaviours = data.behaviours || ""; // TODO : default behaviours ?
	entity.direction = data.direction || "right";
	entity.spd = data.spd ? {x:data.spd.x||0, y:data.spd.y||0} : {x:0, y:0};
	entity.acc = data.acc ? {x:data.acc.x||0, y:data.acc.y||0} : {x:0, y:0};
	entity.weight = 1;
	return entity;
}

function clone(o) {
    // TODO
    return JSON.parse(JSON.stringify(o));
}

var allbehaviours = {};
var loadBehaviourFromJSONFile = (filePath, external=false) => {
	if (!external) filePath = "behaviours/" + filePath;
	var promise = new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open("GET", filePath);
		request.onreadystatechange = function() {
			if (this.readyState == XMLHttpRequest.DONE && this.status == 200)
			    allbehaviours[filePath] = JSON.parse(this.response);
				resolve(filePath);
		}
		request.send();
	});
	return promise;
}

var loadMapFromJSONFile = (filePath, external=false) => {
	if (!external) filePath = "maps/" + filePath;
	var promise = new Promise((resolve, reject) => {
		var request = new XMLHttpRequest();
		request.open("GET", filePath);
		request.onreadystatechange = function() {
			if (this.readyState == XMLHttpRequest.DONE && this.status == 200)
				resolve(JSON.parse(this.response));
		}
		request.send();
	});
	return promise;
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