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
}

if (typeof exports==="object"&&typeof module!=="undefined")
    module.exports = SmasherEntity;