// const API_SERVER_URL = 'http://localhost:8000/api';
const API_SERVER_URL = 'https://lawyerbot-api.herokuapp.com/api';

var express = require('express');
var socket = require('socket.io');
var axios = require('axios');

// App setup
var app = express();
var server = app.listen(4000, function () {
  console.log(`Server started: listening on port 4000`);
});

// Static files
app.use(express.static('public'));

// Socket setup
var io = socket(server);

io.on('connection', function (socket) {

  console.log(`Made socket connection ${socket.id}`);
  axios.patch(`${API_SERVER_URL}/metrics`, { "chat_init": 0 })
    .then(() => {
      console.log('Successfully increment the # of chat session initiated');
    });

  socket.on('chat', function (data) {
    console.log('socket id=', socket.id);
    console.log('chat >> data=', data);
    io.sockets.emit('chat', data);
  });

  socket.on('disconnect', function(data){
    console.log('socket id=', socket.id);
    console.log('user disconnected >> data=', data);
  });

});
