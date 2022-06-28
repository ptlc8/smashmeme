if (typeof require === "function") {
    global.Entity = require("./entity");
}

class World {
    constructor(map, smashers = {}) {
        this.map = map;
        this.tick = 0;
        this.smashers = {};
        this.entities = [];
        this.inputs = {};
        for (let player in smashers) {
            this.inputs[player] = { right: {}, left: {}, up: {}, down: {}, jump: {}, attack: {}, special: {}, shield: {} };
            this.entities.push(this.smashers[player] = new Entity(smashers[player]));
        }
    }
    update() {
        // Application des inputs
        for (let player in this.smashers) {
            var inputs = this.inputs[player];
            var smasher = this.smashers[player];
            let behaviour = smasher.behaviour[smasher.anim.name] || {};

            // Diminution du temps de cooldown s'il y en a un
            if (smasher.cooldown)
                smasher.cooldown--;

            // Déplacement gauche/droite
            if (!behaviour["block-move"]) {
                if (inputs.right.pressed && !inputs.left.pressed) {
                    smasher.acc.x += smasher.behaviour.speed;
                    if (smasher.anim.name != "walk-right" && !smasher.cooldown) {
                        smasher.direction = "right";
                        smasher.anim.name = "walk-right";
                        smasher.anim.start = Date.now();
                    }
                } else if (inputs.left.pressed && !inputs.right.pressed) {
                    smasher.acc.x += -smasher.behaviour.speed;
                    if (smasher.anim.name != "walk-left" && !smasher.cooldown) {
                        smasher.direction = "left";
                        smasher.anim.name = "walk-left";
                        smasher.anim.start = Date.now();
                    }
                } else {
                    if (smasher.anim.name == "walk-left" || smasher.anim.name == "walk-right") {
                        smasher.anim.name = "idle" + ((smasher.behaviour.idle && smasher.behaviour.idle.directionable) ? "-" + smasher.direction : "");
                        smasher.anim.start = Date.now();
                    }
                }
            }
            // Attaque
            if (inputs.attack.clicked && !smasher.cooldown) {
                if (inputs.right.pressed && !inputs.left.pressed) {
                    smasher.anim.name = "attack-right";
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour["attack-right"].in / World.TICK_DURATION);
                } else if (inputs.left.pressed && !inputs.right.pressed) {
                    smasher.anim.name = "attack-left";
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour["attack-left"].in / World.TICK_DURATION);
                } else if (inputs.up.pressed && !inputs.down.pressed) {
                    smasher.anim.name = "attack-up";
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour["attack-up"].in / World.TICK_DURATION);
                } else if (inputs.down.pressed && !inputs.up.pressed) {
                    smasher.anim.name = "attack-down";
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour["attack-down"].in / World.TICK_DURATION);
                }
                // Spécial
            } else if (inputs.special.clicked && !smasher.cooldown) {
                if (inputs.right.pressed && !inputs.left.pressed) {
                    smasher.anim.name = "special-right";
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour["special-right"].in / World.TICK_DURATION);
                } else if (inputs.left.pressed && !inputs.right.pressed) {
                    smasher.anim.name = "special-left";
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour["special-left"].in / World.TICK_DURATION);
                } else if (inputs.up.pressed && !inputs.down.pressed && !smasher.specialUp) {
                    let animName = "special-up" + (smasher.behaviour["special-up"].directionable ? "-" + smasher.direction : "");
                    smasher.anim.name = animName;
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour[animName].in / World.TICK_DURATION);
                    smasher.specialUp = true;
                } else if (inputs.down.pressed && !inputs.up.pressed) {
                    let animName = "special-down" + (smasher.behaviour["special-down"].directionable ? "-" + smasher.direction : "");
                    smasher.anim.name = animName;
                    smasher.anim.start = Date.now();
                    smasher.cooldown = parseInt(smasher.behaviour[animName].in / World.TICK_DURATION);
                }
            }
            // Saut
            behaviour = smasher.behaviour[smasher.anim.name] || {};
            if (inputs.jump.clicked && !behaviour["block-jump"] && smasher.jumps < smasher.behaviour.jumps) {
                smasher.spd.y += -smasher.behaviour.jump.value;
                if (!smasher.cooldown) {
                    smasher.anim.start = Date.now();
                    smasher.anim.name = "jump";
                }
                smasher.jumps++;
            }
            // Déplacement impliqué par l'attaque
            if (smasher.cooldown) {
                if (behaviour) {
                    if (behaviour.move) {
                        smasher.acc.x += behaviour.move.x;
                        smasher.acc.y += behaviour.move.y;
                    }
                }
            }
        }
        // Application des forces de déplacements
        for (let entity of this.entities) {
            entity.pos.x += entity.spd.x;
            entity.spd.x += entity.acc.x;
            entity.spd.x /= 1.5; // frottement x
            entity.acc.x = 0;
            entity.spd.y = Math.min(entity.spd.y, this.getDistanceFromFloor(entity.pos.x, entity.pos.y))
            entity.pos.y += entity.spd.y;
            entity.spd.y += entity.acc.y;
            entity.spd.y /= 1.5; // frottement y
            if (this.getDistanceFromFloor(entity.pos.x, entity.pos.y) <= 0 && entity.spd.y >= 0) { // si au sol
                if (entity.acc.y > 0) entity.acc.y = 0;
                entity.jumps = 0;
                entity.specialUp = false;
            } else {
                entity.acc.y = inputs.down.pressed ? 32.7 : 32.7 / 2; // g sur Terre en cm.(s/30)^-2 /3
            }
        }
        this.tick++;
    }
    getDistanceFromFloor(x, y) {
        let dist = Infinity;
        for (let platform of this.map.platforms) {
            if (platform.x <= x && x <= platform.x + platform.w && y <= platform.y) {
                dist = Math.min(dist, platform.y - y);
            }
        }
        return dist;
    }
    setInputs(player, inputs) {
        this.inputs[player] = inputs;
    }
}

World.TICK_DURATION = 1000 / 30;

if (typeof exports === "object" && typeof module !== "undefined")
    module.exports = World;