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
    var w = e.target.width, h = e.target.height;
    switch (game.state) {
        case Game.CHOOSE:
            let perL = 6;
            if (e.button == 0 && w/8 < e.clientX && e.clientX < 7*w/8) {
                let index = parseInt(e.clientY/(w/8))*perL+parseInt(e.clientX/(w/8)-1);
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