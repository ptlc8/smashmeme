"use strict";

var game;

window.addEventListener("load", async (e) => {
    var renderer = new SmashmemeRenderer(document.getElementById("aff"));
    game = new LocalGame();
    game.debug = true;
    game.startUpdating();
    renderer.start(game);
});




document.getElementById("aff").addEventListener("click", (e) => {
    var ratio = Math.min(e.target.width/SmashmemeRenderer.WIDTH, e.target.height/SmashmemeRenderer.HEIGHT);
    var x = (e.clientX - e.target.width/2) / ratio;
    var y = (e.clientY - e.target.height/2) / ratio;
    var w = SmashmemeRenderer.WIDTH, h = SmashmemeRenderer.HEIGHT;
    switch (game.state) {
        case Game.CHOOSE:
            let perL = 6;
            if (e.button == 0) {
                let index = Math.floor((y+h/2-24)/200) * perL + Math.floor((x+w/2)/w*perL);
                if (index < Object.keys(Smashmeme.smashers).length) {
                    game.choose("player", Smashmeme.smashers[index]);
                    game.setMap(Smashmeme.maps[0]);
                    game.start();
                }
            }
            break;
    }
    e.clientX, e.clientY, e.button==0;
});