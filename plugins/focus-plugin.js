var FocusPlugin = function(app, config, io, client) {

  var Util = require('../libs/Util')  ;
  var defaultFocusMinutes = 25;

  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        var nick = Util.getNickFrom(data.attrs.from);

        // operator only
        if (Util.isOperator(nick, config)) {

          // we sent this message
          var message = data.getChildText('body');
          if (message.indexOf('!focus') === 0) {

            // usage: !focus [<'off'|minutes>]

            var split = message.split(' ');
            if (split.length === 2 && split[1] == 'off') {
              // turn it off
              io.sockets.in(config.room).emit('sk3lls:focus', {
                off: true
              });

            } else if (split.length === 2 && !isNaN(split[1])) {
              // time parameter
              var minutes = +split[1];
              if (minutes < 1) {
                minutes = 1;
              }
              io.sockets.in(config.room).emit('sk3lls:focus', {
                minutes: minutes
              });

            } else {
              // no time parameter or invalid time parameter
              io.sockets.in(config.room).emit('sk3lls:focus', {
                minutes: defaultFocusMinutes
              });

            }
          }
        }
      }
    }
  });

  io.on('connection', function(socket) {

    socket.on('control:focus-start', function(data) {
      //console.log(JSON.stringify(data, null, 1));
      if (data.minutes) {
        io.sockets.in(config.room).emit('sk3lls:focus', {
          minutes: data.minutes
        });

      } else {
        io.sockets.in(config.room).emit('sk3lls:focus', {
          minutes: defaultFocusMinutes
        });

      }
    });

    socket.on('control:focus-stop', function(data) {
      //console.log(JSON.stringify(data, null, 1));
      io.sockets.in(config.room).emit('sk3lls:focus', {
        off: true
      });
    });

  });


};

module.exports = FocusPlugin;