var ClientViewPlugin = function(app, config, io, client) {

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

    var body = data.getChildText('body');
    var nick = Util.getNickFrom(data.attrs.from);

    if (body.indexOf('!') === 0) { // is command

      var filename = require('path').join(app.get('configPath'), 'popout.json');
      var popoutCommands = JSON.parse(require('fs').readFileSync(filename));

      // loop through the popout commands
      for (var k in popoutCommands) {

        if (popoutCommands.hasOwnProperty(k)) {

          if (body.indexOf(k) === 0) {

            var user = storage.getItem('users')[data.attrs.from];
            if (!user.follower && !Util.isOperator(nick, config)) {
              // reserved for ops and followers
              client.sendGroupchat('@' + nick + ': Follow and get access to this command!');
              return;
            }

            var message = popoutCommands[k].message;
            
            if (message) {
              // if the message is an array, pick a random one
              if (message.constructor === Array) {
                message = message[Math.floor(Math.random() * message.length)];
              }
              
              // overwrites default message if caller supplies a message after the command
              /*if (body.length > k.length) {
                message = body.substring(k.length).trim();
              }*/
            }

            // send the popout command to the view
            io.sockets.in(config.room).emit('sk3lls:popout', {
              image: popoutCommands[k].image,
              message: message,
              offset: popoutCommands[k].bubble_position
            });

          }
        }
      }

    } else if (body.indexOf('!') !== 0) { // is not ! command
      // get the user's image, send the message to the view
      UserImage.get(nick, function (image_url) {
        io.sockets.in(config.room).emit('message', {
          from: data.attrs.from,
          to: data.attrs.to,
          op: Util.isOperator(nick, config),
          type: data.attrs.type,
          body: body,
          image_url: image_url,
          user: storage.getItem('users')[data.attrs.from]
        });
      });
    }
  };

  var handlePresence = function(data) {

    var nick = Util.getNickFrom(data.attrs.from);
    var body = data.getChildText('body');
    var isSelf = data.attrs.from == config.room + '/' + config.nick;

    if (data.attrs.type == 'unavailable') {
      console.log(data.attrs.from + ' unavailable');
      UserImage.get(nick, function(image_url) {
        io.sockets.in(config.room).emit('unavailable', {
          from: data.attrs.from,
          to: data.attrs.to,
          op: isSelf,
          type: data.attrs.type,
          body: body,
          image_url: image_url,
          user: storage.getItem('users')[data.attrs.from]
        });
      });

    } else {
      console.log(data.attrs.from + ' available');
      UserImage.get(nick, function(image_url) {
        io.sockets.in(config.room).emit('available', {
          from: data.attrs.from,
          to: data.attrs.to,
          op: isSelf,
          type: data.attrs.type,
          body: body,
          image_url: image_url,
          user: storage.getItem('users')[data.attrs.from]
        });
      });

    }
  };
  
};

module.exports = ClientViewPlugin;