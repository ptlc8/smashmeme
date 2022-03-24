<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Robots</title>
        <style>
html, body, #aff {
    margin: 0;
    max-width: calc(100vw - 2px);
    max-height: calc(100vh - 2px);
}
#aff {border: 1px red solid;}
        </style>
        <script src="ambiengine.js?<?php echo time() ?>"></script>
        <script src="easing.js"></script>
        <script src="models.js"></script>
        <script src="collision.js"></script>
    </head>
    <body>
        <canvas id="aff"></canvas>
        <script>

var scene;
var player = {x:0, y:0, rigideBody:Collision.newRegularPolygon(0,0,4,7.071,45)};
var groundRigideBody = Collision.newShape({x:-500, y:0},{x:500,y:0});
window.addEventListener("load", async (e) => {
    scene = AmbiEngine.create(document.getElementById("aff"), 1920, 1080, update, render, 30, {click:onClick, mousemove:onMouseMove});
    scene.setCameraPos(0, -200);
});

function update(delta) { // in ms
    
}

function render(ctx) { // drawRect
    ctx.clear();
    ctx.drawRectInfiniteX("black", 0, 500);
    ctx.drawRect("red", player.x-10, player.y-10, 20, 20);
}

function onClick(event) { // x, y, sx, sy, button, buttons
    
}

function onMouseMove(event) { // x, y, sx, sy, buttons
    if (Collision.has({x:event.x,y:event.y}, player.rigideBody, 0, {x:0,y:0}, groundRigideBody, 0)) return;
    player.x = event.x
    player.y = event.y
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

        </script>
    </body>
</html>