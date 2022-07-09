"use strict";

class SmashmemeClient {
    constructor() {
        this.inputsManager = new InputsManager(SmashmemeClient.defaultInputs);
        this.inputsManager.onInput = this.onInput.bind(this);
        this.playerIds = [];
        this.game = null;
        this.debug = false;
        this.send = () => console.error("Need to start remote");
        this.selfId = null;
    }
    load() {
        return Smashmeme.load();
    }
    onInput(index, input, value) {
        if (this.game) {
            if (this.game.canStart() && input=="jump" && value!=0) {
                this.game.start();
            }
            if (typeof RemoteGame != "undefined" && this.game instanceof RemoteGame) {
                this.game.onInput(this.selfId, input, value);
            } else {
                this.game.onInput(index, input, value);
            }
        }
    }
    // Only for local game
    startLocalGame() {
        this.game = new LocalGame();
        this.game.debug = this.debug;
        this.game.setMap(Smashmeme.getRandomMap().id);
    }
    // Only for online game
    startRemote(sendFunction) {
        this.send = sendFunction;
        this.selfId = null;
    }
    onReceive(data) {
        if (this.debug) console.log("Server: ", data);
        if (data.error) console.error("Server: ", data.error);
        switch (data.type) {
            case "welcome":
                this.selfId = data.id;
                break;
            case "join":
                this.game = new RemoteGame(data.game, this.selfId, data => this.send({ type:"game", sub:data }));
                this.game.debug = this.debug;
                break;
            case "leave":
                this.game = null;
                break;
            case "game":
                this.game.onReceive(data.sub);
                break;
        }
    }
    join() {
        this.send({ type: "join" });
    }
    leave() {
        this.send({ type: "leave" });
    }
}

SmashmemeClient.defaultInputs = [
    [
        ["Space","jump"],["KeyW","jump"],
        ["KeyW","up"],["KeyD","right"],["KeyS","down"],["KeyA","left"],
        ["KeyO","attack"],["KeyK","special"],
        ["Semicolon","shield"],["ShiftLeft","shield"]
    ],[
        ["gamepad0Button3","jump"],["gamepad0Button4","jump"],
        ["-gamepad0Axis1","up"],["+gamepad0Axis0","right"],["+gamepad0Axis1","down"],["-gamepad0Axis0","left"],
        ["gamepad0Button1","attack"],["gamepad0Button0","special"],
        ["gamepad0Button8","shield"],["gamepad0Button9","shield"],
        ["gamepad0Axis2","attack"],["-gamepad0Axis2","left"],["+gamepad0Axis2","right"],
        ["gamepad0Axis3","attack"],["+gamepad0Axis3","down"],["-gamepad0Axis3","up"]
    ]
];