"use strict";

var client;

window.addEventListener("load", e => {
    client = new SmashmemeClient();
    client.load().then(() => {
        var renderer = new SmashmemeRenderer(document.getElementById("aff"));
        var path = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1)
        var websocket = new WebSocket((location.protocol == "https:" ? "wss:" : "ws:") + "//" + location.host + path);
        websocket.onopen = () => {
            client.startRemote((data) => websocket.send(JSON.stringify(data)));
            websocket.onmessage = (message) => client.onReceive(JSON.parse(message.data));
            client.join();
            renderer.start(client);
        };
    });
});

document.getElementById("aff").addEventListener("click", (e) => {
    var ratio = Math.min(e.target.width/SmashmemeRenderer.WIDTH, e.target.height/SmashmemeRenderer.HEIGHT);
    var x = (e.clientX - e.target.width/2) / ratio;
    var y = (e.clientY - e.target.height/2) / ratio;
    var w = SmashmemeRenderer.WIDTH, h = SmashmemeRenderer.HEIGHT;
    if (!client.game) return;
    let smashers = Object.keys(Smashmeme.smashers);
    switch (client.game.state) {
        case Game.CHOOSE:
            let perL = 6;
            if (e.button == 0) {
                // Choix du smasher
                let index = Math.floor((y+h/2-24)/200) * perL + Math.floor((x+w/2)/w*perL);
                if (0 <= index && index < smashers.length) {
                    client.game.choose(client.selfId, client.game.smashers[client.selfId]==smashers[index] ? null : smashers[index]);
                    return;
                }
                // Lancement du match
                if (-h/8 < y && y < h/8 && client.game.canStart()) {
                    client.game.start();
                }
            }
            break;
    }
});