class SmashmemeRenderer {
    constructor(canvas) {
        this.setCanvas(canvas);
        this.images = {no: SmashmemeRenderer.createImage("assets/no.png"), loading: SmashmemeRenderer.createImage("assets/loading.png")};
        this.models = {};
        Loader.loadModelFromJSONFile("no").then(model => this.models.no=model);
        Loader.loadModelFromJSONFile("loading").then(model => this.models.loading=model);
        this.camera = {zoom:1/2, zooms:[], pos:{x:0, y:0}};
        this.renderRequestId = -1;
    }

    setCanvas(canvas) {
        this.cvs = canvas;
        this.cvs.width = parseInt(getComputedStyle(this.cvs).width);
        this.cvs.height = parseInt(getComputedStyle(this.cvs).height);
        this.ctx = canvas.getContext("2d", { alpha: false });
        window.addEventListener("resize", (e) => {
            this.cvs.width = parseInt(getComputedStyle(this.cvs).width);
            this.cvs.height = parseInt(getComputedStyle(this.cvs).height);
        });
    }

    start(client) {
        this.stop();
        this.renderRequestId = requestAnimationFrame(() => {
            this.renderClient(client);
            this.start(client);
        });
    }
    stop() {
        cancelAnimationFrame(this.renderRequestId);
    }
    // Mettre à jour de la caméra
    updateCamera(game, entity=null) {
        var minX, maxX, minY, maxY;
        minX = minY = Infinity;
        maxX = maxY = -Infinity;
        var entities;
        if(entity != null){
            entities = [entity];
        } else{
            entities = Object.values(game.world.entities);
        }
        for (let smasher of entities) {
            if (smasher.pos.x < minX) minX = smasher.pos.x;
            if (smasher.pos.x > maxX) maxX = smasher.pos.x;
            if (smasher.pos.y < minY) minY = smasher.pos.y;
            if (smasher.pos.y > maxY) maxY = smasher.pos.y;
        }
        this.camera.pos.x = (minX+maxX)/2;
        this.camera.pos.y = (minY+maxY)/2 - 50;
        //this.camera.zooms.push(1/(1+Math.sqrt(Math.pow(maxX-minX, 2)+Math.pow(maxY-minY, 2))/2000));
        this.camera.zooms.push(Math.min(1,600/Math.sqrt(Math.pow(maxX-minX, 2)+Math.pow(maxY-minY, 2))));
        if (this.camera.zooms.length > 10) this.camera.zooms.shift();
        this.camera.zoom = (this.camera.zooms[0]+this.camera.zooms[this.camera.zooms.length-1])/2;
    }
    // Affichage d'un client (menu ou jeu)
    renderClient(client) {
        // Nettoyage
        if (this.ctx.resetTransform) this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
        // Rendu
        if (client.game) {
            this.renderGame(client.game);
        } else {
            this.renderMainMenu(client);
        }
    }
    // Affichage du menu principal
    renderMainMenu(client) {

    }
    // Affichage d'une partie
    renderGame(game) {
        // Centrage et normalisation
        var ratio = Math.min(this.cvs.width/SmashmemeRenderer.WIDTH, this.cvs.height/SmashmemeRenderer.HEIGHT);
        this.ctx.translate(this.cvs.width/2, this.cvs.height/2);
        this.ctx.scale(ratio, ratio);
        // Affichage du fond
        if (game.map) {
            this.ctx.translate(-this.camera.pos.x/6, -this.camera.pos.y/6);
            this.renderModel(this.getModel(Smashmeme.maps[game.map].background), Date.now(), "idle");
            this.ctx.translate(this.camera.pos.x/6, this.camera.pos.y/6);
        }
        // Dessin
        if (game.debug) {
            this.renderHitbox({t:"r",w:SmashmemeRenderer.WIDTH,h:SmashmemeRenderer.HEIGHT,x:0,y:0}, "#00ff00")
            //this.ctx.strokeStyle = "#00ff00";
            //this.ctx.strokeRect(-SmashmemeRenderer.WIDTH/2, -SmashmemeRenderer.HEIGHT/2, SmashmemeRenderer.WIDTH, SmashmemeRenderer.HEIGHT);
        }
        switch (game.state) {
            case Game.CHOOSE:
                this.renderChoosingGame(game);
                break;
            case Game.COUNTDOWN:
                this.renderCountdownGame(game);
                break;
            case Game.PLAY:
                this.renderPlayingGame(game);
                break;
        }
        // Dénormalisation et décentrage
        this.ctx.scale(1/ratio, 1/ratio);
        this.ctx.translate(-this.cvs.width/2, -this.cvs.height/2);
    }
    renderPlayingGame(game) {
        this.updateCamera(game);
        this.renderWorld(game.world, game.debug);
    }
    renderChoosingGame(game) {
        var w = SmashmemeRenderer.WIDTH;
        var h = SmashmemeRenderer.HEIGHT;
        var z = w/3200;
        // Affichage des persos
        let perL = 6; // = parseInt(w/400/z*3/4)
        this.ctx.translate(-w/2, 200-h/2);
        let smashers = Object.values(Smashmeme.smashers);
        for (let i = 0; i < smashers.length/perL; i++) {
            for (let j = 0; j < perL && j+perL*i < smashers.length; j++) {
                let smasher = smashers[i*perL+j];
                this.ctx.translate(j*w/perL+w/perL/2, i*200);
                this.ctx.scale(1/2, 1/2);
                this.renderModel(this.getModel(smasher.model), Date.now()-game.stateStartTime, "idle" + (smasher.behaviour["idle"]&&smasher.behaviour["idle"].directionable?"-right":""));
                this.ctx.scale(2, 2);
                this.renderText(smasher.name, 0, 32, 24, "#f5f5f5");
                for (let player of game.players)
                    if (game.selectingSmasher[player.id] == i*perL+j) {
                        this.ctx.strokeStyle = SmashmemeRenderer.COLORS[player.id%SmashmemeRenderer.COLORS.length];
                        this.ctx.lineWidth = 8;
                        this.ctx.strokeRect(-w/perL/2+4, -146, w/perL-8, 192);
                    }
                this.ctx.translate(-j*w/perL-w/perL/2, -i*200);
            }
        }
        // Affichage des joueurs
        this.ctx.translate(w/game.players.length/2, -200+h/2+3*h/8);
        for (let i = 0; i < game.players.length; i++) {
            let player = game.players[i];
            this.ctx.translate(i*w/game.players.length, 0);
            this.ctx.lineWidth = 4;
            this.ctx.fillStyle = SmashmemeRenderer.COLORS[i%SmashmemeRenderer.COLORS.length];
            this.ctx.strokeStyle = "#222"
            this.ctx.beginPath();
            this.ctx.rect(-w/game.players.length/2, -h/8, w/game.players.length, h/4);
            this.ctx.fill();
            this.ctx.stroke();
            if (game.smashers[player.id]) {
                this.renderModel(this.getModel(game.smashers[player.id]), Date.now()-game.stateStartTime, "idle");
                this.renderText(Smashmeme.smashers[game.smashers[player.id]].name, 0, h/32, h/20, "#000");
            }
            this.renderText("Player "+player.id, 0, 3*h/32, h/40, "#000");
            this.ctx.translate(-i*w/game.players.length, 0);
        }
        this.ctx.translate(-w/game.players.length/2, +200-h/2-3*h/8);
        this.ctx.translate(w/2, -200+h/2);
        if (game.players.length == 0) {
            this.renderText("Touch your keyboard or your gamepad to join", w/2, 3*h/4, 42, "#fff");
        }
        if (game.canStart()) {
            this.ctx.fillStyle = "#222";
            this.ctx.strokeStyle = "#ff0";
            this.ctx.lineWidth = 12;
            this.ctx.beginPath();
            this.ctx.rect(-w, -h/8, 2*w, h/4);
            this.ctx.fill();
            this.ctx.stroke();
            this.renderText("Ready for battle !", 0, 0, h/10, "#fff");
        }
    }
    renderCountdownGame(game){
        var countdown = 3-parseInt((Date.now()-game.stateStartTime)/1000);
        if(countdown == 3){
            this.updateCamera(game, Object.values(game.world.smashers)[0]);
        } else if(countdown == 2){
            this.updateCamera(game, Object.values(game.world.smashers)[Object.values(game.world.smashers).length-1]);
        }

        this.renderWorld(game.world, game.debug);
        this.renderText(countdown, 0, 0, 500, "#000000");
    }
    renderWorld(world, debug=false){
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.pos.x, -this.camera.pos.y);
        // Affichage des plateformes
        this.ctx.fillStyle = "#f5f5f5";
        for (let platform of world.map.platforms) {
            this.ctx.translate(platform.x, platform.y);
            this.renderModel(this.getModel(platform.model), Date.now(), "idle");
            if (debug) this.renderHitbox(platform.hitbox, "#ffff0088", true);
            this.ctx.translate(-platform.x, -platform.y);
        }
        // Affichage des entités
        for (let entity of world.entities) {
            this.ctx.translate(entity.pos.x, entity.pos.y);
            this.renderModel(this.getModel(entity.model), Date.now()-entity.action.start, entity.action.name);
            if (debug && entity.hitbox)
                this.renderHitbox(entity.hitbox, "#0088ff88", true);
            if (debug && entity.behaviour[entity.action.name].damage && entity.behaviour[entity.action.name].damage.hitbox)
                this.renderHitbox(entity.behaviour[entity.action.name].damage.hitbox, "#ff000088", true);
            this.ctx.translate(-entity.pos.x, -entity.pos.y);
        }
        this.ctx.translate(this.camera.pos.x, this.camera.pos.y);
        this.ctx.scale(1/this.camera.zoom, 1/this.camera.zoom);
    }
    // Affichage d'un texte
    renderText(text="", x=0, y=0, size=10, color, textAlign="center") {
        this.ctx.textAlign = textAlign;
        this.ctx.font = size + "px Arial";
        if (color) this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y+size/2.5);
    }
    // Affichage d'un modèle
    renderModel(model, t, animName, options={}) { // t en ms
        if (!model) return;
        let a = {};
        if (model.anims)
            for (let [name, subAnims] of Object.entries(model.anims)) if (name.split("|").includes(animName))
                for (let anim of subAnims) {
                    let step = ~~(t%anim.in/anim.in*(anim.steps.length-1));
                    let stepsN = (anim.steps.length-1);
                    a[anim.on] = anim.steps[step]+EasingFunctions[anim.func](t%(anim.in/stepsN)/(anim.in/stepsN))*(anim.steps[step+1]-anim.steps[step]);
                }
        if (options.miror) ctx.scale(-1, 1);
        if (model.scale.x*(a.scaleX||1) !== 0 && model.scale.y*(a.scaleY||1) !== 0) {
            this.ctx.translate(model.pos.x+(a.posX||0), model.pos.y+(a.posY||0));
            this.ctx.rotate((model.rot+(a.rot||0))*Math.PI/180);
            this.ctx.scale(model.scale.x*(a.scaleX||1), model.scale.y*(a.scaleY||1));
            let img = this.getImage(model.img)
            this.ctx.translate(img.width*(-model.origin.x-(a.originX||0)), img.height*(-model.origin.y-(a.originY||0)));
            this.ctx.globalAlpha -= model.trsp+(a.trsp||0);
            for (let pinned of model.pinneds)
                if (pinned.bh) this.renderModel(pinned, t, animName);
                this.ctx.drawImage(img, 0, 0);
            for (let pinned of model.pinneds)
                if (!pinned.bh) this.renderModel(pinned, t, animName);
            this.ctx.globalAlpha += model.trsp+(a.trsp||0);
            this.ctx.translate(img.width*(model.origin.x+(a.originX||0)), img.height*(model.origin.y+(a.originY||0)));
            this.ctx.scale(1/model.scale.x/(a.scaleX||1), 1/model.scale.y/(a.scaleY||1));
            this.ctx.rotate((-model.rot-(a.rot||0))*Math.PI/180);
            this.ctx.translate(-model.pos.x-(a.posX||0), -model.pos.y-(a.posY||0));
        }
        if (options.miror) this.ctx.scale(-1, 1);
    }
    // Affichage d'une hitbox
    renderHitbox(hitbox, color, fill=false) {
        this.ctx.beginPath();
        if (hitbox.t === "r") {
            this.ctx.rect(hitbox.x-hitbox.w/2, hitbox.y-hitbox.h/2, hitbox.w, hitbox.h);
        } else if (hitbox.t === "c") {
            this.ctx.arc(hitbox.x, hitbox.y, hitbox.r, 0, 2*Math.PI);
        } else if (hitbox.t === "v") {
            this.ctx.moveTo(hitbox.x, hitbox.y);
            this.ctx.arc(hitbox.x-hitbox.w/2, hitbox.y-hitbox.h/2, hitbox.r, hitbox.s*Math.PI/180, hitbox.e*Math.PI/180);
            this.ctx.lineTo(hitbox.x, hitbox.y);
        }
        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 8;
            this.ctx.stroke();
        }
    }

    // Gestion des images
    static createImage(src) {
        var img = new Image();
        img.src = src;
        return img;
    }
    getImage(src, ignoreLoading=false) {
        if (this.images[src])
            return this.images[src].complete || ignoreLoading ? this.images[src] : this.images.loading;
        var img = new Image();
        img.onerror = () => {
            this.images[src] = images.no;
            console.error("Can't load image : " + src);
        }
        img.onload = () => {
            console.info("Image loaded : " + src);
        }
        img.src = "assets/" + src;
        this.images[src] = img;
        return ignoreLoading ? img : this.images.loading;
    }

    // Gestion des modèles 2D
    getModel(src) {
        if (this.models[src]) return this.models[src]=="loading" ? this.models.loading : this.models[src];
        Loader.loadModelFromJSONFile(src).then((model) => {
            this.models[src] = model;
            console.info("Model loaded : " + src);
        }).catch((reason) => {
            this.models[src] = this.models.no;
            console.error("Can't load model "+(reason?"("+reason+") ":"")+": " + src);
        });
        this.models[src] = "loading";
        return this.models.loading;
    }
    static newModel = (data) => {
        var model = {};
        model.img = data.img || "no.png";
        model.origin = data.origin ? {x:data.origin.x!==undefined?data.origin.x:.5, y:data.origin.y!==undefined?data.origin.y:.5} : {x:.5, y:.5};
        model.pos = data.pos ? {x:data.pos.x||0, y:data.pos.y||0} : {x:0, y:0};
        model.rot = data.rot || 0;
        model.scale = data.scale ? {x:data.scale.x||1, y:data.scale.y||1} : {x:1, y:1};
        model.anims = data.anims || {};
        //model.pinneds = data.pinneds || [];
        model.pinneds = [];
        if (data.pinneds) for (let pinned of data.pinneds)
            model.pinneds.push(newModel(pinned));
        model.trsp = data.trsp || 0;
        model.bh = data.bh || false;
        return model;
    }

    static newAnim(on="", steps=[], iN=1000, func="linear") {
        var anim = {};
        anim.on = on;
        anim.steps = steps;
        anim.in = iN;
        if (!EasingFunctions[func]) throw "Unknow anim function : " + func;
        anim.func = func;
        return anim;
    }
}

SmashmemeRenderer.WIDTH = 1620;
SmashmemeRenderer.HEIGHT = 1000;
SmashmemeRenderer.COLORS = ["#4488ff", "#ff4488", "#88ff44", "#ffff00", "#00ffff", "#ff00ff", "#ff8844"];