if (typeof require==="function") {
    global.World = require("./world");
}

class Game {
    constructor() {
        this.state = Game.CHOOSE;
        this.players = [];
        this.smashers = {};
        this.map = null;
        this.world = null;
        this.inputsHistory = {}; // {player: {tick1: {inputs}, tick2: {inputs}}}
        this.debug = false;
        this.stateStartTime = Date.now();
        this.updateIntervalId = null;
    }
    get isPlaying() {
        return this.world !== null;
    }
    canJoin() {
        return true;
    }
    join(player) {
        if (this.canJoin()) {
            this.players.push(player);
            return true;
        }
        return false;
    }
    leave(playerId) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id == playerId)
                this.players.splice(i, 1);
        }
        delete this.smashers[playerId];
        return true;
    }
    choose(playerId, smasher) {
        this.smashers[playerId] = smasher;
        return true;
    }
    setMap(map) {
        this.map = map;
        return true;
    }
    canStart() {
        if (this.state!=Game.CHOOSE || this.map==null)
            return false;
        for (var player of this.players) {
            if (!this.smashers[player.id])
                return false;
        }
        return true;
    }
    start() {
        if (this.canStart()) {
            this.world = new World(this.map, this.smashers);
            this.stateStartTime = Date.now();
            this.state = Game.COUNTDOWN;
            setTimeout(() => this.state = Game.PLAY, 3000);
            return true;
        }
        console.error("can't start game");
        return false;
    }
    setInputs(playerId, inputs) {
        this.world.setInputs(playerId, inputs);
        if (!this.inputsHistory[playerId])
            this.inputsHistory[playerId] = {};
        this.inputsHistory[playerId][this.world.tick] = inputs;
    }
    // Exportation des données nécessaire de la partie
    export() {
        return {
            players: this.players,
            smashers: this.smashers,
            map: this.map,
            inputsHistory: this.inputsHistory
        };
    }
    // Mise à jour de la partie
    update() {
        switch (this.state) {
            case Game.CHOOSE:
                this.updateChoosingGame();
                break;
            case Game.COUNTDOWN:
                this.updateCountdownGame();
                break;
            case Game.PLAY:
                this.updatePlayingGame();
                break;
        }
    }
    updateChoosingGame() {
        
    }
    updateCountdownGame() {
        
    }
    updatePlayingGame() {
        // Mise à jour du monde
        this.world.update();
    }
    // Mise à jour périodique de la partie
    startUpdating() {
        this.stopUpdating();
        this.updateIntervalId = setInterval(() => {
            this.update();
        }, World.TICK_DURATION);
    }
    stopUpdating() {
        clearInterval(this.updateIntervalId);
    }
}

Game.CHOOSE = Symbol("CHOOSE");
Game.COUNTDOWN = Symbol("COUNTDOWN");
Game.PLAY = Symbol("PLAY");

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = Game;