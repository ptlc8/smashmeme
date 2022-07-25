Smashmeme.load().then(() => {
    var smashersElement = document.getElementById("smashers");
    for (let name in Smashmeme.smashers) {
        let smasher = Smashmeme.smashers[name];
        let article = document.createElement("article");
        article.innerHTML = `
            <canvas class="smasher-view" data-smasher="${smasher.id}"></canvas>
            <span class="title">${smasher.name}</span>
            <p class="description">${smasher.description}</p>`;
        smashersElement.appendChild(article);
    }
    var cvs = [...document.getElementsByClassName("smasher-view")];
    var renderers = cvs.map(cvs => new SmashmemeRenderer(cvs, true));
    var render = (time) => {
        for (let i = 0; i < cvs.length; i++) {
            var ctx = cvs[i].getContext("2d");
            if (ctx.resetTransform) ctx.resetTransform();
            ctx.clearRect(0, 0, cvs[i].width, cvs[i].height);
            var zoom = Math.min(cvs[i].height / 250, cvs[i].width / 250);
            ctx.translate(cvs[i].width/2, cvs[i].height/2-Smashmeme.smashers[cvs[i].dataset.smasher].hitbox.y/2);
            ctx.scale(zoom, zoom);
            renderers[i].renderModel(renderers[i].getModel(cvs[i].dataset.smasher), time, "idle");
            ctx.scale(1/zoom, 1/zoom);
            ctx.translate(-cvs[i].width/2, -cvs[i].height);
        }
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
});