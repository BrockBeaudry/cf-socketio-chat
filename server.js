'use strict';

// Server config
var express = require('express');
var app = express();
var server = require('http').Server(app);
var socketio = require('socket.io');
var io = socketio(server); // Note that we've split this in two to allow for new calls to socketio()
var generateName = require('sillyname');

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

// Add dummy data
var newSocket = socketio()

// Build out storage structures (once!)
var userHash = {};
var rooms = []; // Not necessary yet

io.on('connection', function(socket) {
	var username = generateName().replace(/\s/g, '_');
	var addedUser = false;

	socket.emit('assign username', { username: username });
	userHash[username] = socket;
	userHash['test'] = newSocket;

	// New messages
	socket.on('new message', function(data) {
		// Separate private messages
		if (data.charAt(0) == '@') {
			var privateUser = data.match(/\S*/)[0].replace(/^@/, '');
			var privateMessage = data.match(/\s.*/);
			if (typeof privateMessage == 'array') {
				privateMessage = privateMessage[0].replace(/^\s/, '');
			} else {
				console.log('NICE TRY not an array');
			}
			console.log('Their name: ' + privateUser);
			// Add *better* error handling: what if there's no msg?
			
			var roomName = Math.floor((Math.random() * 100) + 1);
			// TO DO Check against rooms[] to make sure we're not already using it
			
			socket.join(roomName); // Corresponds to user who's sending the msg
			var theirSocket = userHash[privateUser];


			theirSocket.join(roomName); // <= the problem

			// Here we go!
			io.to(roomName).emit('new message', {
				username: socket.username,
				message: 'This msg is private'
			});

		} else {
			// Public messages 
			socket.broadcast.emit('new message', {
				username: socket.username,
				message: data
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