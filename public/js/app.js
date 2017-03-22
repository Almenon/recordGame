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

singleEnemy = function(){
    rot = .25*Math.PI;
    y = Math.sin(rot)*LEN;
    x = Math.cos(rot)*LEN;
    enemy = game.add.sprite(400+x,300+y, 'bug');
    enemy.enableBody = true;    
}

function create() {



    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.time.advancedTiming = true

    

    game.stage.backgroundColor = '#FFFFFF';//'#0072bc'; blue

    sprite = game.add.sprite(game.world.centerX, game.world.centerY, 'arrow');
    sprite.anchor.setTo(0,.5);
    sprite.scale.setTo(.3);
    sprite.enableBody = false;

    enemies = game.add.group();
    enemies.enableBody = true;

    numEnemies = 2;
    for(i=1;i<numEnemies; i += .01){
        rad = i*Math.PI;
        y = Math.sin(rad)*LEN;
        x = Math.cos(rad)*LEN;
        var enemy = enemies.create(game.world.centerX+x,game.world.centerY+y, 'bug');
        enemy.body.velocity.setTo(-x/10,-y/10);
        enemy.anchor.set(.5);
        enemy.rad = rad;
    }

    game.physics.enable(enemies, Phaser.Physics.ARCADE);
    game.physics.enable(sprite, Phaser.Physics.ARCADE);

    //  We'll set a lower max angular velocity here to keep it from going totally nuts
    sprite.body.maxAngular = 400;
    sprite.body.maxVelocity = 400;
    //  Apply a drag otherwise the sprite will just spin and never slow down
    sprite.body.angularDrag = 900;

    record = game.add.sprite(game.world.centerX, game.world.centerY, 'record');
    record.anchor.setTo(.5);
    game.physics.enable(record, Phaser.Physics.ARCADE);
    record.body.angularVelocity = 100;

    //Tweens: (doesn't work atm)
    //enemyTweenCenter = game.add.tween(enemies.position).to({x: -enemies.width, y: -enemies.height});
    enemyTween = game.add.tween(enemies.scale).to({x: 2, y: 2});
    enemyTweenSmall = game.add.tween(enemies.scale).to({x: 1.1, y: 1.1});
    enemyTween.timeScale = 2;
    enemyTweenSmall.timeScale = 2;
    enemyTween.onComplete.add(function(){enemyTweenSmall.start();});

}


function update() {

    //sprite.rotation flips to - and decreases when up top.  why? idk....
    var spriteRad = sprite.rotation < 0 ? 2*Math.PI+sprite.rotation : sprite.rotation;
    console.log(spriteRad);

    enemies.forEach(function(enemy){

        //rotation can be any value, but we want a value between 0 and 2pi radians
        var numRotations = Math.floor(enemy.rad/(2*Math.PI));
        var radians = numRotations*2*Math.PI;
        radians = enemy.rad - radians; //get rid of any excess rotations
        
        if(Phaser.Math.distance(enemy.x,enemy.y,game.world.centerX,game.world.centerY) < 280 && Phaser.Math.distance(enemy.x,enemy.y,game.world.centerX,game.world.centerY) > 200 
                && spriteRad > radians-.05 && spriteRad < radians+.05){
            game.stage.backgroundColor = '#FFA07A';
        }         
    });

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