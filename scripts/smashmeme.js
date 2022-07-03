if (typeof require==="function") {
    global.Game = require("./game");
    global.Loader = require("./loader");
}

console.info("███╗█╗█╗███╗███╗█╗█╗█╗█╗███╗█╗█╗███╗"
         + "\n█╔═╝███║█╔█║█╔═╝█║█║███║█╔═╝███║█╔═╝"
         + "\n███╗█╔█║███║███╗███║█╔█║██╗ █╔█║██╗ "
         + "\n╚═█║█║█║█╔█║╚═█║█╔█║█║█║█╔╝ █║█║█╔╝ "
         + "\n███║█║█║█║█║███║█║█║█║█║███╗█║█║███╗"
         + "\n╚══╝╚╝╚╝╚╝╚╝╚══╝╚╝╚╝╚╝╚╝╚══╝╚╝╚╝╚══╝");


var Smashmeme = {
    smashers: [],
    maps: []
};

// fonction de chargement des données
Smashmeme.load = function() {
    return Promise.all([
            // Loading smashers
        Promise.all(["knuckle", "coffin-dancers", "buffed-doge", "glob", "raptor", "bongo-cat", "pepe"].map((smasher) => {
            return Loader.loadBehaviourFromJSONFile(smasher+".json").then((loadedSmasher) => {
                Smashmeme.smashers.push({name: smasher, model: smasher, behaviour: loadedSmasher});
            });
        })).then(() => {
            console.info("Smashers loaded : " + Smashmeme.smashers.length);
        }),

        // Loading maps
        Promise.all(["nyan-cat-space", "crab-rave-island"].map((map) => {
            return Loader.loadMapFromJSONFile(map+".json");
        })).then((loadedMaps) => {
            Smashmeme.maps.push(...loadedMaps);
            console.info("Maps loaded : " + Smashmeme.maps.length);
        })
    ]);
};

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = Smashmeme;