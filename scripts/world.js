if (typeof require === "function") {
    global.SmasherEntity = require("./smasherentity");
    global.Smashmeme = require("./smashmeme");
}

class World {
    constructor(map, smashers={}) {
        this.map = Smashmeme.maps[map];
        this.tick = 0;
        this.smashers = {};
        this.entities = [];
        this.playerInputs = {};
        for (const [index,playerId] of Object.entries(Object.keys(smashers))) {
            this.entities.push(this.smashers[playerId] = new SmasherEntity(Smashmeme.smashers[smashers[playerId]], this.map.spawns[index]));
            this.playerInputs[playerId] = {left:{}, right:{}, up:{}, down:{}, jump:{}, attack:{}, special:{}, shield:{}};
        }
    }
    clone() {
        var clone = Object.create(Object.getPrototypeOf(this));
        clone.map = this.map;
        clone.tick = this.tick;
        clone.smashers = {};
        clone.entities = [];
        for (let playerId in this.smashers) {
            clone.entities.push(clone.smashers[playerId] = this.smashers[playerId].clone());
        }
        for (let i = clone.entities; i < this.entities.length; i++) {
            clone.entities.push(entities[i].clone());
        }
        clone.playerInputs = {};
        for (let playerId in this.playerInputs) {
            clone.playerInputs[playerId] = {};
            for (let tick in this.playerInputs[playerId]) {
                clone.playerInputs[playerId][tick] = this.playerInputs[playerId][tick]; // TODO: not exact
            }
        }
        return clone;
    }
    update(playersNewInputs={}) {
        // Mise à jour des inputs
        for (let playerId in this.playerInputs) {
            for (let input of ["left", "right", "up", "down", "jump", "attack", "special", "shield"]) {
                this.playerInputs[playerId][input].clicked = false;
                if (!playersNewInputs[playerId] || !(input in playersNewInputs[playerId])) continue;
                var value = playersNewInputs[playerId][input];
                if (!this.playerInputs[playerId][input])
                    this.playerInputs[playerId][input] = {pressed:value!=0, clicked:value!=0, value};
                else {
                    this.playerInputs[playerId][input].clicked = !this.playerInputs[playerId][input].pressed && value!=0;
                    this.playerInputs[playerId][input].pressed = value!=0;
                    this.playerInputs[playerId][input].value = value;
                }
            }
        }
        // Application des inputs
        for (let player in this.smashers) {
            var inputs = this.playerInputs[player] || { right: {}, left: {}, up: {}, down: {}, jump: {}, attack: {}, special: {}, shield: {} };
            var smasher = this.smashers[player];

            // Diminution du temps de cooldown s'il y en a un
            if (smasher.cooldown)
                smasher.cooldown--;

            if (!smasher.cooldown) {
                var action = null;
                // Attaque
                if (!smasher.cooldown && inputs.attack.clicked) {
                    if (inputs.right.pressed && !inputs.left.pressed) {
                        action = "attack-right";
                    } else if (inputs.left.pressed && !inputs.right.pressed) {
                        action = "attack-left";
                    } else if (inputs.up.pressed && !inputs.down.pressed) {
                        action = "attack-up";
                    } else if (inputs.down.pressed && !inputs.up.pressed) {
                        action = "attack-down";
                    } else {
                        action = "attack";
                    }
                // Spécial
                } else if (!smasher.cooldown && inputs.special.clicked) {
                    if (inputs.right.pressed && !inputs.left.pressed) {
                        action = "special-right";
                    } else if (inputs.left.pressed && !inputs.right.pressed) {
                        action = "special-left";
                    } else if (inputs.up.pressed && !inputs.down.pressed && !smasher.specialUp) {
                        action = "special-up" + (smasher.behaviour["special-up"].directionable ? "-" + smasher.direction : "");
                        smasher.specialUp = true;
                    } else if (inputs.down.pressed && !inputs.up.pressed) {
                        action = "special-down" + (smasher.behaviour["special-down"].directionable ? "-" + smasher.direction : "");
                    } else {
                        action = "special";
                    }
                }
                // Saut
                else if (inputs.jump.clicked && smasher.jumps < smasher.jumpsLimit) {
                    action = "jump";
                    smasher.jumps++;
                // Déplacement gauche/droite
                } else if (!inputs.right.pressed != !inputs.left.pressed) {
                    smasher.direction = inputs.right.pressed ? "right" : "left";
                    action = "walk" + (smasher.behaviour["walk"].directionable ? "-" + smasher.direction : "");
                // Inactivité
                } else {
                    action = "idle" + ((smasher.behaviour.idle && smasher.behaviour.idle.directionable) ? "-" + smasher.direction : "");
                }
                // Si on passe à une nouvelle action
                if (action != null) {
                    if (!smasher.behaviour[action])
                        console.error("Behaviour " + action + " not found");
                    if (smasher.action.name != action) {
                        smasher.action.name = action;
                        smasher.action.start = Date.now();
                    }
                    // Application du cooldown
                    if (smasher.behaviour[action].in)
                        smasher.cooldown = Math.ceil(smasher.behaviour[action].in / World.TICK_DURATION);
                }
            }
            
            let behaviour = smasher.behaviour[smasher.action.name] || {};
            // Déplacement impliqué par l'action
            if (behaviour.move) {
                if (behaviour.move.reset) {
                    smasher.spd.x = behaviour.move.x*World.TICK_DURATION;
                    smasher.spd.y = behaviour.move.y*World.TICK_DURATION;
                } else {
                    smasher.acc.x += behaviour.move.x*World.TICK_DURATION;
                    smasher.acc.y += behaviour.move.y*World.TICK_DURATION;
                }
            }
            // Dégâts impliqué par l'action
            if (behaviour.damage) {
                // TODO
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
            entity.spd.y /= 1.1; // frottement y
            if (this.getDistanceFromFloor(entity.pos.x, entity.pos.y) <= 0 && entity.spd.y >= 0) { // si au sol
                if (entity.acc.y > 0) entity.acc.y = 0;
                entity.jumps = 0;
                entity.specialUp = false;
            } else {
                entity.acc.y = inputs.down.pressed ? World.G*2 : World.G; // g sur Terre en cm.(s/30)^-2 /3
            }
        }
        this.tick++;
    }
    getDistanceFromFloor(x, y) {
        let dist = Infinity;
        for (let platform of this.map.platforms) {
            if (platform.x+platform.hitbox.x-platform.hitbox.w/2 <= x && x <= platform.x+platform.hitbox.x+platform.hitbox.w/2 && y <= platform.y+platform.hitbox.y-platform.hitbox.h/2) {
                dist = Math.min(dist, platform.y+platform.hitbox.y-platform.hitbox.h/2 - y);
            }
        }
        return dist;
    }
}

World.TICK_DURATION = 1000 / 30;
World.G = 7 * 980 * World.TICK_DURATION/1000*World.TICK_DURATION/1000;;

if (typeof exports === "object" && typeof module !== "undefined")
    module.exports = World;