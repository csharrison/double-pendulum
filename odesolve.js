/* requires underscore.js */

try{
	_.each(Object.getOwnPropertyNames(Math), function(func){
		eval(func+' = Math.'+func);
	})
}catch(err){

}

function plus(x,y){ return x + y; }

function sumAll(x){ return _.reduce(x, plus); }

function scale(c,x){
	return _.map(x, function(elt){ return elt * c; });
}

function sum(){
	return _.map(_.zip.apply(null, arguments), sumAll);
}


function getF(vars, system){
	var all_vars = vars.join(","); // ['x','y','z'] -> 'x,y,z'
	var funcs = _.map(system, function(f){
		return eval("( function(" + all_vars + ") { return " + f + ";} )");
	});

	return function(point){
		return _.map(funcs, function(e){
			return e.apply(null, point);
		});
	};
}

function rungeKutta(f, yn, step){
	var h = step;
	var k1 = f(yn),
	k2 = f(sum(yn, scale(h/2, k1))),
	k3 = f(sum(yn, scale(h/2, k2))),
	k4 = f(sum(yn, scale(h, k3)));

	return sum(yn, scale(h/6, sum(k1, scale(2, k2), scale(2, k3), k4)));
	// yn + (h/6)*(k1 + 2*k2 + 2*k3 + k4);
}

function odeGenerate(dict){
	var S = _.extend({
		vars: [],      // list of strings, e.g. ['x', 'y',' z']
		system: [],    // list of functions representing first order derivatives
		initial: [],   // must line up with "system"
		step: .1,
	}, dict);

	var f = getF(S.vars, S.system); // eval the functions

	var h = S.step;

	var y = S.initial;
	return function(){
		y = rungeKutta(f, y, h);
		return y;
	}
}

function odeSolve(dict){
	var T = dict.T || 100;
	var generator = odeGenerate(dict);

	var points = [dict.initial];
	for(var t=0; t<T; t = t + dict.step){
		points.push(generator());
	}
	return points;
}

