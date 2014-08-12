'use strict';

// Server config
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var generateName = require('sillyname');

app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), function() {
    console.log('Listening on: ' + app.get('port'));
});

// Routing
app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Chatroom stats
var usernames = {};
var numUsers = 0;

// Storage structure for rooms (including private chat)
var userHash = {};

io.on('connection', function(socket) {
	var addedUser = false;
	var username = generateName().replace(/\s/g, '_');
	userHash[username] = socket;
	
	socket.emit('assign username', {
		username: username
	});

	// New messages
	socket.on('new message', function(data) {
		// Separate private messages
		if (data.charAt(0) == '@') {
			// Parse out username and message
			var privateUser = data.match(/\S*/)[0].replace(/^@/, '');
			var privateMessage = data.match(/\s.*/);
			// Handle empty messages
			if (privateMessage) {
				privateMessage = privateMessage[0].replace(/^\s/, '');
			} else {
				socket.emit('new message', {
					username: socket.username,
					message: 'You didn\'t type anything!',
					type: 'privateMessage'
				});
				return;
			}
			
			// Set the room name
			// var roomName = Math.floor((Math.random() * 10000) + 1);
			
			// Join the new room, and put the target user in there too
			// socket.join(roomName);
			var theirSocket = userHash[privateUser];
			// Do they even exist?
			if (!theirSocket) {
				return 'Other user doesn\'t exist'
			}
			// theirSocket.join(roomName);

			// Connect!
			socket.broadcast.to(theirSocket.id).emit('new message', {
				username: socket.username,
				message: privateMessage,
				type: 'privateMessage'
			});

			// End the connection right away
			socket.leave(roomName);
			theirSocket.leave(roomName);
		} else {
			// Public messages 
			socket.broadcast.emit('new message', {
				username: socket.username,
				message: data,
				type: 'publicMessage'
			});
		}
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