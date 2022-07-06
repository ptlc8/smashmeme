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
        this.inputs = {}; // {player: {tick1: {inputs}, tick2: {inputs}}}
        this.debug = false;
        this.stateStartTime = Date.now();
        this.updateIntervalId = null;
    }
    get isPlaying() {
        return this.world !== null;
    }
    canJoin() {
        return this.state == Game.CHOOSE;
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
            this.startUpdating();
            return true;
        }
        return false;
    }
    // Retourne les dernières entrées avant un tick donné 
    getLastInputs(tick) {
        var inputs = {};
        for (var player of this.players) {
            var lastTick = this.getLastInputsTick(player.id, tick);
            inputs[player.id] = lastTick==-1 ? null : this.inputs[player.id][lastTick];
        }
        return inputs;
    }
    getLastInputsTick(playerId, tickMax=Infinity) {
        var lastTick = -1;
        for(var inputsTick in this.inputs[playerId]||{}) {
            inputsTick = parseInt(inputsTick);
            if (lastTick < inputsTick && inputsTick <= tickMax)
                lastTick = inputsTick;
        }
        return lastTick;
    }
    // Définir les entrées d'un joueur à un tick donné
    setInputs(playerId, inputs, tick=this.world.tick) {
        if (!this.inputs[playerId])
            this.inputs[playerId] = {};
        this.inputs[playerId][tick] = inputs;
        return true;
    }
    // Exportation des données nécessaire de la partie
    export() {
        return {
            players: this.players,
            smashers: this.smashers,
            map: this.map,
            inputs: this.inputs
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
        // Mise à jour du monde avec les entrées des joueurs
        this.world.update(this.getLastInputs(this.world.tick));
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