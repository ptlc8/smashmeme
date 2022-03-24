AmbiEngine = function() {
    var log = function(message) {
        console.log("[AmbiEngine] "+message);
    }
    var error = function(message) {
        console.error("[AmbiEngine] "+message);
    }
    var create = function(cvs, w, h, update, render, tps=30, listeners={}) {
        cvs.width = w;
        cvs.height = h;
        var ctx = cvs.getContext("2d");
        // camera
        var cam = {x:0, y:0, s:1000};
        var setCameraPos = function(x, y) {
            cam.x = x;
            cam.y = y;
        }
        var setCameraSize = function(s) {
            cam.s = s;
        }
        var getCameraWidth = function() {
            return Math.max(cam.s*cvs.width/cvs.height, cam.s);
        }
        var getCameraHeight = function() {
            return Math.max(cam.s*cvs.height/cvs.width, cam.s);
        }
        var convertSize = function(xOrY) {
            return xOrY*Math.min(cvs.width, cvs.height)/cam.s;
        }
        var convertX = function(x) {
            return x*Math.min(cvs.width, cvs.height)/cam.s-cam.x+cvs.width/2;
        }
        var convertY = function(y) {
            return y*Math.min(cvs.width, cvs.height)/cam.s-cam.y+cvs.height/2;
        }
        // events
        for (let event of Object.keys(listeners)) {
            if (!["click","keyup","keydown","mousemove"].includes(event)) {
                error("Unknown event : "+event);
                continue;
            }
            if (event=="click" || event=="mousemove")
                cvs.addEventListener(event, function(e) {
                    let sx = e.offsetX*cvs.width/cvs.clientWidth, sy = e.offsetY*cvs.height/cvs.clientHeight;
                    listeners[event]({x:(sx-cvs.width/2+cam.x)*cam.s/Math.min(cvs.width, cvs.height), y:(sy-cvs.height/2+cam.y)*cam.s/Math.min(cvs.width, cvs.height), sx:sx, sy:sy, button:e.button, buttons:e.buttons});
                    //listeners[event]({x:e.offsetX*cvs.width/cvs.clientWidth*getCameraWidth()/cvs.width+cam.x-getCameraWidth()/2, y:e.offsetY*cvs.height/cvs.clientHeight*getCameraHeight()/cvs.height+cam.y-getCameraHeight()/2, sx:e.offsetX*cvs.width/cvs.clientWidth, sy:e.offsetY*cvs.height/cvs.clientHeight, button:e.button, buttons:e.buttons});
                });
            else
                cvs.addEventListener(event, function(e) {
                    listeners[event]({code:e.code});
                });
        }
        // ambiContext
        var drawRect = function(color, x, y, w, h) {
            ctx.fillStyle = color;
            ctx.fillRect(convertX(x), convertY(y), convertSize(w), convertSize(h));
        }
        var drawRectInfiniteX = function(color, y, h) {
            ctx.fillStyle = color;
            ctx.fillRect(0, convertY(y), cvs.width, convertSize(h));
        }
        var drawRectInfiniteY = function(color, x, w) {
            ctx.fillStyle = color;
            ctx.fillRect(convertX(x), 0, convertSize(w), cvs.height);
        }
        var clear = function() {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
        }
        var ambiContext = {
            drawRect: drawRect,
            drawRectInfiniteX: drawRectInfiniteX,
            drawRectInfiniteY: drawRectInfiniteY,
            clear: clear
        };
        // loops
        var lastTick = Date.now();
        setInterval(function() {
            update(lastTick - (lastTick = Date.now()));
        }, 1000/tps);
        var requestRender = function() {
            requestAnimationFrame(function() {
                render(ambiContext);
                requestRender(requestRender);
            });
        }
        requestRender();
        return {
            setCameraPos: setCameraPos,
            setCameraSize: setCameraSize
        };
    }
    return {
        create: create
    };
}();