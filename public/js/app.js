

var gameHeight = 800;
var gameWidth = 600;
var game = new Phaser.Game(gameHeight, gameWidth, Phaser.CANVAS, 'inner', { preload: preload, create: create, update: update, render : render });
var cursors;
var logo1;
var logo2;
var sprite;
var player2;
var stuff;

function preload() {

    game.stage.backgroundColor = '#007236';

    game.load.image('bug', 'bug.png');
    //game.load.image('sonic', 'sonic_havok_sanity.png');
    game.load.image('player', 'player.png');

}

function create() {

    //  Modify the world and camera bounds
    game.world.setBounds(-1000, -1000, 2000, 2000);
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.time.advancedTiming = true

    stuff = game.add.group();
    stuff.enableBody = true;

    game.physics.arcade.enable(stuff, Phaser.Physics.ARCADE);

    sprite = game.add.sprite(0, 0, 'player');
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.enableBody = true;
    sprite.body.allowRotation = false;
    sprite.body.collideWorldBounds = true;

    sprite.cameraOffset.setTo(gameHeight/2, gameWidth/2);
    game.camera.follow(sprite);

    player2 = game.add.sprite(0, 0, 'player');
    game.physics.enable(player2, Phaser.Physics.ARCADE);
    player2.enableBody = true;
    player2.body.allowRotation = false;
    player2.body.collideWorldBounds = true;
    
    //player2.body.onCollide = new Phaser.Signal();
    //player2.body.onCollide.add(functionName, this)

    socket.on('world', function(world){
        for (var i = 0; i < 200; i++)
        {
            wall = stuff.create(world[i].x, world[i].y, 'bug');
            wall.enableBody = true;
            wall.body.immovable = true;
            wall.body.bounce.set(.5); //50% rebound velocity
        }
        console.log('world built');
    })

    socket.emit('joinGame','ready player one')
    socket.emit('message','test message');

}

function update() {
    sprite.rotation = game.physics.arcade.moveToPointer(sprite, 60, game.input.activePointer, 500);
    game.physics.arcade.collide(sprite,stuff);
    game.physics.arcade.collide(sprite,player2);
    socket.emit('message',[sprite.x, sprite.y])
}

function render() {
    game.debug.text(game.time.fps, 2, 14, "#00ff00");
    game.debug.cameraInfo(game.camera, 32, 32);

}



////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Game STUFF //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


var socket = io();

socket.on('newPlayer', function(playerName){
	console.log('player connected: ' + playerName);
});

socket.on('message', function(message){
		console.log(message);
        player2.x = message[0];
        player2.y = message[1];
});

socket.on('disconnected', function(notUsed){
	console.log('disconnected');
    // remove player
});

socket.on('loss', function(notUsed){
	alert('You lost! Better luck next time');
	location.reload();
});


