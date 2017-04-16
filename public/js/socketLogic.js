//////////////////////////////////////////////////////////////
/// SOCKET LOGIC FOR MULTIPLAYER
//////////////////////////////////////////////////////////////

/* (not being use currently)

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