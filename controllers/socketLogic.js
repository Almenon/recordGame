function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

module.exports = function (io) {
    var app = require('express');
    var router = app.Router();
    //var regex = require('./regex'); use this for extra js files
    var players = [];

    var world = [];
    for (var i = 0; i < 200; i++)
    {
        world[i] = {'x': randomIntFromInterval(-1000,1000), 
        'y': randomIntFromInterval(-1000,1000)}
    }

    io.on('connection', function (socket) {
        console.log('new connection: ' + socket.id);        
        
        socket.on('disconnect', function () {
            console.log('disconnect: ' + socket.id);
            socket.broadcast.to(socket.room).emit('disconnected', '');
        });

        socket.on('joinGame', function (playerName) {
            socket.emit('world',world);
            //todo: check if playername already exists
            players.push(playerName);
            socket.join('main');
            io.in('main').emit('newPlayer', playerName);
            socket.room = 'main';
            console.log('total players: ' + players.length);
        });

        socket.on('message', function (message) {
            socket.broadcast.to(socket.room).emit('message', message);
        });

        socket.on('pingCheck', function(time){
            socket.emit('pingResponse', time);
        });

    });

    return router;
}
