<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>ssmfum ?</title>
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
		<script src="collision.js"></script>
		<script src="smashmeme.js"></script>
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
var lastKeysIndex = -1;
var gameBuffer = [];

window.addEventListener("load", async (e) => {
	cvs = document.getElementById("aff");
	cvs.width = parseInt(getComputedStyle(cvs).width);
	cvs.height = parseInt(getComputedStyle(cvs).height);
	if (!WebSocket) alert("Votre navigateur ne supporte pas les websockets :'(");
	wss = new WebSocket("<?php echo isset($_REQUEST['local']) ? "ws://localhost:13028" : "wss://play.agnd.fr:13028" ?>");
	wss.addEventListener("open", onopen);
	wss.addEventListener("message", onmessage);
	wss.addEventListener("error", onerror);""
	wss.addEventListener("close", onclose);
	map = await loadMapFromJSONFile("crab-rave-island.json");
	background = {};
	background.model = "crab-rave-island.json";
	background.anim = {name: "default", start: Date.now()};
	allsmashers = {
		"knuckle": {name: "Knuckle", id: "knuckle", model: "knuckle.json?2", behaviours: await loadBehaviourFromJSONFile("knuckle.json?2"), hitbox:Collision.parseShape("c 0 -60 50")},
		"coffin-dancers": {name: "Coffin dancers", id: "coffin-dancers", model: "coffin-dancers.json?2", behaviours: await loadBehaviourFromJSONFile("coffin-dancers.json?2"), hitbox:Collision.parseShape("c 0 -100 100")},
		"buffed-doge": {name: "Buffed doge", id: "buffed-doge", model: "buffed-doge.json?8", behaviours: await loadBehaviourFromJSONFile("buffed-doge.json?7"), hitbox:Collision.parseShape("c 0 -100 100")},
		"glob": {name: "Globglogabgalab", id: "glob", model: "glob.json?1", behaviours: await loadBehaviourFromJSONFile("glob.json?1"), hitbox:Collision.parseShape("c 0 -105 105")},
		"raptor": {name: "Raptor Jésus", id: "raptor", model: "raptor.json?1", behaviours: await loadBehaviourFromJSONFile("raptor.json"), hitbox:Collision.parseShape("c 0 -240 120")},
		"bongo-cat": {name: "Bongo cat", id: "bongo-cat", model: "bongo-cat.json?2", behaviours: await loadBehaviourFromJSONFile("bongo-cat.json?7"), hitbox:Collision.parseShape("c 0 -50 50")}
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
			if (menu == "game") {
				wss.send("keys " + shortifyKeys(keys));
				/*let asyncKeys = clone(keys);
				asyncKeys.async = true;
				if (!keysBuffer[self.id]) keysBuffer[self.id] = {0: parseKeys(0)}; 
				keysBuffer[self.id][gameTime] = asyncKeys;*/
			}
		}
});
window.addEventListener("keyup", (e) => {
	for (let [code, action] of keysXCode)
		if (code == e.code && keys[action]) {
			keys[action] = false;
			if (menu == "game") {
				wss.send("keys " + shortifyKeys(keys));
				/*let asyncKeys = clone(keys);
				asyncKeys.async = true;
				if (!keysBuffer[self.id]) keysBuffer[self.id] = {0: parseKeys(0)}; 
				keysBuffer[self.id][gameTime] = asyncKeys;*/
			}
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
		startTime = Date.now();
		gameTime = 0;
		smashers = {};
		entities = clone([]);
		entities.push(); // clonabilité
		keysBuffer = {};
		lastKeysIndex = -1;
		gameBuffer = [];
		for (let player of players) {
			entities.push(smashers[player.id] = newSmasher(allsmashers[player.smasherName], player.id));
		}
		gameBuffer[0] = clone(entities);
		menu = "game";
		break;
	case "keys":
		args = arg.split(" "); // [index, t, player, keys]
		for (let i = ++lastKeysIndex; i < parseInt(args[0]); i++) // recuperation de données perdues
			wss.send("getkeys " + i);
		if (!keysBuffer[parseInt(args[2])]) keysBuffer[parseInt(args[2])] = {0: {up:false, right:false, down:false, left:false, jump:false, attack:false, special:false, shield:false}};
		keysBuffer[parseInt(args[2])][parseInt(args[1])] = parseKeys(parseInt(args[3]));
		/*if (args[1] == self.id) {
			let tRollBack = parseInt(args[1]);
			for (let [t, k] of Object.entries(keysBuffer[parseInt(self.id)])) {
				if (k.async && parseInt(t)<parseInt(args[1])) {
					delete keysBuffer[parseInt(self.id)][t];
					tRollBack = parseInt(t);
				}
			}
			if (tRollBack < gameTime) {
				gameTime = parseInt(tRollBack/30) * 30;
				entities = clone(gameBuffer[parseInt(tRollBack/30)]);
			}
		} else */if (parseInt(args[1]) < gameTime) { // rollback
			gameTime = parseInt(parseInt(args[1])/30) * 30;
			entities = clone(gameBuffer[parseInt(parseInt(args[1])/30)]);
		}
		break;
	}
}
function onerror(e, f) {
	console.info("[WSS] Error");
}
function onclose(e) {
	console.info("[WSS] Disconnected" + (e.reason ? " : " + e.reason : ""));
	alert("Non connecté au serveur.");
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
	renderModel(ctx, getModel(background.model), Date.now()-background.anim.start, background.anim.name);
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
			renderModel(ctx, getModel(smasher.model), Date.now()-startT, "idle" + (behaviours["idle"]&&behaviours["idle"].directionable?"-right":""));
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
		if (players[i].smasherName) renderModel(ctx, getModel(allsmashers[players[i].smasherName].model), Date.now()-startT, "idle");
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
	renderModel(ctx, getModel(background.model), Date.now()-background.anim.start, background.anim.name);
	
	var z = entities.length>1 ? 0 : Math.max(400/cvs.width, 400/cvs.height);
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
		renderModel(ctx, getModel(entity.model), (gameTime-entity.anim.start)*30, entity.anim.name);
		ctx.translate(-entity.pos.x, -entity.pos.y);
	}
	ctx.translate(centerZ.x, centerZ.y);
	ctx.scale(z*2, z*2);
	
	ctx.translate(-cvs.width/2, -cvs.height/2);
	
	// damages
	let w = cvs.width/Math.max(8, players.length);
	let d = w*(8-players.length)/(players.length+1);
	for (let [i, player] of players.entries()) {
		renderText(ctx, player.name, d+(d+w)*i+w/2, cvs.height-parseInt(w/2), w/6, "whitesmoke");
		renderText(ctx, entities.find(e=>e.id==player.id).damage+"%", d+(d+w)*i+w/2, cvs.height-w/12, w/3, "whitesmoke");
	}
	
}

function updateGame() {
	var entitiesToAdd = [];
	var entitiesToRemove = [];
	for (let entity of entities) {
		// update !!
		if (entity.update) entity.update(gameTime, {addEntity:(e)=>entitiesToAdd.push(e), removeEntity:(e)=>entitiesToRemove.push(e), entities:entities});
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
	
	for (let e of entitiesToAdd) entities.push(e);
	for (let e of entitiesToRemove)
		for (let i = 0; i < entities.length; i++)
			if (entities[i] === e) {
				entities.splice(i, 1);
				i--;
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


/*class Entity {
	constructor(data={}, id=undefined) {
		this.id = id || -1; // TODO
		this.pos = data.pos ? {x:data.pos.x||0, y:data.pos.y||0} : {x:0, y:0};
		this.model = data.model || ""; // TODO : default model ?
		this.anim = data.anim ? {start:data.anim.start||gameTime, name:data.anim.name||"idle"} : {start:gameTime, name:"idle"};
		this.behaviours = data.behaviours || ""; // TODO : default behaviours ?
		this.direction = data.direction || "right";
		this.spd = data.spd ? {x:data.spd.x||0, y:data.spd.y||0} : {x:0, y:0};
		this.acc = data.acc ? {x:data.acc.x||0, y:data.acc.y||0} : {x:0, y:0};
		this.weight = data.weight===undefined ? 1 : data.weight;
		this.hitbox = data.hitbox || undefined;
	}
}*/

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
	entity.weight = data.weight===undefined ? 1 : data.weight;
	entity.hitbox = data.hitbox || undefined;
	return entity;
}

function newSmasher(data={}, id) {
	var smasher = newEntity(data, id);
	smasher.damage = data.damage || 0;
	smasher.update = function(gameTime, game) {
		if (Object.keys(keysBuffer).includes(this.id+"")) {
			let keys = keysBuffer[this.id][Object.keys(keysBuffer[this.id]).reduce((a,b) => parseInt(a)<parseInt(b) && parseInt(b)<gameTime ? b : a, 0)];
			let behaviours = allbehaviours[this.behaviours];
			
			if (this.pos.y > 2000) {
			    // TODO
			    this.pos.x = 0;
			    this.pos.y = -500;
			}
			
			let behaviour = behaviours[this.anim.name] || {};
			
			if (this.attacking && gameTime-this.anim.start >= (behaviour.in||0)/30) {
				this.attacking = false;
				this.anim.name = "idle" + (behaviours.idle&&behaviours.idle.directionable?"-"+this.direction:"");
				behaviour = behaviours[this.anim.name] || {};
			}
			
			if (!behaviour["block-move"]) {
				if (keys.right && !keys.left) {
					this.acc.x += behaviours.speed;
					if (this.anim.name != "walk-right" && !this.attacking) {
						this.direction = "right";
						this.anim.name = "walk-right";
						this.anim.start = gameTime;
					}
				} else if (keys.left && !keys.right) {
					this.acc.x += -behaviours.speed;
					if (this.anim.name != "walk-left" && !this.attacking) {
						this.direction = "left";
						this.anim.name = "walk-left";
						this.anim.start = gameTime;
					}
				} else {
					if (this.anim.name == "walk-left" || this.anim.name == "walk-right") {
						this.anim.name = "idle" + ((behaviours.idle && behaviours.idle.directionable)?"-"+this.direction:"");
						this.anim.start = gameTime;
					}
				}
			}
			if (keys.attack && !this.attacking) {
				if (keys.right && !keys.left) {
					this.anim.name = "attack-right";
					this.anim.start = gameTime;
					this.attacking = true;
				} else if (keys.left && !keys.right) {
					this.anim.name = "attack-left";
					this.anim.start = gameTime;
					this.attacking = true;
				} else if (keys.up && !keys.down) {
					this.anim.name = "attack-up";
					this.anim.start = gameTime;
					this.attacking = true;
				} else if (keys.down && !keys.up) {
					this.anim.name = "attack-down";
					this.anim.start = gameTime;
					this.attacking = true;
				}
			} else if (keys.special && !this.attacking) {
				if (keys.right && !keys.left) {
					this.anim.name = "special-right";
					this.anim.start = gameTime;
					this.attacking = true;
				} else if (keys.left && !keys.right) {
					this.anim.name = "special-left";
					this.anim.start = gameTime;
					this.attacking = true;
				} else if (keys.up && !keys.down && !this.specialUp) {
					let animName = "special-up"+(behaviours["special-up"]&&behaviours["special-up"].directionable?"-"+this.direction:"");
					this.anim.name = animName;
					this.anim.start = gameTime;
					this.attacking = true;
					this.specialUp = true;
				} else if (keys.down && !keys.up) {
					let animName = "special-down"+(behaviours["special-down"]&&behaviours["special-down"].directionable?"-"+this.direction:"");
					this.anim.name = animName;
					this.anim.start = gameTime;
					this.attacking = true;
				}
			}
			
			behaviour = behaviours[this.anim.name] || {};
			
			if (behaviour.damage) {
				if (parseInt(behaviour.damage.at/30) == gameTime-this.anim.start) {
					for (let entity of game.entities) {
						if (entity.damage !== undefined && entity != this && Collision.has({x:this.pos.x+behaviour.damage.pos.x, y:this.pos.y+behaviour.damage.pos.y}, Collision.parseShape(behaviour.damage.hitbox), 0, entity.pos, entity.hitbox, 0)) {
							if (behaviour.damage.value) entity.damage += behaviour.damage.value;
							if (behaviour.damage.kb) {
							    let kb = {x:entity.pos.x - this.pos.x - behaviour.damage.pos.x, y:entity.pos.y - this.pos.y - behaviour.damage.pos.y}
							    let kbL = Math.hypot(kb.x, kb.y);
							    entity.acc.x += kb.x / kbL * (entity.damage*behaviour.damage.kb);
							    entity.acc.y += kb.y / kbL * (entity.damage*behaviour.damage.kb);
							}
						}
					}
				}
			}
			
			if (behaviour.thrOw) {
				if (parseInt(behaviour.thrOw.at/30) == gameTime-this.anim.start) {
					game.addEntity(newThrowed({move:behaviour.thrOw.move, weight:behaviour.thrOw.weight, duration:behaviour.thrOw.in/30, model:behaviour.thrOw.model+".json", pos:{x:this.pos.x+(behaviour.thrOw.pos?behaviour.thrOw.pos.x:0), y:this.pos.y+(behaviour.thrOw.pos?behaviour.thrOw.pos.y:0)}, "anim":{"name":"throw-"+this.direction, "start":gameTime}}));
				}
			}
			
			if (keys.jump && !behaviour["block-jump"] && this.jumps < behaviours.jumps) {
				if (!this.hasJump) {
					this.spd.y += -behaviours.jump.value;
					if (!this.attacking) {
						this.anim.start = gameTime;
						this.anim.name = "jump";
					}
					this.hasJump = true;
					this.jumps++;
				}
			} else this.hasJump = false;
		 
			if (this.attacking) {
				if (behaviour) {
					if (behaviour.move ) {
						this.acc.x += behaviour.move.x;
						this.acc.y += behaviour.move.y;
					}
				}
			}
			this.weight = keys.down ? 1 : .5;
		}
	};
	return smasher;
}

function newThrowed(data={}, id) {
	var throwed = newEntity(data, id);
	throwed.move = data.move ? {x:data.move.x||0, y:data.move.y||0} : {x:0, y:0};
	throwed.duration = data.duration || 0;
	throwed.update = function(gameTime, game) {
		if (this.summonTime===undefined) this.summonTime = gameTime;
		if (gameTime-this.summonTime >= this.duration) game.removeEntity(this);
		this.acc.x += this.move.x;
		this.acc.y += this.move.y;
	};
	return throwed;
}

function clone(o) {
	// TODO
	if (o.length) {
	    let l = o.length;
	    o.length = l;
	}
	return Object.assign(Object.create(Object.getPrototypeOf(o)), o);
	//return JSON.parse(JSON.stringify(o));
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