class RemoteGame extends Game {
    constructor(exportedGame, selfId, sendFunction) {
        super();
        this.id = exportedGame.id;
        this.players = exportedGame.players;
        this.smashers = exportedGame.smashers;
        this.map = exportedGame.map;
        this.inputsHistory = exportedGame.inputsHistory;
        this.selfId = selfId;
        this.send = sendFunction;
        this.worldSaves = [];
    }
    onReceive(data) {
        switch (data.type) {
            case "join":
                return super.join(data.player);
            case "leave":
                return super.leave(data.playerId);
            case "choose":
                return super.choose(data.playerId, data.smasher);
            case "map":
                return super.setMap(data.map);
            case "start":
                return super.start();
            case "inputs":
                super.onInput(data.playerId, data.input, data.value, data.tick);
                if (data.tick < this.world.tick)
                    this.rollback(data.tick);
                break;
            default:
                console.error("unknown data type from server: " + data.type);
        }
    }
    // Override
    join(_player) {
        // disabled
        return false;
    }
    // Override
    leave(_playerId) {
        // disabled
        return false;
    }
    // Override
    choose(_playerId, smasher) {
        this.send({ type: "choose", smasher: smasher });
    }
    // Override
    setMap(map) {
        this.send({ type: "map", map: map });
    }
    // Override
    start() {
        this.send({ type: "start" });
    }
    // Override
    onInput(_playerId, input, value, _tick) {
        var tick = this.world.tick;
        //this.localInputs[tick] = JSON.parse(JSON.stringify(inputs)); // TODO : find better way to copy
        this.send({ type: "inputs", input, value, tick });
        return true;
    }
    // Override
    updatePlayingGame() {
        super.updatePlayingGame();
        // Une sauvegarde par seconde
        if (this.world.tick%parseInt(1000/World.TICK_DURATION)==0) {
            this.worldSaves.push(this.world.clone());
        }
        // On garde que 10 secondes de sauvegarde
        if (this.worldSaves.length > 10) {
            this.worldSaves.shift();
        }
    }
    // Rollback du monde à un tick donné
    rollback(tick) {
        for (let i = 0; i < this.worldSaves.length; i++) {
            if (this.worldSaves[i].tick > tick)
                this.worldSaves.splice(i, 1);
        }
        if (this.worldSaves.length > 0) {
            this.world = this.worldSaves[this.worldSaves.length-1].clone();
        } else {
            this.world = new World(this.map, this.smashers);
        }
    }
}