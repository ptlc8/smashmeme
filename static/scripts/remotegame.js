class RemoteGame extends Game {
    constructor(exportedGame, sendFunction) {
        super();
        this.id = exportedGame.id;
        this.players = exportedGame.players;
        this.smashers = exportedGame.smashers;
        this.map = exportedGame.map;
        this.inputsHistory = exportedGame.inputsHistory;
        this.send = sendFunction;
        this.inputsManager = new InputsManager([
            ["Space","jump"],["KeyW","jump"],["GamepadButton3","jump"],["GamepadButton4","jump"],
            ["KeyW","up"],["-GamepadAxis1","up"],
            ["KeyD","right"],["+GamepadAxis0","right"],
            ["KeyS","down"],["+GamepadAxis1","down"],
            ["KeyA","left"],["-GamepadAxis0","left"],
            ["KeyO","attack"],["GamepadButton1","attack"],
            ["KeyK","special"],["GamepadButton0","special"],
            ["Semicolon","shield"],
            ["ShiftLeft","shield"],
            ["-GamepadAxis3","attack"],["-GamepadAxis3","up"],
            ["+GamepadAxis2","attack"],["+GamepadAxis2","right"],
            ["+GamepadAxis3","attack"],["+GamepadAxis3","down"],
            ["-GamepadAxis2","attack"],["-GamepadAxis2","left"]
        ]);
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
                return super.setInputs(data.playerId, data.inputs);
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
    setInputs(_playerId, inputs) {
        this.send({ type: "inputs", inputs: inputs });
    }
    // Override
    updatePlayingGame() {
        // Récupération des entrées
        this.world.setInputs("player", this.inputsManager.getInputs());
        
        super.updatePlayingGame();
    }
}