var game = new Phaser.Game(800, 700, Phaser.CANVAS, 'inner', { preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.image('bug', 'whiteBug.png');
    game.load.image('arrow', 'arrow.png');
    game.load.image('record', 'record.png');
}

var player;
var enemyTween;
var enemyTweenSmall;
var enemy;
var LEN = 350;
var NUMBERENEMIES = .01; //.01 gives us number of objects that compose shape.  more for smoother shape

// start: radians.  default is 1 (left center)
spawnEnemies = function(start, end){
    var start = start ? start : 1 //default 1
    var end = end ? end : end+.5 //default start+.1 for 45 degree arc

    if(currentEnemyGroup == MAXENEMIES-1) currentEnemyGroup = 0;
    var currentGroup = allEnemies[currentEnemyGroup++]

    for(i=start;i<end; i += NUMBERENEMIES){ 
        rad = i*Math.PI;
        y = Math.sin(rad)*LEN;
        x = Math.cos(rad)*LEN;
        var enemy = currentGroup.create(game.world.centerX+x,game.world.centerY+y, 'bug');
        enemy.body.velocity.setTo(-x/10,-y/10);
        //enemy.anchor.set(.5); doesn't work
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
    spawnEnemies(start,start+1.9);
}

var allEnemies = [];
var MAXENEMIES = 127; //lets just assume there will be max of 128 enemy groups on screen.  This assumption is dangerous and will probably need to be updated
var currentEnemyGroup = 0;
var oldestEnemy = 0;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.time.advancedTiming = true //for debug
    game.stage.backgroundColor = '#FFFFFF';//'#0072bc'; blue

    
    for(i=0;i<MAXENEMIES;i++){
        enemies = game.add.group();
        enemies.enableBody = true;
        game.physics.enable(enemies, Phaser.Physics.ARCADE);
        allEnemies.push(enemies);
    }

    halfCircle();
    
    //PLAYER SPRITE (spinning arrow)
    player = game.add.sprite(game.world.centerX, game.world.centerY, 'arrow');
    player.anchor.setTo(0,.5);
    player.scale.setTo(.3);
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
    game.physics.enable(record, Phaser.Physics.ARCADE);
    record.body.angularVelocity = 100;

    //TWEENS: (doesn't work atm)
    //enemyTweenCenter = game.add.tween(enemies.position).to({x: -enemies.width, y: -enemies.height});
    enemyTween = game.add.tween(enemies.scale).to({x: 2, y: 2});
    enemyTweenSmall = game.add.tween(enemies.scale).to({x: 1.1, y: 1.1});
    enemyTween.timeScale = 2;
    enemyTweenSmall.timeScale = 2;
    enemyTween.onComplete.add(function(){enemyTweenSmall.start();});

}


function update() {

    if(allEnemies[oldestEnemy].children.length > 0){ //make sure an enemy actually exists first
        var aEnemy = allEnemies[oldestEnemy].children[0]; //get an arbitrary enemy from the oldest surviving group (first to die)
        if(Phaser.Math.distance(aEnemy.x,aEnemy.y,game.world.centerX,game.world.centerY) < 210){
            allEnemies[oldestEnemy].removeChildren(); //or enemies.forEachAlive(x=>x.kill()).  maybe better for perfeormance?
            if(++oldestEnemy > MAXENEMIES-1) oldestEnemy = 0;
        }
    }

    //sprite.rotation flips to - and decreases when up top.  why? idk....
    var spriteRad = player.rotation < 0 ? 2*Math.PI+player.rotation : player.rotation;
    //console.log(spriteRad);

    allEnemies[oldestEnemy].forEach(function(enemy){ //if there's many groups next to circle taking just oldestEnemy will fail.  But for now it works

        //rotation can be any value, but we want a value between 0 and 2pi radians
        var numRotations = Math.floor(enemy.rad/(2*Math.PI));
        var radians = numRotations*2*Math.PI;
        radians = enemy.rad - radians; //get rid of any excess rotations
        
        if(Phaser.Math.distance(enemy.x,enemy.y,game.world.centerX,game.world.centerY) < 280
                && spriteRad > radians-.05 && spriteRad < radians+.05){
            game.stage.backgroundColor = '#FFA07A';
        }         
    });

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