class SmashmemeRenderer {
    constructor(canvas) {
        this.setCanvas(canvas);
        this.images = {no: SmashmemeRenderer.createImage("assets/no.png"), loading: SmashmemeRenderer.createImage("assets/loading.png")};
        this.models = {};
        Loader.loadModelFromJSONFile("no").then(model => this.models.no=model);
        Loader.loadModelFromJSONFile("loading").then(model => this.models.loading=model);
        this.background = {};
        this.background.model = "crab-rave-island";
        this.background.anim = {name: "default", start: Date.now()};
    }

    setCanvas(canvas) {
        this.cvs = canvas;
        this.cvs.width = parseInt(getComputedStyle(this.cvs).width);
        this.cvs.height = parseInt(getComputedStyle(this.cvs).height);
        this.ctx = canvas.getContext("2d");
        window.addEventListener("resize", (e) => {
            this.cvs.width = parseInt(getComputedStyle(this.cvs).width);
            this.cvs.height = parseInt(getComputedStyle(this.cvs).height);
        });
    }

    start(game, fps=60) {
        this.stop();
        var startT = Date.now();
        this.renderIntervalId = setInterval(() => {
            this.renderGame(game, startT);
        }, 1000/fps);
    }
    stop() {
        clearInterval(this.renderIntervalId);
    }
    // Affichage d'une partie
    renderGame(game) {
        if (this.ctx.resetTransform) this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
        switch (game.state) {
            case Game.CHOOSE:
                this.renderChoosingGame(game, 0);
                break;
            case Game.PLAY:
                this.renderPlayingGame(game);
                break;
        }
    }
    renderPlayingGame(game) {
        this.ctx.translate(this.cvs.width/2, this.cvs.height/2);
        // Affichage du fond
        this.renderModel(this.getModel(this.background.model), Date.now()-this.background.anim.start, this.background.anim.name);
        
        this.ctx.scale(1/3, 1/3);
        // Affichage des plateformes
        this.ctx.fillStyle = "#f5f5f5";
        for (let platform of game.world.map.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        }
        // Affichage des entités
        for (let entity of game.world.entities) {
            this.ctx.translate(entity.pos.x, entity.pos.y);
            if (entity.behaviour[entity.anim.name] && Date.now()-entity.anim.start > entity.behaviour[entity.anim.name].in) {
                entity.anim.name = "idle" + ((entity.behaviour.idle && entity.behaviour.idle.directionable)?"-"+entity.direction:"");;
                entity.anim.start = Date.now();
            }
            this.renderModel(this.getModel(entity.model), Date.now()-entity.anim.start, entity.anim.name);
            if (game.debug && entity.behaviour.hitbox)
                this.renderHitbox(entity.behaviour.hitbox, "#0088ff88", true);
            if (game.debug && entity.behaviour[entity.anim.name].damage && entity.behaviour[entity.anim.name].damage.hitbox)
                this.renderHitbox(entity.behaviour[entity.anim.name].damage.hitbox, "#ff000088", true);
            this.ctx.translate(-entity.pos.x, -entity.pos.y);
        }
        this.ctx.scale(3, 3);
        
        this.ctx.translate(-this.cvs.width/2, -this.cvs.height/2);
    }
    renderChoosingGame(game, startT) {
        var w = this.cvs.width;
        var h = this.cvs.height;
        var z = w/3200;
        // Affichage du fond
        this.ctx.translate(w/2, h/2);
        this.renderModel(this.getModel(this.background.model), Date.now()-this.background.anim.start, this.background.anim.name);
        this.ctx.translate(-w/2, -h/2);
        // Affichage des persos
        this.ctx.scale(z, z);
        this.ctx.translate(200+w/8/z, 400);
        let perL = 6; // = parseInt(w/400/z*3/4)
        for (let i = 0; i < Smashmeme.smashers.length/perL; i++) {
            for (let j = 0; j < perL && j+perL*i < Smashmeme.smashers.length; j++) {
                this.ctx.translate(j*400, i*400);
                let smasher = Smashmeme.smashers[i*perL+j];
                this.renderModel(this.getModel(smasher.model), Date.now()-startT, "idle" + (smasher.behaviour["idle"]&&smasher.behaviour["idle"].directionable?"-right":""));
                this.renderText(this.ctx, smasher.name, 0, 64, 48, "#f5f5f5");
                this.ctx.translate(-j*400, -i*400);
            }
        }
        this.ctx.translate(-200-w/8/z, -400);
        this.ctx.scale(1/z, 1/z);
        this.ctx.translate(-w/2, -h/2);
    }
    // Affichage d'un texte
    renderText(text="", x=0, y=0, size=10, color) {
        this.ctx.textAlign = "center";
        this.ctx.font = size + "px Arial";
        if (color) this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
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
        if (hitbox.t === "r") {
            this.ctx.rect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        } else if (hitbox.t === "c") {
            this.ctx.beginPath();
            this.ctx.arc(hitbox.x, hitbox.y, hitbox.r, 0, 2*Math.PI);
        } else if (hitbox.t === "v") {
            this.ctx.beginPath();
            this.ctx.moveTo(hitbox.x, hitbox.y);
            this.ctx.arc(hitbox.x, hitbox.y, hitbox.r, hitbox.s*Math.PI/180, hitbox.e*Math.PI/180);
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