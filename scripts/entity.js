class Entity {
    constructor(model, hitbox=null, pos={}) {
        this.model = model || "";
        this.hitbox = hitbox ? Object.assign({}, hitbox) : null;
        this.pos = {x:pos.x||0, y:pos.y||0};
        this.action = {start:Date.now(), name:"idle"};
        this.direction = "right";
        this.spd = {x:0, y:0};
        this.acc = {x:0, y:0};
    }
    clone() {
        var clone = new Entity(this.model, this.hitbox, this.pos);
        clone.action = {start:this.action.start, name:this.action.name};
        clone.direction = this.direction;
        clone.spd = {x:this.spd.x, y:this.spd.y};
        clone.acc = {x:this.acc.x, y:this.acc.y};
        return clone;
    }
}

if (typeof exports==="object"&&typeof module!=="undefined")
    module.exports = Entity;