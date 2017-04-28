//////////////////////////////////////////////////////////////
/// PHASER FUNCS - PRELOAD, CREATE, UPDATE, RENDER
/// see enemyCode.js for enemyCreation and collision checking
//////////////////////////////////////////////////////////////
var game = new Phaser.Game({
    width: window.innerWidth,
    height: window.innerHeight,
    renderer: Phaser.CANVAS,
    parent: "inner",
    state: {preload, create, update, render}
});
var enemyCreationDistance; //distance from center
var enemies;
var collisionDistance;
var allEnemies = [];
var despawnDistance;
var playerAcceleration = 40;
var gameTime; //Phaser.Timer.  use gameTime.seconds to get elapsed game time excluding pauses
//unused vars
var enemyTween;
var enemyTweenSmall;
var fontStyle = { font: "65px Arial", fill: "#ff0044", align: "center" }
var musicLoadingMessage;
var player;

function preload() {
    musicEnabled ? game.load.image('bug', 'images/whiteBug.png') : game.load.image('bug', 'images/bug.png');
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
    enemyCreationDistance = Math.max(this.game.width, this.game.height)/2 + 20; //enemies should be generated offscreen
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
    player.tint = 0x55FA2A; //green

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

    if(soundInstance == undefined){
        musicLoadingMessage = game.add.text(game.world.centerX, game.world.centerY, "Loading Music...", fontStyle)
        musicLoadingMessage.anchor.setTo(.5);
    }
}

function update() { //fps is 60, so should complete within 16 ms

    despawnOldestEnemyGroup();
    collisionCheck();
    playerMovement3();

    setAllEnemies((enemy)=>{
        enemy.x-=(.1+.1*enemy.rad)*Math.cos(enemy.rad);
        enemy.y-=(.1+.1*enemy.rad)*Math.sin(enemy.rad);
    })

}

function setAllEnemies(func){
	if(currentEnemyGroup < oldestEnemy){
		//in this case, alive enemies wrap around the allEnemies array
		for(i=oldestEnemy; i<MAXENEMIES-1;i++){
			allEnemies[i].forEach(func)
		}
		for(i=0; i<=currentEnemyGroup;i++){
			allEnemies[i].forEach(func)
		}
	}
	else{
		for(i=oldestEnemy; i<currentEnemyGroup;i++){
			allEnemies[i].forEach(func)
		}
	}
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

///////////////////////////////////////
// MOVEMENT
///////////////////////////////////////

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

/**
 * @summary movement based on mouse pointer.  Very easy to use.  Only moves mouse when pointer is in canvas.
 */
function playerMovement3(){
    player.rotation = game.physics.arcade.angleToPointer(player);
}

///////////////////////////////////////
// MISC
///////////////////////////////////////

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