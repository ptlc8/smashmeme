if (typeof require === "function") {
    global.Entity = require("./entity");
}

class SmasherEntity extends Entity {
    constructor(smasher, spawn) {
        super(smasher.behaviour, smasher.model, spawn);
        this.jumps = smasher.jumps;
        this.cooldown = 0;
        this.specialUp = false;
    }
    // Override
    clone() {
        var clone = Object.create(Object.getPrototypeOf(this));
        clone.behaviour = this.behaviour;
        clone.model = this.model;
        clone.action = {start:this.action.start, name:this.action.name};
        clone.direction = this.direction;
        clone.pos = {x:this.pos.x, y:this.pos.y};
        clone.spd = {x:this.spd.x, y:this.spd.y};
        clone.acc = {x:this.acc.x, y:this.acc.y};
        clone.jumps = this.jumps;
        clone.cooldown = this.cooldown;
        clone.specialUp = this.specialUp;
        return clone;
    }
}

if (typeof exports==="object"&&typeof module!=="undefined")
    module.exports = SmasherEntity;