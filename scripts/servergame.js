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
                if (this.onInput(player.id, data.input, data.value))
                    this.broadcast({ type:"inputs", playerId:player.id, input:data.input, value:data.value, tick:this.world?this.world.tick:0, oldTick:data.tick });
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
    // Override
    leave(playerId) {
        if (super.leave(playerId)) {
            this.broadcast({ type:"leave", playerId:playerId });
            return true;
        }
        return false;
    }
    // Override
    start() {
        if (super.start()) {
            this.broadcast({ type:"start" });
            console.log("Game "+this.id+" started");
            return true;
        }
        return false;
    }
}

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = ServerGame;