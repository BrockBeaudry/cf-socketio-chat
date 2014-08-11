'use strict';

// Server config
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), function() {
    console.log('Listening on: ' + app.get('port'));
});

app.use(express.static(__dirname + '/static'));

// Routers
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Event handlers
io.on('connection', function(socket) {
    console.log('Connected!');
    socket.emit('news', {hello: 'world'});
    socket.on('event 2', function(data) {
    	console.log('Is this right? ' + data);
    });
});