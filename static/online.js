"use strict";

var remote;

window.addEventListener("load", e => {
    Smashmeme.load().then(() => {
        var renderer = new SmashmemeRenderer(document.getElementById("aff"));
        var websocket = new WebSocket("ws://localhost:13028");
        websocket.onopen = () => {
            remote = new SmashmemeRemote((data) => websocket.send(JSON.stringify(data)));
            remote.debug = true;
            websocket.onmessage = (message) => remote.onReceive(JSON.parse(message.data));
            remote.join();
            /*game.startUpdating();
            game.setMap(Smashmeme.getRandomMap().id);*/
            renderer.start(remote);
        };
    });
});

document.getElementById("aff").addEventListener("click", (e) => {
    var ratio = Math.min(e.target.width/SmashmemeRenderer.WIDTH, e.target.height/SmashmemeRenderer.HEIGHT);
    var x = (e.clientX - e.target.width/2) / ratio;
    var y = (e.clientY - e.target.height/2) / ratio;
    var w = SmashmemeRenderer.WIDTH, h = SmashmemeRenderer.HEIGHT;
    if (!remote.game) return;
    let smashers = Object.keys(Smashmeme.smashers);
    switch (remote.game.state) {
        case Game.CHOOSE:
            let perL = 6;
            if (e.button == 0) {
                // Choix du smasher
                let index = Math.floor((y+h/2-24)/200) * perL + Math.floor((x+w/2)/w*perL);
                if (0 <= index && index < smashers.length) {
                    remote.game.choose(remote.selfId, remote.game.smashers[remote.selfId]==smashers[index] ? null : smashers[index]);
                    return;
                }
                // Lancement du match
                if (-h/8 < y && y < h/8 && remote.game.canStart()) {
                    remote.game.start();
                }
            }
            break;
    }
});