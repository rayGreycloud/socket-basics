var PORT = process.env.PORT || 3000;
var moment = require('moment');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

var clientInfo = {};

// function to display current users
function sendCurrentUsers(socket) {
  var info = clientInfo[socket.id];
  var users = [];

  if (typeof info === 'undefined') {
    return;
  }

  Object.keys(clientInfo).forEach(function(socketId) {
    var userInfo = clientInfo[socketId];

    if (info.room === userInfo.room) {
      users.push(userInfo.name);
    }
  });

  socket.emit('message', {
    name: 'System',
    text: 'Current users: ' + users.join(', '),
    timestamp: moment().valueOf()
  });
}

// user connect event handler
io.on('connection', function(socket) {
  console.log('User connected via socket.io');

  // user disconnect event handler
  socket.on('disconnect', function() {
    var userData = clientInfo[socket.id];

    if (typeof userData !== 'undefined') {
      socket.leave(userData.room);
      io.to(userData.room).emit('message', {
        name: "System",
        text: userData.name + ' has left the room',
        timestamp: moment().valueOf()
      });
      delete clientInfo[socket.id];
    }
  });

  // user join event handler
  socket.on('joinRoom', function(req) {
    clientInfo[socket.id] = req;
    socket.join(req.room);
    socket.broadcast.to(req.room).emit('message', {
      name: 'System',
      text: req.name + ' has joined the room',
      timestamp: moment().valueOf()
    });
  });

  // message event handler
  socket.on('message', function(message) {
    console.log('Message received: ' + message.text);

    if (message.text === '@currentUsers') {
      sendCurrentUsers(socket);
    } else {
      message.timestamp = moment().valueOf();
      io.to(clientInfo[socket.id].room).emit('message', message);
    }
  });

  // system welcome event
  socket.emit('message', {
    name: 'System',
    text: 'Welcome to the Chat App!',
    timestamp: moment().valueOf()
  });
});

// start server
http.listen(PORT, function() {
  console.log('Socket.io server started on port ' + PORT + '...');
});
