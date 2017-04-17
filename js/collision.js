//////////////////////////////////////////////////////////////
/// COLLISION CODE (called by Phaser update)
//////////////////////////////////////////////////////////////

var l33tHax = false; //allows you to survive death

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
        var gameOverText = game.add.text(game.world.centerX, game.world.centerY, "Game Over.  Refresh to Try again.  \nScore: " + endTime, fontStyle);
        gameOverText.anchor.setTo(.5);
    }
}