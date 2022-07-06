if (typeof require==="function") {
    global.fs = require("fs");
}

var Loader = {
	loadModelFromJSONFile(filePath, external=false) {
		if (!external) filePath = "models/" + filePath + ".json";
		return this.loadJSONFile(filePath);
	},

	loadSmasherFromJSONFile(filePath, external=false) {
		if (!external) filePath = "smashers/" + filePath;
		return this.loadJSONFile(filePath);
	},

	loadMapFromJSONFile(filePath, external=false) {
		if (!external) filePath = "maps/" + filePath;
		return this.loadJSONFile(filePath);
	},

	loadJSONFile(filePath) {
		var promise = new Promise((resolve, reject) => {
			if (typeof window == "object") {
				var request = new XMLHttpRequest();
				request.open("GET", filePath);
				request.onreadystatechange = function() {
					if (this.readyState == XMLHttpRequest.DONE) {
						if (this.status == 200)
							resolve(JSON.parse(this.response));
						else reject(this.status);
					}
				}
				request.send();
			} else {
				fs.readFile(filePath, "utf8", function (err,data) {
					if (!err)
						resolve(JSON.parse(data));
					else reject(err);
				});
			}
		});
		return promise;
	}
};

if (typeof exports==="object" && typeof module!=="undefined")
    module.exports = Loader;