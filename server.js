if (typeof require==="function") {
    global.ServerGame = require("./scripts/servergame");
    global.Smashmeme = require("./scripts/smashmeme");
    Smashmeme.load();
}


class SmashmemeServer {
    constructor(sendFunction) {
        this.send = sendFunction;
        this.players = {};
        this.games = {};
        this.gamesId = 1;
        this.debug = false;
    }
    broadcast(data) {
        for (var id in this.players) {
            this.send(id, data);
        }
    }
    onConnection(id) {
        this.players[id] = { id };
        this.send(id, { type:"welcome", id, version:process.env.npm_package_version });
    }
    onDisconnection(id) {
        delete this.players[id];
    }
    onReceive(id, data) {
        if (this.debug) console.log("Client "+id+": ", data);
        var player = this.players[id];
        switch (data.type) {
            case "join":
                if (!player.game) {
                    let game = Object.values(this.games).filter(game => game.players.length < 4)[0];
                    if (!game) {
                        let gameId = this.gamesId++;
                        game = this.games[gameId] = new ServerGame(gameId, (id, data) => this.send(id, { type:"game", "sub":data }));
                        game.debug = this.debug;
                        game.setMap(Smashmeme.getRandomMap().id);
                    }
                    if (game.canJoin()) {
                        this.send(player.id, { type:"join", game:game.export() });
                        if (game.join(player))
                            player.game = game.id;
                    }
                }
                break;
            case "leave":
                if (player.game && this.games[player.game].leave(player.id)) {
                    delete player.game;
                    this.send(player.id, { type:"leave" });
                }
                break;
            case "game":
                if (player.game && this.games[player.game]) {
                    this.games[player.game].onReceive(player, data.sub);
                } else this.send(player.id, {error:"not in a game"})
                break;
            default:
                this.send(player.id, { error: "unknown data type: " + data.type });
        }
    }

}

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = SmashmemeServer;