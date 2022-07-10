class LocalGame extends Game {
    constructor() {
        super();
        this.selectingSmasher = {};
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
        for (let smasher of Object.values(this.world.smashers))
            if (smasher.pos.y > 2000)
                smasher.pos = {x:0, y:-500};
        // Actualisation de la partie
        super.updatePlayingGame();
    }
    // Override
    join(player) {
        super.join(player);
        this.selectingSmasher[player.id] = 0;
    }
}