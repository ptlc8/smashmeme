class LocalGame extends Game {
    constructor() {
        super();
    }
    // Override
    onInput(playerId, input, value) {
        if (this.canJoin(playerId)) {
            this.join({ id: playerId, name: "player"+playerId });
        }
        super.onInput(playerId, input, value);
    }
    // Override
    updatePlayingGame() {
        // Condition de mort
        if (this.world.smashers[0].pos.y > 2000) {
            window.location.href = "";
            clearInterval(this.updateIntervalId);
        }
        // Actualisation de la partie
        super.updatePlayingGame();
    }
}