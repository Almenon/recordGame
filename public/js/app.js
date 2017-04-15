var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, 'inner', { preload, create, update, render });

//VARIABLES
var player;
var enemyTween;
var enemyTweenSmall;
var radius; //distance from center
var NUMBERENEMIES = .01; //.01 gives us number of objects that compose shape.  more for smoother shape
var allEnemies = [];
var MAXENEMIES = 127; //lets just assume there will be max of 128 enemy groups on screen.  This assumption is dangerous and will probably need to be updated
var currentEnemyGroup = 0;
var oldestEnemy = 0;
var SPEED = 5; //lower the faster
var playerAcceleration = 40;
var collisionDistance;
var despawnDistance;
var l33tHax = false; //allows you to survive death
var gameTime; //Phaser.Timer.  use gameTime.seconds to get elapsed game time exlcuding pauses
var enemyTimer;
var enemies;


//////////////////////////////////////////////////////////////
/// COLLISION CODE (called by Phaser update)
//////////////////////////////////////////////////////////////

/**
 * @summary removes oldest enemy group if it has gone into record
 */
function despawnOldestEnemyGroup(){
    if(allEnemies[oldestEnemy].children.length > 0){ //make sure an enemy actually exists first
        var aEnemy = allEnemies[oldestEnemy].children[0]; //get an arbitrary enemy from the oldest surviving group (first to die)
        if(Phaser.Math.distance(aEnemy.x,aEnemy.y,game.world.centerX,game.world.centerY) < despawnDistance){
            allEnemies[oldestEnemy].removeChildren(); //or enemies.forEachAlive(x=>x.kill()).  maybe better for perfeormance?
            if(++oldestEnemy > MAXENEMIES-1) oldestEnemy = 0;
        }
    }
};

/**
 * flashes orange for duration of time ms
 * @param {number} time 
 */
function flashOrange(time=100){
        game.stage.backgroundColor = '#FFA07A';
        setTimeout(() => {game.stage.backgroundColor = '#FFFFFF';},time);
}

/**
 * @summary dims gameWorld by creating a black sprite with alpha transparency
 * @param {number} alpha 
 */
function dim(alpha){
        var dim = game.add.sprite(0,0,'black')
        dim.width = game.world.width; dim.height = game.world.height;
        dim.alpha = alpha;
}

/**
 * @summary Pauses phaser and displays game over text
 */
function endGame(){
    if(l33tHax) flashOrange();
    else{
        var endTime = Math.floor(gameTime.seconds);
        game.paused = true;
        dim(.4);
        var style = { font: "65px Arial", fill: "#ff0044", align: "center" };
        var gameOverText = game.add.text(game.world.centerX, game.world.centerY, "Game Over.  Refresh to Try again.  \nScore: " + endTime, style);
        gameOverText.anchor.setTo(.5);
    }
}

/**
 * @summary ends game if player collides with enemy
 */
function collisionCheck(){

    //sprite.rotation flips to - and decreases when up top.  why? idk....
    var spriteRad = player.rotation < 0 ? 2*Math.PI+player.rotation : player.rotation;

    allEnemies[oldestEnemy].forEach(enemy => { //if there's many groups next to circle taking just oldestEnemy will fail.  But for now it works

        //rotation can be any value, but we want a value between 0 and 2pi radians
        var numRotations = Math.floor(enemy.rad/(2*Math.PI));
        var radians = numRotations*2*Math.PI;
        radians = enemy.rad - radians; //get rid of any excess rotations
        
        if(Phaser.Math.distance(enemy.x,enemy.y,game.world.centerX,game.world.centerY) < collisionDistance 
            && Phaser.Math.distance(enemy.x,enemy.y,game.world.centerX,game.world.centerY) > collisionDistance-20 //it's annoying to run into enemies that already passed pointer, so we ignore them
                && spriteRad > radians-.05 && spriteRad < radians+.05){
            endGame();
        }         
    });
}

//////////////////////////////////////////////////////////////
/// ENEMY SPAWNING CODE
//////////////////////////////////////////////////////////////

/**
 * 
 * @param {number} start - radians. Will be multipled by PI
 */
function spawnEnemies(start=1, end){
    if(end == null) end = start+.5; //end defaults to start+.5 for 45 degree arc

    if(currentEnemyGroup == MAXENEMIES) currentEnemyGroup = 0;
    var currentGroup = allEnemies[currentEnemyGroup++]

    for(var i=start; i<end; i += NUMBERENEMIES){ 
        var rad = i*Math.PI;
        var y = Math.sin(rad)*radius;
        var x = Math.cos(rad)*radius;
        var enemy = currentGroup.create(game.world.centerX+x,game.world.centerY+y, 'bug');
        enemy.body.velocity.setTo(-x/SPEED,-y/SPEED); //return to center
        enemy.anchor.setTo(.5); //center it, otherwise the arc will be lopsided
        enemy.rad = rad;
    }
}

/**
 * 
 * @param {number} start - radians. Will be multipled by PI
 */
function singleEnemy(start = 1){
    spawnEnemies(start, start+NUMBERENEMIES/2); //numberenemies/2 so spawnEnemies will just increment once
}

/**
 * 
 * @param {number} start - radians. Will be multipled by PI
 */
function semiCircle(start = 1){
    spawnEnemies(start,start+.5);
}

/**
 * 
 * @param {number} start - radians. Will be multipled by PI
 */
function halfCircle(start = 1){
    spawnEnemies(start,start+1);
}

/**
 * 
 * @param {number} start - radians. Will be multipled by PI
 */
function almostFullCircle(start = 1){
    spawnEnemies(start,start+1.7);
}

// this method is ugly :/
// calls function inbetween two pauses of duration = wait.
// use for hard enemy groupings
function inbetweenPauses(func, wait){
    enemyTimer.pause();
    setTimeout(() => {
        func();
        setTimeout(() => {
            enemyTimer.resume();
        },wait)
    },wait)
}

//function hardChallenge(){
//    hardChallenges[Math.random()*hardChallenges.length]
//}

function start(){

    //set up timer for scoring upon game end
    gameTime = game.time.create();
    gameTime.start();

    //enemyChallengeTest3();
    setUpEnemySpawning();
}

function setUpEnemySpawning(){
    //setInterval(function(){singleEnemy(Math.random()*2)},50) //bug swarm - you can tell collision checking code is not up to this task.  also sometimes there are blank bugs
    //There are several issues that need to be addressed:
    // 1. sometimes there are impossible scenarios (solution: keep track of degree coverage.  Problem: there could be 100% degree coverage but still escape routes inbetween arcs
    game.time.events.loop(Phaser.Timer.SECOND*10, () => {SPEED = SPEED/1.15}); //slowly increase difficulty by lowering (raising) speed
    enemyTimer = game.time.create();
    enemyTimer.loop(Phaser.Timer.SECOND, () => {semiCircle(Math.random()*2)});
    enemyTimer.loop(Phaser.Timer.SECOND*1.5, () => {
        singleEnemy(Math.random()*2); //2 single enemies because 2 semiCircles causes performance issues
        singleEnemy(Math.random()*2)
    });
    enemyTimer.start();
    //setInterval(function(){halfCircle(Math.random()*2)},2000)
    game.time.events.loop(Phaser.Timer.SECOND*6.3, inbetweenPauses, null, () => {almostFullCircle(Math.random()*2)}, 600);
}

function enemyChallengeTest1(){ //full circles quarter-interval gaps (not that interesting)
    enemyTimer = game.time.create();
    var time = 0; //.1, 1000
    for(var i=0; i<2; i+=.5) enemyTimer.add(time+=1700, almostFullCircle, null, i);
    enemyTimer.start();
}

function enemyChallengeTest2(){ //many full circles with moving gap (fix performance bug before using)
    enemyTimer = game.time.create();
    var time = 0; //.1, 1000
    for(var i=0; i<1; i+=.05) enemyTimer.add(time+=500, almostFullCircle, null, i);
    enemyTimer.start();
}

function enemyChallengeTest3(){ //full circles opposite gaps
    enemyTimer = game.time.create();
    var time = 0; //.1, 1000
    var startRadian = Math.random();
    for(var i=startRadian; i<startRadian+4; i++) enemyTimer.add(time+=1300, almostFullCircle, null, i);
    //todo: spawn time should happen faster at higher speeds
    enemyTimer.start();
}

function enemyChallengeTest4(){ //alternating gaps
    enemyTimer = game.time.create();
    var time = 0; //.1, 1000
    var startRadian = Math.random();
    for(var i=0; i<4; i+=1){
        enemyTimer.add(time+=500, almostFullCircle, null, startRadian + i%2/3);
    }
    enemyTimer.start();
}


//////////////////////////////////////////////////////////////
/// PHASER FUNCS - RPELOAD, CREATE, UPDATE, RENDER
//////////////////////////////////////////////////////////////


function preload() {
    musicEnabled ? game.load.image('bug', 'images/whiteBug.png') : game.load.image('bug', 'images/bug.png');;
    game.load.image('arrow', 'images/whiteArrow.png');
    game.load.image('record', 'images/record2cropped.png');
    game.load.image('dot', 'images/dot.png');
    game.load.image('black','images/black.png'); //this is stupid.  fix later
}

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.time.advancedTiming = true //for debug
    game.stage.backgroundColor = '#FFFFFF';//'#0072bc'; blue
    //setting size to body width to avoid scrollbar appearing
    game.scale.setGameSize($('body').width(), window.innerHeight);
    radius = Math.max(this.game.width, this.game.height)/2 + 20; //20 is arbitrary number so enemies are generated outside screen
    game.onPause.add(() => {
        if(musicEnabled) soundInstance.paused = true;
    })
    game.onResume.add(() => {
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
    player.scale.setTo(.28);
    player.enableBody = false;

    game.physics.enable(player, Phaser.Physics.ARCADE);
    //  We'll set a lower max angular velocity here to keep it from going totally nuts
    //  this property isn't 100% accurate - in testing max is maxAngular + playerAcceleration
    player.body.maxAngular = 400; 
    //  Apply a drag otherwise the sprite will just spin and never slow down
    player.body.angularDrag = 900;

    //RECORD (just for visuals)
    var record = game.add.sprite(game.world.centerX, game.world.centerY, 'record');
    record.anchor.setTo(.5);
    record.scale.setTo(.6);
    game.physics.enable(record, Phaser.Physics.ARCADE);
    record.body.angularVelocity = 100;
    despawnDistance = record.height/2;
    var arrowWidth = player.width - record.width/2;
    collisionDistance = despawnDistance + game.cache.getImage("bug").width/2 + arrowWidth;

    //TWEENS: (doesn't work atm)
    //enemyTweenCenter = game.add.tween(enemies.position).to({x: -enemies.width, y: -enemies.height});
    // enemyTween = game.add.tween(enemies.scale).to({x: 2, y: 2});
    // enemyTweenSmall = game.add.tween(enemies.scale).to({x: 1.1, y: 1.1});
    // enemyTween.timeScale = 2;
    // enemyTweenSmall.timeScale = 2;
    // enemyTween.onComplete.add(() => {enemyTweenSmall.start();});

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
    playerMovement2();

}

function render() {
    //game.debug.text(game.time.fps, 2, 14, "#00ff00"); //the FPS is not good on slow devices ~ 30-60.  Maybe lock it to 30 on slow devices for consistent fps?
    //game.debug.text(Math.floor(gameTime.seconds),2,14);
    //game.debug.cameraInfo(game.camera, 32, 32);
    //game.debug.bodyInfo(player, 32, 32);
    //game.debug.body(record);
    //game.debug.spriteInfo(player, 32, 32);
    //game.debug.text('angularVelocity: ' + player.body.angularVelocity, 32, 200);
    //game.debug.text('angularAcceleration: ' + player.body.angularAcceleration, 32, 232);
    //game.debug.text('angularDrag: ' + player.body.angularDrag, 32, 264);
    //game.debug.text('deltaZ: ' + player.body.deltaZ(), 32, 296);

}

/**
 * @summary movement with acceleration up to 450.
 */
function playerMovement1(){
    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) player.body.angularVelocity -= playerAcceleration;
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) player.body.angularVelocity += playerAcceleration;
}

/**
 * @summary movement with static velocity.  You feel more in control than with acceleration but movement is less smooth and player is incapable of small movements
 */
function playerMovement2(){
    //  Apply acceleration if the left/right arrow keys are held down
    if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) player.body.angularVelocity =  -300;
    else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) player.body.angularVelocity =  300;
    else player.body.angularVelocity = 0;
}

//todo: make fullscreen button
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