io = require('socket.io').listen(9999)
io.sockets.on 'connection', (socket) ->
  socket.on 'snow-mo-event', (data) -> 
    io.sockets.emit 'snow-mo-event', data
