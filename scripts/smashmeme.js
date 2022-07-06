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
    smashers: {},
    maps: {},
    getRandomSmasher() {
        var smashers = Object.keys(Smashmeme.smashers);
        return Smashmeme.smashers[smashers[Math.floor(Math.random()*smashers.length)]];
    },
    getRandomMap() {
        var maps = Object.keys(Smashmeme.maps);
        return Smashmeme.maps[maps[Math.floor(Math.random()*maps.length)]];
    }
};

// fonction de chargement des données
Smashmeme.load = function() {
    return Promise.all([
        // Loading smashers
        Promise.all(["knuckle", "coffin-dancers", "buffed-doge", "glob", "raptor", "bongo-cat", "pepe"].map((smasher) => {
            return Loader.loadSmasherFromJSONFile(smasher+".json").then(loadedSmasher => {
                Smashmeme.smashers[smasher] = loadedSmasher;
                Smashmeme.smashers[smasher].id = smasher;
            });
        })).then(loadedSmashers => {
            console.info("Smashers loaded : " + loadedSmashers.length);
        }),

        // Loading maps
        Promise.all(["nyan-cat-space", "crab-rave-island"].map((map) => {
            return Loader.loadMapFromJSONFile(map+".json").then(loadedMap => {
                Smashmeme.maps[map] = loadedMap;
                Smashmeme.maps[map].id = map;
            });
        })).then(loadedMaps => {
            console.info("Maps loaded : " + loadedMaps.length);
        })
    ]);
};

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = Smashmeme;