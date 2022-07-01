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
    }
    get isPlaying() {
        return this.world !== null;
    }
    join(player) {
        this.players.push(player)
    }
    leave(player) {
        this.players.splice(this.players.indexOf(player), 1);
        delete this.smashers[player];
    }
    choose(player, smasher) {
        this.smashers[player] = smasher;
    }
    setMap(map) {
        this.map = map;
    }
    start() {
        if (this.state==Game.CHOOSE && this.map!==null) {
            this.world = new World(this.map, this.smashers);
            this.stateStartTime = Date.now();
            this.state = Game.COUNTDOWN;
            setTimeout(() => this.state = Game.PLAY, 3000);
        } else {
            console.error("can't start game");
        }
    }
    setInputs(player, inputs) {
        this.world.setInputs(player, inputs);
        if (!this.inputsHistory[player])
            this.inputsHistory[player] = {};
        this.inputsHistory[player][this.world.tick] = inputs;
    }
    export() {
        return JSON.stringify({
            players: this.players,
            smashers: this.smashers,
            map: this.map,
            inputsHistory: this.inputsHistory
        });
    }
}

Game.CHOOSE = Symbol("CHOOSE");
Game.COUNTDOWN = Symbol("COUNTDOWN");
Game.PLAY = Symbol("PLAY");

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = Game;