class Entity {
    constructor(behaviour, model, pos={}) {
        this.pos = {x:pos.x||0, y:pos.y||0};
        this.model = model || "";
        this.action = {start:Date.now(), name:"idle"};
        this.behaviour = behaviour;
        this.direction = "right";
        this.spd = {x:0, y:0};
        this.acc = {x:0, y:0};
    }
}

if (typeof exports==="object"&&typeof module!=="undefined")
    module.exports = Entity;