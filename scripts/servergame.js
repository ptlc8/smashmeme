if (typeof require==="function") {
    global.Game = require("./game");
}

class ServerGame extends Game {
    constructor(id, sendFunction) {
        super();
        this.id = id;
        this.send = sendFunction;
    }
    broadcast(data) {
        for (var player of this.players) {
            this.send(player.id, data);
        }
    }
    onReceive(player, data) {
        switch (data.type) {
            case "choose":
                if (this.choose(player.id, data.smasher))
                    this.broadcast({ type:"choose", playerId:player.id, smasher:data.smasher });
                break;
            case "map":
                if (this.setMap(data.map))
                    this.broadcast({ type:"map", map:data.map });
                break;
            case "start":
                this.start();
                break;
            case "inputs":
                if (this.setInputs(player.id, data.inputs))
                    this.broadcast({ type:"inputs", playerId:player.id, inputs:data.inputs });
                break;
            default:
                this.send(player.id, { error: "unknown data type: " + data.type });
        }
    }
    // Override
    join(player) {
        if (super.join(player)) {
            this.broadcast({ type:"join", player:player });
            return true;
        }
        return false;
    }
    leave(playerId) {
        if (super.leave(playerId)) {
            this.broadcast({ type:"leave", playerId:playerId });
            return true;
        }
        return false;
    }
    start() {
        if (super.start()) {
            this.broadcast({ type:"start" });
            return true;
        }
        return false;
    }

}

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = ServerGame;