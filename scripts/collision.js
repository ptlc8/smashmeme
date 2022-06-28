var Collision = function(){
	var vectorLength = function(vector) {
		return Math.sqrt(vector.x*vector.x + vector.y*vector.y);
	};
	var rotateVector = function(vector, angle) { // degrees
		let v = {x:vector.x, y:vector.y};
		let cosR = Math.cos((angle * 180/Math.PI));
		let sinR = Math.sin((angle * 180/Math.PI));
		vector.x =(v.x*cosR - v.y*sinR);
		vector.y = (v.x*sinR + v.y*cosR);
		return vector;
	};
	var newShape = function(...vertex) {
		vertex.maxRadius = 0;
		for (let v of vertex)
			if (vectorLength(v) > vertex.maxRadius) maxRadius = vectorLength(v);
		return vertex;
	};
	var newRegularPolygon = function(cx, cy, n, r, startAngle=0) { // degrees
		var vertex = [];
		vertex.maxRadius = vectorLength({x:cx, y:cy})+r;
		startAngle = startAngle*Math.PI/180;
		for (let i = 0; i < n; i++) {
			vertex.push({x:Math.cos(2*Math.PI/n*i+startAngle)*r+cx, y:Math.sin(2*Math.PI/n*i+startAngle)*r+cy});
		}
		return vertex;
	};
	var newCircle = function(cx, cy, r) {
		var vertex = [{x:cx, y:cy}];
		vertex.maxRadius = vectorLength({x:cx, y:cy})+r;
		vertex.radius = r;
		return vertex;
	};
	return {
		newShape: newShape,
		newRegularPolygon: newRegularPolygon,
		newCircle: newCircle,
		parseShape: function(parsedShape) {
			let args = parsedShape.split(" ");
			if (parsedShape.length>0)
				switch (parsedShape[0]) {
				case 'c':
					if (args.length < 4) break;
					return newCircle(parseFloat(args[1]), parseFloat(args[2]), parseFloat(args[3]));
				case 'r':
					if (args.length < 6) break;
					return newRegularPolygon(parseFloat(args[1]), parseFloat(args[2]), parseInt(args[3]), parseFloat(args[4]), parseFloat(args[5]));
				case 'p':
					let vertex = [];
					for (let i = 1; i < args.length-1; i+=2)
						vertex.push({x:parseFloat(args[i]), y:parseFloat(args[i+1])});
					return newShape.apply(this, vertex);
				default:
					console.error("Unknow parsed shape prefix : " + parsedShape);
					return undefined;
				}
			console.error("Cannot read parsed shape : " + parsedShape);
			return undefined;
		},
		has: function(pos1, shape1, rot1, pos2, shape2, rot2=0) { // degrees
		    console.error(JSON.stringify(shape1)+" en "+pos1.x+";"+pos1.y+" et "+JSON.stringify(shape2)+" en "+pos2.x+";"+pos2.y);
		    
			if (!shape1 || !shape2 || shape1.length == 0 || shape2.length == 0) return false;
			
			//if (vectorLength({x:pos1.x-pos2.x, y:pos1.y-pos2.y}) > shape1.maxRadius+shape2.maxRadius) return false;
			// tmp delete
			if (shape1.radius !== undefined && shape2.radius !== undefined) // if 2 circles
				if (vectorLength({x:pos1.x+shape1[0].x-pos2.x-shape2[0].x, y:pos1.y+shape1[0].y-pos2.y-shape2[0].y}) <= shape1.radius + shape2.radius)
					return true;
			
			if (shape1.radius === undefined) for (let i = 0; i < shape1.length; i++) { // pour toutes les faces de vertex1
				let v1 = shape1[i], v2 = shape1[i == 0 ? shape1.length-1 : i-1];
				
				let normalAngle = (Math.atan2(v1.y-v2.y, v1.x-v2.x) * 180/Math.PI) + rot1;
				
				let min1 = 3.4e+038;
				let max1 = -3.4e+038;
				for (let vertex of shape1) {
					let v = rotateVector({x:vertex.x, y:vertex.y}, rot1);
					v = rotateVector({x: v.x+pos1.x, y:v.y+pos1.y}, normalAngle);
					if (v.x < min1) min1 = v.x;
					if (v.x > max1) max1 = v.x;
				}
				
				let min2 = 3.4e+038;
				let max2 = -3.4e+038;
				if (shape2.radius) { // if circle
					let v = rotateVector({x:shape2[0].x, y:shape2[0].y}, rot2);
					v = rotateVector({x:v.x+pos2.x, y:v.y+pos2.y}, normalAngle);
					min2 = v.x-shape2.radius;
					max2 = v.x+shape2.radius;
				} else
				for (let vertex of shape2) {
					let v = rotateVector({x:vertex.x, y:vertex.y}, rot2);
					v = rotateVector({x:v.x+pos2.x, y:v.y+pos2.y}, normalAngle);
					if (v.x < min2) min2 = v.x;
					if (v.x > max2) max2 = v.x;
				}
				if (max1 < min2 || max2 < min1) return false;
				
			}
			
			if (shape2.radius === undefined) for (let i = 0; i < shape2.length; i++) { // pour toutes les faces de vertex2
				let v1 = shape2[i], v2 = shape2[i == 0 ? shape2.length-1 : i-1];
				
				let normalAngle = (Math.atan2(v1.y-v2.y, v1.x-v2.x) * 180/Math.PI) + rot2;
				
				let min1 = 3.4e+038;
				let max1 = -3.4e+038;
				if (shape1.radius) { // if Circle
					let v = rotateVector({x:shape1[0].x, y:shape1[0].y}, rot1);
					v = rotateVector({x:v.x+pos1.x, y:v.y+pos1.y}, normalAngle);
					min1 = v.x-shape1.radius;
					max1 = v.x+shape1.radius;
				} else
				for (let vertex of shape1) {
					let v = rotateVector({x:vertex.x, y:vertex.y}, rot1);
					v = rotateVector({x: v.x+pos1.x, y:v.y+pos1.y}, normalAngle);
					if (v.x < min1) min1 = v.x;
					if (v.x > max1) max1 = v.x;
				}
				
				let min2 = 3.4e+038;
				let max2 = -3.4e+038;
				for (let vertex of shape2) {
					let v = rotateVector({x:vertex.x, y:vertex.y}, rot2);
					v = rotateVector({x:v.x+pos2.x, y:v.y+pos2.y}, normalAngle);
					if (v.x < min2) min2 = v.x;
					if (v.x > max2) max2 = v.x;
				}
				
				if (max1 < min2 || max2 < min1) return false;
				
			}
			
			return true;
		}
	}
}();

if (typeof exports==="object"&&typeof module!=="undefined")
    module.exports = Collision;