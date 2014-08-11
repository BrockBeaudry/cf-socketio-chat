$(document).on('ready', function() {
	var socket = io.connect('http://localhost');
	socket.on('news', function(data) {
		console.log(data);
		socket.emit('event 2', {hello: 'again'});
	});
});