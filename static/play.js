"use strict";

var game;

window.addEventListener("load", e => {
    Smashmeme.load().then(() => {
        var renderer = new SmashmemeRenderer(document.getElementById("aff"));
        game = new LocalGame();
        game.debug = false;
        game.setMap(Smashmeme.getRandomMap().id);
        renderer.start(game);
    });
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
                var smashers = Object.keys(Smashmeme.smashers);
                let index = Math.floor((y+h/2-24)/200) * perL + Math.floor((x+w/2)/w*perL);
                if (0 <= index && index < smashers.length) {
                    game.choose(1, smashers[index]);
                    game.start();
                }
            }
            break;
    }
});