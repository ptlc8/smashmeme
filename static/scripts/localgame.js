class LocalGame extends Game {
    constructor() {
        super();
        this.updateIntervalId = null;
        this.inputsManager = new InputsManager([
            ["Space","jump"],["KeyW","jump"],["GamepadButton3","jump"],["GamepadButton4","jump"],
            ["KeyW","up"],["-GamepadAxe1","up"],
            ["KeyD","right"],["+GamepadAxe0","right"],
            ["KeyS","down"],["+GamepadAxe1","down"],
            ["KeyA","left"],["-GamepadAxe0","left"],
            ["KeyO","attack"],["GamepadButton1","attack"],
            ["KeyK","special"],["GamepadButton0","special"],
            ["Semicolon","shield"],
            ["ShiftLeft","shield"]
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
            case Game.PLAY:
                this.updatePlayingGame(game);
                break;
        }
    }
    updateChoosingGame(game) {
        
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