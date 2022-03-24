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
        </style>
        <script src="easing.js"></script>
        <script src="models.js"></script>
    </head>
    <body>
        <canvas id="aff"></canvas>
        <script>

var background;
var menu = "choose";
var allsmashers;
var character;
var entities = [];
var map;
var cvs;
var ctx;

window.addEventListener("load", async (e) => {
    cvs = document.getElementById("aff");
    cvs.width = parseInt(getComputedStyle(cvs).width);
    cvs.height = parseInt(getComputedStyle(cvs).height);
    map = await loadMapFromJSONFile("crab-rave-island.json");
    background = {};
    background.model = await loadModelFromJSONFile("crab-rave-island.json");
    background.anim = {name: "default", start: Date.now()};
    allsmashers = [
        {name: "Knuckle", model: await loadModelFromJSONFile("knuckle.json?2"), behaviour: await loadBehaviourFromJSONFile("knuckle.json?2")},
        {name: "Coffin dancers", model: await loadModelFromJSONFile("coffin-dancers.json?2"), behaviour: await loadBehaviourFromJSONFile("coffin-dancers.json?2")},
        {name: "Buffed doge", model: await loadModelFromJSONFile("buffed-doge.json?8"), behaviour: await loadBehaviourFromJSONFile("buffed-doge.json?6")},
        {name: "Globglogabgalab", model: await loadModelFromJSONFile("glob.json?1"), behaviour: await loadBehaviourFromJSONFile("glob.json?1")},
        {name: "Raptor Jésus", model: await loadModelFromJSONFile("raptor.json?1"), behaviour: await loadBehaviourFromJSONFile("raptor.json")},
        {name: "Bongo cat", model: await loadModelFromJSONFile("bongo-cat.json?2"), behaviour: await loadBehaviourFromJSONFile("bongo-cat.json?5")},
        {name: "Pepe", model: await loadModelFromJSONFile("pepe.json"), behaviour: await loadBehaviourFromJSONFile("pepe.json")}
    ];
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
        if (code == e.code)
            keys[action] = true;
});
window.addEventListener("keyup", (e) => {
    for (let [code, action] of keysXCode)
        if (code == e.code)
            keys[action] = false;
});


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
    }
}


window.addEventListener("click", (e) => {
    var w = cvs.width, h = cvs.height;
    switch (menu) {
        case "choose":
            let perL = 6;
            if (e.button == 0 && w/8 < e.clientX && e.clientX < 7*w/8) {
                let index = parseInt(e.clientY/(w/8))*perL+parseInt(e.clientX/(w/8)-1);
                if (index < Object.keys(allsmashers).length) {
                    entities.push(character = newEntity(allsmashers[index]));
                    menu = "game";
                }
            }
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
            updateGame();
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
    for (let i = 0; i < allsmashers.length/perL; i++) {
        for (let j = 0; j < perL && j+perL*i < allsmashers.length; j++) {
            ctx.translate(j*400, i*400);
            let smasher = allsmashers[i*perL+j];
            renderModel(ctx, smasher.model, Date.now()-startT, "idle" + (smasher.behaviour["idle"]&&smasher.behaviour["idle"].directionable?"-right":""));
            renderText(ctx, smasher.name, 0, 64, 48, "#f5f5f5");
            ctx.translate(-j*400, -i*400);
        }
    }
    ctx.translate(-200-w/8/z, -400);
    ctx.scale(1/z, 1/z);
    ctx.translate(-w/2, -h/2);
}

function updateChooseMenu() {
    
}


function renderGame(ctx, startT) { // t en ms
    ctx.translate(cvs.width/2, cvs.height/2);
    renderModel(ctx, background.model, Date.now()-background.anim.start, background.anim.name);
    
	ctx.scale(1/3, 1/3);
	for (let platform of map.platforms) {
	    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
	}
	for (let entity of entities) {
	    ctx.translate(entity.pos.x, entity.pos.y);
	    if (entity.behaviour[entity.anim.name] && Date.now()-entity.anim.start > entity.behaviour[entity.anim.name].in) {
	        entity.anim.name = "idle" + ((entity.behaviour.idle && entity.behaviour.idle.directionable)?"-"+entity.direction:"");;
	        entity.anim.start = Date.now();
	    }
		renderModel(ctx, entity.model, Date.now()-entity.anim.start, entity.anim.name);
		ctx.translate(-entity.pos.x, -entity.pos.y);
	}
	ctx.scale(3, 3);
	
    ctx.translate(-cvs.width/2, -cvs.height/2);
}

function updateGame() {
    // Condition de mort
    if (character.pos.y > 2000) {
        window.location.href = "";
        clearInterval(2);
    }
    
    // Récupération des entrées
    let behaviour = character.behaviour[character.anim.name] || {};
    if (true) {
        if (!behaviour["block-move"]) {
            if (keys.right && !keys.left) {
                character.spd.x += character.behaviour.speed/1;
                if (character.anim.name != "walk-right" && !character.attacking) {
                    character.direction = "right";
                    character.anim.name = "walk-right";
                    character.anim.start = Date.now();
                }
            } else if (keys.left && !keys.right) {
                character.spd.x += -character.behaviour.speed/1;
                if (character.anim.name != "walk-left" && !character.attacking) {
                    character.direction = "left";
                    character.anim.name = "walk-left";
                    character.anim.start = Date.now();
                }
            } else {
                if (character.anim.name == "walk-left" || character.anim.name == "walk-right") {
                    character.anim.name = "idle" + ((character.behaviour.idle && character.behaviour.idle.directionable)?"-"+character.direction:"");
                    character.anim.start = Date.now();
                }
            }
        }
        if (keys.attack && !character.attacking) {
            if (keys.right && !keys.left) {
                character.anim.name = "attack-right";
                character.anim.start = Date.now();
                character.attacking = true;
                setTimeout(() => character.attacking=false, character.behaviour["attack-right"].in);
            } else if (keys.left && !keys.right) {
                character.anim.name = "attack-left";
                character.anim.start = Date.now();
                character.attacking = true;
                setTimeout(() => character.attacking=false, character.behaviour["attack-left"].in);
            } else if (keys.up && !keys.down) {
                character.anim.name = "attack-up";
                character.anim.start = Date.now();
                character.attacking = true;
                setTimeout(() => character.attacking=false, character.behaviour["attack-up"].in);
            } else if (keys.down && !keys.up) {
                character.anim.name = "attack-down";
                character.anim.start = Date.now();
                character.attacking = true;
                setTimeout(() => character.attacking=false, character.behaviour["attack-down"].in);
            }
        } else if (keys.special && !character.attacking) {
            if (keys.right && !keys.left) {
                character.anim.name = "special-right";
                character.anim.start = Date.now();
                character.attacking = true;
                setTimeout(() => character.attacking=false, character.behaviour["special-right"].in);
            } else if (keys.left && !keys.right) {
                character.anim.name = "special-left";
                character.anim.start = Date.now();
                character.attacking = true;
                setTimeout(() => character.attacking=false, character.behaviour["special-left"].in);
            } else if (keys.up && !keys.down && !character.specialUp) {
                let animName = "special-up"+(character.behaviour["special-up"].directionable?"-"+character.direction:"");
                character.anim.name = animName;
                character.anim.start = Date.now();
                character.attacking = true;
                character.specialUp = true;
                setTimeout(() => character.attacking=false, character.behaviour[animName].in);
            } else if (keys.down && !keys.up) {
                let animName = "special-down"+(character.behaviour["special-down"].directionable?"-"+character.direction:"");
                character.anim.name = animName;
                character.anim.start = Date.now();
                character.attacking = true;
                setTimeout(() => character.attacking=false, character.behaviour[animName].in);
            }
        }
        
        behaviour = character.behaviour[character.anim.name] || {};
        if (keys.jump && !behaviour["block-jump"] && character.jumps < character.behaviour.jumps) {
            if (!keys.hasJump) {
                character.spd.y += -character.behaviour.jump.value/8;
                if (!character.attacking) {
                    character.anim.start = Date.now();
                    character.anim.name = "jump";
                }
                keys.hasJump = true;
                character.jumps++;
            }
        } else keys.hasJump = false;
    } 
    if (character.attacking) {
        if (behaviour) {
            if (behaviour.move ) {
                character.spd.x += behaviour.move.x;
                character.spd.y += behaviour.move.y;
            }
        }
    }
    
    // Application des forces de déplacements
    for (let entity of entities) {
        entity.pos.x += entity.spd.x;
        entity.spd.x += entity.acc.x;
        entity.spd.x /= 1.5; // frottement x
        entity.acc.x = 0;
        entity.spd.y = Math.min(entity.spd.y, getDistanceFromFloor(entity.pos.x, entity.pos.y))
        entity.pos.y += entity.spd.y;
        entity.spd.y += entity.acc.y;
        entity.acc.y /= 1.5; // frottement y
        if (getDistanceFromFloor(entity.pos.x, entity.pos.y) <= 0 && entity.spd.y >= 0) { // si au sol
            if (entity.acc.y > 0) entity.acc.y = 0;
            entity.jumps = 0;
            entity.specialUp = false;
        } else {
            //entity.acc.y = keys.down ? 32.7 : 32.7/2; // g sur Terre en cm.(s/30)^-2 /3
            entity.acc.y = keys.down ? 5 : 5/2;
        }
    }
}


function renderText(ctx, text="", x=0, y=0, size=10, color) {
    ctx.textAlign = "center";
    ctx.font = size + "px Arial";
    if (color) ctx.fillStyle = color;
    ctx.fillText(text, x, y);
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


function newEntity(data={}) {
    var entity = {};
    entity.pos = data.pos ? {x:data.pos.x||0, y:data.pos.y||0} : {x:0, y:0};
    entity.model = data.model || newModel({});
    entity.anim = data.anim ? {start:data.anim.start||Date.now(), name:data.anim.name||"idle"} : {start:Date.now(), name:"idle"};
    entity.behaviour = data.behaviour || {/* TODO */};
    entity.direction = data.direction || "right";
    entity.spd = data.spd ? {x:data.spd.x||0, y:data.spd.y||0} : {x:0, y:0};
    entity.acc = data.acc ? {x:data.acc.x||0, y:data.acc.y||0} : {x:0, y:0};
    return entity;
}

var loadBehaviourFromJSONFile = (filePath, external=false) => {
    if (!external) filePath = "behaviours/" + filePath;
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

        </script>
    </body>
</html>