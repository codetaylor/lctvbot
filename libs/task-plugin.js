var TaskPlugin = function(app, config, io, client) {
  
  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        if (data.attrs.from == config.room + '/' + config.nick) {

          // we sent this message
          var message = data.getChildText('body');
          if (message.indexOf('!task') === 0) {

            var split = message.split(' ');
            if (split[1] == 'set') {

              split.shift();
              split.shift();
              var task = split.join(' ');
              io.sockets.in(config.room).emit('sk3lls:task_set', {
                task: task
              });

            } else if (split[1] == 'clear') {

              io.sockets.in(config.room).emit('sk3lls:task_clear', {});

            }
          }
        }
      }
    }
  });

  io.on('connection', function(socket) {

    socket.on('control:task-set', function(data) {
      //console.log(JSON.stringify(data, null, 1));
      if (data.task) {
        io.sockets.in(config.room).emit('sk3lls:task_set', {
          task: data.task
        });

      } else {
        io.sockets.in(config.room).emit('sk3lls:task_clear', {});

      }
    });

    socket.on('control:task-clear', function(data) {
      //console.log(JSON.stringify(data, null, 1));
      io.sockets.in(config.room).emit('sk3lls:task_clear', {});
    });

  });
};

module.exports = TaskPlugin;