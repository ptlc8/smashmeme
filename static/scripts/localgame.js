class LocalGame extends Game {
    constructor() {
        super();
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
        this.join({ id:1, name:"player" });
    }
    // Override
    updatePlayingGame() {
        // Condition de mort
        if (this.world.smashers[1].pos.y > 2000) {
            window.location.href = "";
            clearInterval(this.updateIntervalId);
        }
        // Récupération des entrées
        this.world.setInputs(1, this.inputsManager.getInputs());
        
        super.updatePlayingGame();
    }
}