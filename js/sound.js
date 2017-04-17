
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

musicEnabled = true; //disables sound and sound effects for testing purposes
backgroundColoringEnabled = true;
enemyColoringEnabled = true; //disable this for performance improvement

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
	startEnemySpawning(); //start game at same time as sound
	if(musicLoadingMessage != undefined) musicLoadingMessage.destroy();
	if(!musicEnabled) return;

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

	coloring(circleHue); //ex: 0xFFFFFF

	// emit a wave for large enough changes
	if (dataDiff > WAVE_EMIT_THRESHOLD) {
        //doesn't work atm
        //if(enemyTween.isRunning || enemyTweenSmall.isRunning) return;
        //enemyTween.start();
        //setTimeout(function(){
        //    enemyTweenSmall.start();
        //},100); //i should be able to call phaser yoyo() instead of doing this, not sure why it wasnt working

        //console.log('wave' + dataDiff * .1 + 1);
	}
    //game.add.tween(sprite.scale).to({x: 2, y: 2});
    //game.stage.backgroundColor = circleHue;
}

/**
 * @summary colors background/player/enemies according to hue
 * @param {number} hue 
 */
function coloring(hue){
	if(backgroundColoringEnabled){
		game.stage.setBackgroundColor(hue);
		//invert color of player&enemies to be easily visible against background
		hue = 0xFFFFFF-hue; //use 0x55FA2A for a light blue/green color profile, or 0xFFFFFF for yellow/blue
		player.tint = hue;
	}
	if(enemyColoringEnabled) colorEnemies(hue);
}

/**
 * @summary colors all enemies.  Has performance impact for slow computers
 * @param {number} hue 
 */
function colorEnemies(hue){
	if(currentEnemyGroup < oldestEnemy){
		//in this case, alive enemies wrap around the allEnemies array
		for(i=oldestEnemy; i<MAXENEMIES-1;i++){
			allEnemies[i].setAll('tint', hue);
		}
		for(i=0; i<=currentEnemyGroup;i++){
			allEnemies[i].setAll('tint', hue);
		}
	}
	else{
		for(i=oldestEnemy; i<currentEnemyGroup;i++){
			allEnemies[i].setAll('tint', hue);
		}
	}
}