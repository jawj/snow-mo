(function() {
  var io;
  io = require('socket.io').listen(9999);
  io.sockets.on('connection', function(socket) {
    return socket.on('snow-mo-event', function(data) {
      return io.sockets.emit('snow-mo-event', data);
    });
  });
}).call(this);
