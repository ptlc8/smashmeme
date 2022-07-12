var Collision = function(){
	var vectorLength = function(vector) {
		return Math.sqrt(vector.x*vector.x + vector.y*vector.y);
	};
	var rotateVector = function(vector, angle) { // degrees
		let v = {x:vector.x, y:vector.y};
		let cosR = Math.cos((angle / 180*Math.PI));
		let sinR = Math.sin((angle / 180*Math.PI));
		vector.x = (v.x*cosR - v.y*sinR);
		vector.y = (v.x*sinR + v.y*cosR);
		return vector;
	};
	var has = function(pos1, shape1, pos2, shape2) { // degrees
		    
		if (!shape1 || !shape2 || !shape1.t || !shape2.t) return false;

		// alphabetic order of type
		if (shape1.t > shape2.t)
			return has(pos2, shape2, pos1, shape1);

		var x1 = pos1.x+shape1.x, y1 = pos1.y+shape1.y;
		var x2 = pos2.x+shape2.x, y2 = pos2.y+shape2.y;

		// if 2 circles
		if (shape1.t == "c" && shape2.t == "c")
			return vectorLength({x:x1-x2, y:y1-y2}) <= shape1.r + shape2.r;
		
		// if 2 rectangles
		if (shape1.t == "r" && shape2.t == "r")
			return x1-shape1.w/2 <= x2+shape2.w/2
				&& x1+shape1.w/2 >= x2-shape2.w/2
				&& y1-shape1.h/2 <= y2+shape2.h/2
				&& y1+shape1.h/2 >= y2-shape2.h/2;

		// if circle and cone
		if (shape1.t == "c" && shape2.t == "v") {
			if (vectorLength({x:x1-x2, y:y1-y2}) > shape1.r + shape2.r)
				return false;
			var s = rotateVector({x:x1-x2, y:y1-y2}, 180-shape2.s);
			var e = rotateVector({x:x1-x2, y:y1-y2}, -shape2.e);
			if (((shape2.s-shape2.e)%360+360)%360 > 180) // angle aigu
				return s.y - shape1.r <= 0 && e.y - shape1.r <= 0;
			else // angle obtus
				return s.y - shape1.r <= 0 || e.y - shape1.r <= 0;
		}

		// if circle and rectangle
		if (shape1.t == "c" && shape2.t == "r") {
			var dx = Math.abs(x1-x2), dy = Math.abs(y1-y2);
			if (dx > shape2.w/2+shape1.r || dy > shape2.h/2+shape1.r)
			 	return false;
			if (dx <= shape2.w/2 || dy <= shape2.h/2)
			 	return true;
			return vectorLength({x:dx-shape2.w/2, y:dy-shape2.h/2}) <= shape1.r;
		}

		// TODO : collision cone-cone and cone-rectangle

		return false;
	};
	return {
		has: has
	}
}();

if (typeof exports==="object"&&typeof module!=="undefined")
    module.exports = Collision;