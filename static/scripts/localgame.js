class LocalGame extends Game {
    constructor() {
        super();
        this.updateIntervalId = null;
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
        this.join("player");
    }

    startUpdating() {
        this.stopUpdating();
        this.updateIntervalId = setInterval(() => {
            this.update();
        }, World.TICK_DURATION);
    }
    stopUpdating() {
        clearInterval(this.updateIntervalId);
    }

    update() {
        switch (game.state) {
            case Game.CHOOSE:
                this.updateChoosingGame(game);
                break;
            case Game.COUNTDOWN:
                this.updateCountdownGame(game);
                break;
            case Game.PLAY:
                this.updatePlayingGame(game);
                break;
        }
    }
    updateChoosingGame(game) {
        
    }
    updateCountdownGame(game) {
        
    }
    updatePlayingGame(game) {
        // Condition de mort
        if (game.world.smashers["player"].pos.y > 2000) {
            window.location.href = "";
            clearInterval(this.updateIntervalId);
        }
        // Récupération des entrées
        game.world.setInputs("player", this.inputsManager.getInputs());
        // Mise à jour du monde
        game.world.update();
    }
}