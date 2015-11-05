var ClientViewPlugin = function(params) {

  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var Util = require('../libs/Util');
  var UserImage = require('../libs/UserImage');
  var storage = require('node-persist');

  // pipes the room joins/leaves and messages to io

  client.on('online', function(data) {
    //console.log('session:started');
  });

  client.on('stanza', function(data) {

    if (data.is('presence')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else if (data.getChild('show')) {
        // presence is a status change

      } else if (data.attrs.from == data.attrs.to) {
        // this is our own initial presence

      } else if (data.getChild('show')) {
        // children: away, chat, xa (not available), dnd (do not disturb)
        var show = data.getChild('show');
        if (show.getChild('away')) {
          client.sendGroupchat(nick + ' is now away');

        } else if (show.getChild('chat')) {
          client.sendGroupchat(nick + ' is now available for chat');

        } else if (show.getChild('xa')) {
          client.sendGroupchat(nick + ' is no longer available');

        } else if (show.getChild('dnd')) {
          client.sendGroupchat('Do not disturb ' + nick);
        }
      } else {
        // check if the presence is from ourself
        var split = data.from.split('/');
        if (split.length > 1 && split[1] == config.nick) {
          // we sent this, ie. joined a room
          // handlePresence(data);

        } else if (split.length > 1 && split[0] == config.connection.jid) {
          // we sent this

        } else {
          // someone else joined/left the room we're in
          //console.log(JSON.stringify(data, null, 2));
          handlePresence(data);

        }
      }

    } else if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else if (Util.getNickFrom(data.attrs.from) == config.proxy.nick) {
        // this is a proxy message, don't display it
        //console.log(JSON.stringify(data, null, 2));

      } else {
        // someone else sent this message
        //console.log(JSON.stringify(data, null, 2));
        handleMessage(data);
      }

    } else {
      //console.log(JSON.stringify(data, null, 2));
    }
  });

  var handleMessage = function(data) {

    // console.log('Message: ');
    // console.log(data);

    var message = data.getChildText('body');
    var nick = Util.getNickFrom(data.attrs.from);

    if (message.indexOf('!') === 0) { // is command

      var filename = require('path').join(app.get('configPath'), 'popout.json');
      var popoutCommands = JSON.parse(require('fs').readFileSync(filename));

      // loop through the popout commands
      for (var k in popoutCommands) {

        if (popoutCommands.hasOwnProperty(k)) {

          if (message.indexOf(k) === 0) {

            var user = storage.getItem('users')[data.attrs.from];
            if (!user.follower && !Util.isOperator(nick, config)) {
              // reserved for ops and followers
              client.sendGroupchat('@' + nick + ': Follow and get access to this command!');
              return;
            }

            handleCommand(false, popoutCommands[k]);
          }
        }
      }

    } else if (message.indexOf('!') !== 0) { // is not ! command
      // get the user's image, send the message to the view
      UserImage.get(nick, function (image_url) {
        io.sockets.in(config.room).emit('message', {
          from: data.attrs.from,
          to: data.attrs.to,
          op: Util.isOperator(nick, config),
          type: data.attrs.type,
          body: message,
          image_url: image_url,
          user: storage.getItem('users')[data.attrs.from]
        });
      });
    }
  };

  cli.on('command', function(command) {
    var filename = require('path').join(app.get('configPath'), 'popout.json');
    var popoutCommands = JSON.parse(require('fs').readFileSync(filename));

    // loop through the popout commands
    for (var k in popoutCommands) {

      if (popoutCommands.hasOwnProperty(k)) {

        if (command.indexOf(k) === 0) {
          handleCommand(true, popoutCommands[k]);
        }
      }
    }
  });

  var handleCommand = function(local, popoutCommand) {
    var popoutMessage = popoutCommand.message;
                
    if (popoutMessage) {
      // if the message is an array, pick a random one
      if (popoutMessage.constructor === Array) {
        popoutMessage = popoutMessage[Math.floor(Math.random() * popoutMessage.length)];
      }      
    }
    // send the popout command to the view
    io.sockets.in(config.room).emit('sk3lls:popout', {
      image: popoutCommand.image,
      message: popoutMessage,
      offset: popoutCommand.bubble_position
    });
  };

  var handlePresence = function(data) {

    var nick = Util.getNickFrom(data.attrs.from);
    var message = data.getChildText('message');
    var isSelf = data.attrs.from == config.room + '/' + config.nick;

    var users = storage.getItem('users');
    var user = users[data.attrs.from];
    if (user.visits < 3) {
      return;
    }

    if (data.attrs.type == 'unavailable') {
      console.log(data.attrs.from + ' unavailable');
      if (user.visits > 2 || user.follower) {
        UserImage.get(nick, function(image_url) {
          io.sockets.in(config.room).emit('unavailable', {
            from: data.attrs.from,
            to: data.attrs.to,
            op: isSelf,
            type: data.attrs.type,
            message: message,
            image_url: image_url,
            user: storage.getItem('users')[data.attrs.from]
          });
        });
      }

    } else {
      console.log(data.attrs.from + ' available');
      if (user.visits > 2 || user.follower) {
        UserImage.get(nick, function(image_url) {
          io.sockets.in(config.room).emit('available', {
            from: data.attrs.from,
            to: data.attrs.to,
            op: isSelf,
            type: data.attrs.type,
            message: message,
            image_url: image_url,
            user: storage.getItem('users')[data.attrs.from]
          });
        });
      }

    }
  };
  
};

module.exports = ClientViewPlugin;