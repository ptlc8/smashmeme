"use strict";

var client;

window.addEventListener("load", e => {
    client = new SmashmemeClient();
    client.load().then(() => {
        client.startLocalGame();
        var renderer = new SmashmemeRenderer(document.getElementById("aff"));
        renderer.start(client);
    });
});




document.getElementById("aff").addEventListener("click", (e) => {
    var ratio = Math.min(e.target.width/SmashmemeRenderer.WIDTH, e.target.height/SmashmemeRenderer.HEIGHT);
    var x = (e.clientX - e.target.width/2) / ratio;
    var y = (e.clientY - e.target.height/2) / ratio;
    var w = SmashmemeRenderer.WIDTH, h = SmashmemeRenderer.HEIGHT;
    switch (client.game.state) {
        case Game.CHOOSE:
            let perL = 6;
            if (e.button == 0) {
                var smashers = Object.keys(Smashmeme.smashers);
                let index = Math.floor((y+h/2-24)/200) * perL + Math.floor((x+w/2)/w*perL);
                if (0 <= index && index < smashers.length) {
                    client.game.choose(0, smashers[index]);
                }
            }
            break;
    }
});