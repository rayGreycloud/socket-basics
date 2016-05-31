var socket = io();

socket.on('connect', function() {
  console.log('Successfully connected to socket.io server');
});

socket.on('message', function(message) {
  console.log('New Message:');
  console.log(message.text);
});
