/*global allEnemies, enemyCreationDistance, Phaser, game*/ //comment for eslint
//VARIABLES
var NUMBERENEMIES = .01; //.01 gives us number of objects that compose shape.  more for smoother shape
var MAXENEMIES = 127; //lets just assume there will be max of 128 enemy groups on screen.  This assumption is dangerous and will probably need to be updated
var currentEnemyGroup = 0;
var oldestEnemy = 0;
var SPEED = 5; //lower the faster
var enemyTimer;


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
        var y = Math.sin(rad)*enemyCreationDistance;
        var x = Math.cos(rad)*enemyCreationDistance;
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