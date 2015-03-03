/* double pendulum is modeled by */

;
var t1d = "((6 / (1 * pow(L,2)))  *  (2*p1 - 3*cos(t1 - t2)*p2)/(16-9*pow(cos(t1-t2),2)))";

var t2d = "((6 / (1 * pow(L,2)))  *  (8*p2 - 3*cos(t1 - t2)*p1)/(16-9*pow(cos(t1-t2),2))) ";

var p1d = "-(1/2)*1*pow(L,2)  *  ("+t1d+"*"+t2d+"* sin(t1-t2) + 3*(9.8/L)*sin(t1))";

var p2d = "-(1/2)*1*pow(L,2)  *  (-"+t1d+"*"+t2d+"* sin(t1-t2) + 3*(9.8/L)*sin(t2))";

var initial = [PI/2, PI, 0, 0];


var params = {
	/* private */
	vars: ["t1", "t2", "p1", "p2"],
	initial: initial,
	/* public */
	step: .01,
	T: 100,
	L: 10,
	/* fun */
	C1: "rgba(0,0,0,.01)",
	C2: "rgba(255,0,0,.1)",
	anim_speed: 1,
	fps: 60,
	trails: 10
};

params.system = _.map([t1d, t2d, p1d, p2d], function(eq){
	return eq.split("L").join(params.L);
});

function hexToRgba(hex, alpha) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return "rgba("+[r,g,b, alpha].join(',') + ")";
}



function setup(dict){
	c.width = $("body").width();
	c.height = window.innerHeight - 50;
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.fillRect(0,0,c.width,c.height);

	var points_per_frame;

	var i = 0;
	var anim_interval;
	var trail = 0;
	var animate, stopAnimate;

	function reset(){
		pointGen = odeGenerate(params);

		params.zoom = Math.min(c.width, c.height) / (4 * params.L);
		points_per_frame = params.anim_speed * ((1/params.step) / params.fps);
		animate = function(){
			$("#play")
				.attr('value', 'stop')
				.unbind('click')
				.click(stopAnimate);

			var acc = 0;
			anim_interval = setInterval(function(ee){
				trail++;
				if(trail >= params.trails){
					ctx.fillStyle = params.trails == 0 ?
						"rgba(0,0,0,1)":
						"rgba(0,0,0,.01)";

					ctx.fillRect(0,0, c.width, c.height);
					trail = 0;
				}

				acc += points_per_frame;

				var points_per_this_frame = Math.floor(acc);

				for(var j = 0; j < points_per_this_frame; j++){
					params.initial = pointGen();
					var point = getPos(params.L*params.zoom, params.initial);
					drawPoint(point, params);
				}
				acc = acc - points_per_this_frame;

			}, 1000 / params.fps);
			// ms / frame = ms / second * second / frame
		}

		stopAnimate = function(){
			$("#play")
				.attr('value', 'play')
				.unbind('click')
				.click(animate);

			clearInterval(anim_interval);
		}
	}

	function getColor(hex, op){
		return hexToRgba(hex.slice(1), .003 * op);
	}
	function updateParams(){
		stopAnimate();
		console.log("updating colors");

		params.C1 = getColor($("#C1").val(), $("#O1").val());
		params.C2 = getColor($("#C2").val(), $("#O2").val());

		params.anim_speed = parseFloat($("#speed").val()) / 10;
		params.step = parseFloat($("#step").val());

		params.trails = parseInt($("#trails").val(),10);
		reset();
		animate();
	}

	$("#clear").click(function(e){
		ctx.clearRect(0,0,c.width, c.height);
	});
	$("#hideshow").click(function(e){
		$("#controls *").toggle();
		$(this).show().val($(this).val() == "hide" ? "show" : "hide");
		$("#save").show();
	});
	$("#save").click(function(e){
		var savedgco = ctx.globalCompositeOperation;

		ctx.globalCompositeOperation = "destination-over";

		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillRect(0,0,c.width,c.height);

		c.toBlobHD(function(blob) {
		    saveAs(blob, "pendulum.png");
		}, "image/png");

		ctx.globalCompositeOperation = savedgco;
	});

	$("input").on('input change', updateParams);
	reset();
	updateParams();
}

function getPos(l, point){
	var t1 = point[0];
	var t2 = point[1];

	var x1 = (l/2)*Math.sin(t1);
	var y1 = -(l/2)*Math.cos(t1);

	var x2 =  l*(Math.sin(t1) + (1/2)*Math.sin(t2));
	var y2 = -l*(Math.cos(t1) + (1/2)*Math.cos(t2));

	return [[x1, y1, x2,y2], [t1,t2]];
}

function drawPoint(pa, params){
	var p = pa[0];
	var ts = pa[1];

	draw(p[0],p[1],ts[0], params.L * params.zoom , params.C1);
	draw(p[2],p[3],ts[1], params.L * params.zoom , params.C2);
}

function draw(x, y, t, L, color){

	x = x + c.width / 2;
	y = y - c.height/ 3;

	var dy = Math.cos(t)*(L / 2);
	var dx = Math.sin(t)*(L / 2);

	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.lineWidth = 2;
	ctx.moveTo(x-dx, 70 -y-dy);
	ctx.lineTo(x+dx, 70 -y+dy);
	ctx.stroke();
}
