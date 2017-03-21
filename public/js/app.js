
// global constants
var FFTSIZE = 32;      // number of samples for the analyser node FFT, min 32
var TICK_FREQ = 20;     // how often to run the tick function, in milliseconds
var CIRCLES = 8;        // the number of circles to draw.  This is also the amount to break the files into, so FFTSIZE/2 needs to divide by this evenly
var RADIUS_FACTOR = 40; // the radius of the circles, factored for which ring we are drawing
var MIN_RADIUS = 1;     // the minimum radius of each circle
var HUE_VARIANCE = 120;  // amount hue can vary by
var COLOR_CHANGE_THRESHOLD = 15;    // amount of change before we change color
var WAVE_EMIT_THRESHOLD = 15;   // amount of positive change before we emit a wave
var WAVE_SCALE = 0.03;  // amount to scale wave per tick
var WAVE_RADIUS = 180; // the radius the wave images will be drawn with

// global variables
var stage;              // the stage we draw everything to
var w, h;               // store the width and height of the canvas
var centerX, centerY;   // variables to hold the center point, so that tick is quicker
var messageField;       // Message display field
var src = "test.mp3";  // set up our source
var soundInstance;      // the sound instance we create
var analyserNode;       // the analyser node that allows us to visualize the audio
var freqFloatData, freqByteData, timeByteData;  // arrays to retrieve data from analyserNode
var circles = {};       // object has of circles shapes
var circleHue = 300;   // the base color hue used when drawing circles, which can change
var circleFreqChunk;    // The chunk of freqByteData array that is computed per circle
var dataAverage = [42, 42, 42, 42];   // an array recording data for the last 4 ticks
var waveImgs = []; // array of wave images with different stroke thicknesses
var waveHit = false;

function init() {
	// Web Audio only demo, so we register just the WebAudioPlugin and if that fails, display fail message
	if (!createjs.Sound.registerPlugins([createjs.WebAudioPlugin])) {
		document.getElementById("error").style.display = "block";
		return;
	}

	createjs.Sound.on("fileload", handleLoad, this); // add an event listener for when load is completed
	createjs.Sound.registerSound(src);  // register sound, which will preload automatically
}
init();

function handleLoad(evt) {
	// get the context. NOTE to connect to existing nodes we need to work in the same context.
	var context = createjs.Sound.activePlugin.context;

	// create an analyser node
	analyserNode = context.createAnalyser();
	analyserNode.fftSize = FFTSIZE;  //The size of the FFT used for frequency-domain analysis. This must be a power of two
	analyserNode.smoothingTimeConstant = 0.85;  //A value from 0 -> 1 where 0 represents no time averaging with the last analysis frame
	analyserNode.connect(context.destination);  // connect to the context.destination, which outputs the audio

	// attach visualizer node to our existing dynamicsCompressorNode, which was connected to context.destination
	var dynamicsNode = createjs.Sound.activePlugin.dynamicsCompressorNode;
	dynamicsNode.disconnect();  // disconnect from destination
	dynamicsNode.connect(analyserNode);

	// set up the arrays that we use to retrieve the analyserNode data
	freqFloatData = new Float32Array(analyserNode.frequencyBinCount);
	freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
	timeByteData = new Uint8Array(analyserNode.frequencyBinCount);

	// calculate the number of array elements that represent each circle
	circleFreqChunk = analyserNode.frequencyBinCount / CIRCLES;
    startPlayback();
}

// this will start our playback in response to a user click, allowing this demo to work on mobile devices
function startPlayback() {

	if (soundInstance) {
		return;
	} // if this is defined, we've already started playing.  This is very unlikely to happen.

	// start playing the sound we just loaded, looping indefinitely
	soundInstance = createjs.Sound.play(src, {loop: -1});

	// testing function that allows a quick stop
	/*stage.addEventListener("stagemousedown", function(){
	 createjs.Ticker.removeEventListener("tick", tick);
	 createjs.Sound.stop();
	 });*/


	// start the tick and point it at the window so we can do some work before updating the stage:
	createjs.Ticker.addEventListener("tick", tick);
	createjs.Ticker.setInterval(TICK_FREQ);
}

var beatPlaying = false;

function tick(evt) {
	analyserNode.getFloatFrequencyData(freqFloatData);  // this gives us the dBs
	analyserNode.getByteFrequencyData(freqByteData);  // this gives us the frequency
	analyserNode.getByteTimeDomainData(timeByteData);  // this gives us the waveform

	var lastRadius = 0;  // we use this to store the radius of the last circle, making them relative to each other
	// run through our array from last to first, 0 will evaluate to false (quicker)
	for (var i = 0; i < CIRCLES; i++) {
		var freqSum = 0;
		var timeSum = 0;
		for (var x = circleFreqChunk; x; x--) {
			var index = (CIRCLES - i) * circleFreqChunk - x;
			freqSum += freqByteData[index];
			timeSum += timeByteData[index];
		}
		freqSum = freqSum / circleFreqChunk / 256;  // gives us a percentage out of the total possible value
		timeSum = timeSum / circleFreqChunk / 256;  // gives us a percentage out of the total possible value
		// NOTE in testing it was determined that i 1 thru 4 stay 0's most of the time

		// draw circle
		lastRadius += freqSum * RADIUS_FACTOR + MIN_RADIUS;
	}

	// update our dataAverage, by removing the first element and pushing in the new last element
	dataAverage.shift();
	dataAverage.push(lastRadius);

	// get our average data for the last 3 ticks
	var dataSum = 0;
	for (var i = dataAverage.length - 1; i; i--) {
		dataSum += dataAverage[i - 1];
	}
	dataSum = dataSum / (dataAverage.length - 1);

	// calculate latest change
	var dataDiff = dataAverage[dataAverage.length - 1] - dataSum;

	// change color based on large enough changes
	if (dataDiff > COLOR_CHANGE_THRESHOLD) {
		circleHue = circleHue + dataDiff;
	}
    console.log(circleHue);
    enemy.tint = circleHue;

	// emit a wave for large enough changes
	if (dataDiff > WAVE_EMIT_THRESHOLD) {

        if(enemyTween.isRunning) return;
        enemyTween.start();
        setTimeout(function(){
            enemyTweenSmall.start();
        },100);

        console.log('wave' + dataDiff * .1 + 1);
	}
    //game.add.tween(sprite.scale).to({x: 2, y: 2});
    //game.stage.backgroundColor = circleHue;
}




//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////





var game = new Phaser.Game(800, 700, Phaser.CANVAS, 'inner', { preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.image('bug', 'whiteBug.png');
    game.load.image('arrow', 'arrow.png');
    game.load.image('record', 'record.png');
}

var sprite;
var enemyTween;
var enemyTweenSmall;
var enemy;
var LEN = 350;

function create() {



    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.time.advancedTiming = true

    

    game.stage.backgroundColor = '#FFFFFF';//'#0072bc'; blue

    sprite = game.add.sprite(400, 300, 'arrow');
    sprite.anchor.setTo(0,.5);
    sprite.scale.setTo(.3);
    sprite.enableBody = false;

    rot = .25*Math.PI;
    y = Math.sin(rot)*LEN;
    x = Math.cos(rot)*LEN;
    enemy = game.add.sprite(400+x,300+y, 'bug');
    enemy.enableBody = true;

    game.physics.enable(enemy, Phaser.Physics.ARCADE);
    game.physics.enable(sprite, Phaser.Physics.ARCADE);

    enemy.body.velocity.setTo(-x/10,-y/10);
    enemy.scale.setTo(1.5);
    //  We'll set a lower max angular velocity here to keep it from going totally nuts
    sprite.body.maxAngular = 400;
    sprite.body.maxVelocity = 400;
    //  Apply a drag otherwise the sprite will just spin and never slow down
    sprite.body.angularDrag = 900;

    record = game.add.sprite(395,290, 'record');
    record.anchor.setTo(.5);
    game.physics.enable(record, Phaser.Physics.ARCADE);
    record.body.angularVelocity = 100;

    enemyTween = game.add.tween(enemy.scale).to({x: 2, y: 2});
    enemyTweenSmall = game.add.tween(enemy.scale).to({x: 1.5, y: 1.5});
    enemyTween.timeScale = 2;
    enemyTweenSmall.timeScale = 2;

}


function update() {
    //if(Phaser.Math.distance(enemy.x,enemy.y,400,300) < 250) console.log('hi');
    if(Phaser.Math.distance(enemy.x,enemy.y,400,300) < 250
        && Phaser.Math.distance(enemy.x,enemy.y,400,300) > 200 && sprite.rotation > rot-.05 && sprite.rotation < rot+.05){ //pointing down
        game.stage.backgroundColor = '#FFA07A';
    } 
    //  Reset the acceleration
    sprite.body.angularAcceleration = 0;

    //  Apply acceleration if the left/right arrow keys are held down
    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
    {
        //sprite.body.angularAcceleration -= 200;
        sprite.body.angularVelocity -= 50;
        //sprite.rotation += .01;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
    {
        //sprite.body.angularAcceleration += 200;
        sprite.body.angularVelocity += 50;
        //sprite.rotation -= .01;
    }
}

function render() {
    //game.debug.text(game.time.fps, 2, 14, "#00ff00");
    //game.debug.cameraInfo(game.camera, 32, 32);
    //game.debug.bodyInfo(sprite, 32, 32);
    //game.debug.body(sprite);
    //game.debug.spriteInfo(sprite, 32, 32);
    //game.debug.text('angularVelocity: ' + sprite.body.angularVelocity, 32, 200);
    //game.debug.text('angularAcceleration: ' + sprite.body.angularAcceleration, 32, 232);
    //game.debug.text('angularDrag: ' + sprite.body.angularDrag, 32, 264);
    //game.debug.text('deltaZ: ' + sprite.body.deltaZ(), 32, 296);

}

/*

var socket = io();

socket.on('newPlayer', function(playerName){
	console.log('player connected: ' + playerName);
});

messageCounter = 1000;

var startTime;
var ping = .010; //assume 10 ms to start out with

setInterval(function(){
    startTime = Date.now();
    socket.emit('pingCheck', startTime); //ping is a reserved socket.io name
}, 1000) //1 sec

socket.on('pingResponse', function(ping){
    ping = Date.now() - startTime; // time to server and back
});

socket.on('message', function(message){
        // if(!messageCounter--){ // log 1 message every 1k to reduce spam
        //     console.debug(message);
        //     messageCounter = 1000;
        // }
        player2.x = message[0];
        player2.y = message[1];
});

socket.on('disconnected', function(notUsed){
    socket.close();
	console.log('disconnected');
    // remove player
});

socket.on('loss', function(notUsed){
	alert('You lost! Better luck next time');
	location.reload();
});
*/