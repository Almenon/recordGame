var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'inner', { preload: preload, create: create, update: update, render: render });

var player;
var enemyTween;
var enemyTweenSmall;
var enemy;
var radius; //distance from center
var NUMBERENEMIES = .01; //.01 gives us number of objects that compose shape.  more for smoother shape
var allEnemies = [];
var MAXENEMIES = 127; //lets just assume there will be max of 128 enemy groups on screen.  This assumption is dangerous and will probably need to be updated
var currentEnemyGroup = 0;
var oldestEnemy = 0;
var SPEED = 5; //lower the faster
var collisionDistance;
var despawnDistance;
var l33tHax = false; //allows you to survive death
var gameTime; //Phaser.Timer.  use gameTime.seconds to get elapsed game time exlcuding pauses
var enemyTimer;

//////////////////////////////////////////////////////////////
/// ENEMY SPAWNING CODE
//////////////////////////////////////////////////////////////

// start: radians.  default is 1 (left center)
spawnEnemies = function(start, end){
    var start = start ? start : 1 //default 1
    var end = end ? end : end+.5 //default start+.1 for 45 degree arc

    if(currentEnemyGroup == MAXENEMIES) currentEnemyGroup = 0;
    var currentGroup = allEnemies[currentEnemyGroup++]

    for(i=start;i<end; i += NUMBERENEMIES){ 
        rad = i*Math.PI;
        y = Math.sin(rad)*radius;
        x = Math.cos(rad)*radius;
        var enemy = currentGroup.create(game.world.centerX+x,game.world.centerY+y, 'bug');
        enemy.body.velocity.setTo(-x/SPEED,-y/SPEED); //return to center
        enemy.anchor.setTo(.5); //center it, otherwise the arc will be lopsided
        enemy.rad = rad;
    }
}

// start: radians.  default is 1 (left center)
singleEnemy = function(start){
    var start = start ? start : 1 //default 1
    spawnEnemies(start,start+NUMBERENEMIES/2); //numberenemies/2 so spawnEnemies will just increment once
}

// start: radians.  default is 1 (left center)
semiCircle = function(start){
    var start = start ? start : 1 //default 1
    spawnEnemies(start,start+.5);
}

// start: radians.  default is 1 (left center)
halfCircle = function(start){
    var start = start ? start : 1 //default 1
    spawnEnemies(start,start+1);
}

// start: radians.  default is 1 (left center)
almostFullCircle = function(start){
    var start = start ? start : 1 //default 1
    spawnEnemies(start,start+1.7);
}

// this method is ugly :/
// calls function inbetween two pauses of duration = wait.
// use for hard enemy groupings
function inbetweenPauses(func, wait){
    testTimer.pause();
    setTimeout(function(){
        func();
        setTimeout(function(){
            testTimer.resume();
        },wait)
    },wait)
}

//function hardChallenge(){
//    hardChallenges[Math.random()*hardChallenges.length]
//
//}

function start(){
    //setInterval(function(){singleEnemy(Math.random()*2)},50) //bug swarm - you can tell colission checking code is not up to this task.  also sometimes there are blank bugs
    //There are several issues that need to be addressed:
    // 1. sometimes there are impossible scenarios (solution: keep track of degree coverage.  Problem: there could be 100% degree coverage but still escape routes inbetween arcs
    game.time.events.loop(Phaser.Timer.SECOND*10, function(){SPEED = SPEED/1.15}); //slowly increase difficulty by lowering (raising) speed
    testTimer = game.time.create();
    testTimer.loop(Phaser.Timer.SECOND, function(){semiCircle(Math.random()*2)});
    testTimer.loop(Phaser.Timer.SECOND*1.5, function(){
        singleEnemy(Math.random()*2); //2 single enemies because 2 semiCircles causes performance issues
        singleEnemy(Math.random()*2)
    });
    testTimer.start();
    //setInterval(function(){halfCircle(Math.random()*2)},2000)
    game.time.events.loop(Phaser.Timer.SECOND*6.3, inbetweenPauses, null, function(){almostFullCircle(Math.random()*2)}, 600);

    gameTime = game.time.create();
    gameTime.start();
}


//////////////////////////////////////////////////////////////
/// COLLISION CODE (called by Phaser update)
//////////////////////////////////////////////////////////////


var despawnOldestEnemyGroup = function(){
    if(allEnemies[oldestEnemy].children.length > 0){ //make sure an enemy actually exists first
        var aEnemy = allEnemies[oldestEnemy].children[0]; //get an arbitrary enemy from the oldest surviving group (first to die)
        if(Phaser.Math.distance(aEnemy.x,aEnemy.y,game.world.centerX,game.world.centerY) < despawnDistance){
            allEnemies[oldestEnemy].removeChildren(); //or enemies.forEachAlive(x=>x.kill()).  maybe better for perfeormance?
            if(++oldestEnemy > MAXENEMIES-1) oldestEnemy = 0;
        }
    }
}

function flashOrange(){
        game.stage.backgroundColor = '#FFA07A';
        setTimeout(function(){game.stage.backgroundColor = '#FFFFFF';},100);
}

function dim(alpha){
        var dim = game.add.sprite(0,0,'black')
        dim.width = game.world.width; dim.height = game.world.height;
        dim.alpha = alpha;
}

function endGame(){
    if(l33tHax) flashOrange();
    else{
        var endTime = Math.floor(gameTime.seconds);
        game.paused = true;
        dim(.4);
        var style = { font: "65px Arial", fill: "#ff0044", align: "center" };
        gameOverText = game.add.text(game.world.centerX, game.world.centerY, "Game Over.  Refresh to Try again.  \nScore: " + endTime, style);
        gameOverText.anchor.setTo(.5);
    }
}

var collisionCheck = function(){

    //sprite.rotation flips to - and decreases when up top.  why? idk....
    var spriteRad = player.rotation < 0 ? 2*Math.PI+player.rotation : player.rotation;

    allEnemies[oldestEnemy].forEach(function(enemy){ //if there's many groups next to circle taking just oldestEnemy will fail.  But for now it works

        //rotation can be any value, but we want a value between 0 and 2pi radians
        var numRotations = Math.floor(enemy.rad/(2*Math.PI));
        var radians = numRotations*2*Math.PI;
        radians = enemy.rad - radians; //get rid of any excess rotations
        
        if(Phaser.Math.distance(enemy.x,enemy.y,game.world.centerX,game.world.centerY) < collisionDistance 
            && Phaser.Math.distance(enemy.x,enemy.y,game.world.centerX,game.world.centerY) > collisionDistance-55 //it's annoying to run into enemies that already passed pointer, so we ignore them
                && spriteRad > radians-.05 && spriteRad < radians+.05){
            endGame();
        }         
    });
}


//////////////////////////////////////////////////////////////
/// PHASER FUNCS - RPELOAD, CREATE, UPDATE, RENDER
//////////////////////////////////////////////////////////////


function preload() {
    musicEnabled ? game.load.image('bug', 'whiteBug.png') : game.load.image('bug', 'bug.png');;
    game.load.image('arrow', 'arrow.png');
    game.load.image('record', 'record2cropped.png');
    game.load.image('dot', 'dot.png');
    game.load.image('black','black.png'); //this is stupid.  fix later
}

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.time.advancedTiming = true //for debug
    game.stage.backgroundColor = '#FFFFFF';//'#0072bc'; blue
    //setting size to body width to avoid scrollbar appearing
    game.scale.setGameSize($('body').width(), window.innerHeight);
    radius = Math.max(this.game.width, this.game.height)/2 + 20; //20 is arbitrary number so enemies are generated outside screen
    game.onPause.add(function(){
        if(musicEnabled) soundInstance.paused = true;
    })
    game.onResume.add(function(){
        if(musicEnabled) soundInstance.paused = false;
    })

    for(i=0;i<MAXENEMIES;i++){
        enemies = game.add.group();
        enemies.enableBody = true;
        game.physics.enable(enemies, Phaser.Physics.ARCADE);
        allEnemies.push(enemies);
    }
    
    
    //PLAYER SPRITE (spinning arrow)
    player = game.add.sprite(game.world.centerX, game.world.centerY, 'arrow');
    player.anchor.setTo(0,.5);
    player.scale.setTo(.33);
    player.enableBody = false;

    game.physics.enable(player, Phaser.Physics.ARCADE);
    //  We'll set a lower max angular velocity here to keep it from going totally nuts
    player.body.maxAngular = 400;
    player.body.maxVelocity = 400;
    //  Apply a drag otherwise the sprite will just spin and never slow down
    player.body.angularDrag = 900;

    //RECORD (just for visuals)
    record = game.add.sprite(game.world.centerX, game.world.centerY, 'record');
    record.anchor.setTo(.5);
    record.scale.setTo(.7);
    game.physics.enable(record, Phaser.Physics.ARCADE);
    record.body.angularVelocity = 100;
    despawnDistance = record.height/2;
    collisionDistance = despawnDistance + game.cache.getImage("bug").width/2 + 46; //46 being arrow width

    //TWEENS: (doesn't work atm)
    //enemyTweenCenter = game.add.tween(enemies.position).to({x: -enemies.width, y: -enemies.height});
    enemyTween = game.add.tween(enemies.scale).to({x: 2, y: 2});
    enemyTweenSmall = game.add.tween(enemies.scale).to({x: 1.1, y: 1.1});
    enemyTween.timeScale = 2;
    enemyTweenSmall.timeScale = 2;
    enemyTween.onComplete.add(function(){enemyTweenSmall.start();});

    //DEBUG DOTS
    //game.add.sprite(game.world.centerX, game.world.centerY, 'dot'); //center
    //game.add.sprite(game.world.centerX+radius, game.world.centerY, 'dot'); //record edge
    //game.add.sprite(game.world.centerX+collisionDistance, game.world.centerY, 'dot'); //collission distance
    //game.add.sprite(game.world.centerX-collisionDistance, game.world.centerY, 'dot');
    //game.add.sprite(game.world.centerX-despawnDistance, game.world.centerY, 'dot'); //depsawn distance
    //game.add.sprite(game.world.centerX+despawnDistance, game.world.centerY, 'dot');

    start();
}

function update() { //fps is 60, so should complete within 16 ms

    despawnOldestEnemyGroup();
    collisionCheck();

    //  Reset the acceleration
    player.body.angularAcceleration = 0;

    //  Apply acceleration if the left/right arrow keys are held down
    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
    {
        //sprite.body.angularAcceleration -= 200;
        player.body.angularVelocity -= 50;
        //sprite.rotation += .01;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
    {
        //sprite.body.angularAcceleration += 200;
        player.body.angularVelocity += 50;
        //sprite.rotation -= .01;
    }
}

function render() {
    //game.debug.text(game.time.fps, 2, 14, "#00ff00"); //the FPS is not good on slow devices ~ 30-60.  Maybe lock it to 30 on slow devices for consistent fps?
    //game.debug.text(Math.floor(gameTime.seconds),2,14);
    //game.debug.cameraInfo(game.camera, 32, 32);
    //game.debug.bodyInfo(sprite, 32, 32);
    //game.debug.body(record);
    //game.debug.spriteInfo(sprite, 32, 32);
    //game.debug.text('angularVelocity: ' + sprite.body.angularVelocity, 32, 200);
    //game.debug.text('angularAcceleration: ' + sprite.body.angularAcceleration, 32, 232);
    //game.debug.text('angularDrag: ' + sprite.body.angularDrag, 32, 264);
    //game.debug.text('deltaZ: ' + sprite.body.deltaZ(), 32, 296);

}


function fullScreenSwitch() {
    if (game.scale.isFullScreen)
    {
        game.scale.stopFullScreen();
    }
    else
    {
        game.scale.startFullScreen(false);
    }
}


//////////////////////////////////////////////////////////////
/// SOCKET LOGIC FOR MULTIPLAYER
//////////////////////////////////////////////////////////////

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