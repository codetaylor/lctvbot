var TaskPlugin = function(params) {

  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var Util = require('../libs/Util');
  
  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {
        var nick = Util.getNickFrom(data.attrs.from);

        if (Util.isOperator(nick, config)) {
          // operator only
          var message = data.getChildText('body');
          handleCommand(message, false);
        }
      }
    }
  });

  // receive commands from the remote command view
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

  cli.on('command', function(command) {
    handleCommand(command, true);
  });

  var handleCommand = function(message, local) {

    if (message.indexOf('!task') === 0) {

      // usage: !task <set|clear> [<task>]

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
  };
};

module.exports = TaskPlugin;