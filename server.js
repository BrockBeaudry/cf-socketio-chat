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

// Socket functionality
var usernames = {};
var numUsers = 0;
io.on('connection', function(socket) {

	var addedUser = false;

	// New messages
	socket.on('new message', function(data) {
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
	});
	
	// Adding users
	socket.on('add user', function(username) {
		socket.username = username;
		usernames[username] = username;
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers
		});

		// Tell everyone that a user has joined
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
		});
	});

	// Typing? Tell everyone
	socket.on('typing', function() {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	// Stop typing
	socket.on('stop typing', function() {
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});

	// User disconnects
	socket.on('disconnect', function() {
		if (addedUser) {
			delete usernames[socket.username];
			--numUsers;
			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
});