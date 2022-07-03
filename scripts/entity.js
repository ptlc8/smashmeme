class Entity {
    constructor(data={}) {
        var entity = {};
        entity.pos = data.pos ? {x:data.pos.x||0, y:data.pos.y||0} : {x:0, y:0};
        entity.model = data.model || "";
        entity.action = data.action ? {start:data.action.start||Date.now(), name:data.action.name||"idle"} : {start:Date.now(), name:"idle"};
        entity.behaviour = data.behaviour || {/* TODO */};
        entity.direction = data.direction || "right";
        entity.spd = data.spd ? {x:data.spd.x||0, y:data.spd.y||0} : {x:0, y:0};
        entity.acc = data.acc ? {x:data.acc.x||0, y:data.acc.y||0} : {x:0, y:0};
        return entity;
    }
}