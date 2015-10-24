var UserPlugin = function(params) {
  
  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var storage = require('node-persist');
  var Util = require('../libs/Util');

  var users = storage.getItem('users');

  client.on('stanza', function(data) {

    if (data.is('presence')) {

      //console.log(JSON.stringify(data, null, 1));
      var nick = data.attrs.from.split('/')[1];

      if (data.attrs.from == data.attrs.to) {
        // this is our own initial presence

      } else if (data.getChild('show')) {
        // children: away, chat, xa (not available), dnd (do not disturb)
        var show = data.getChild('show');
        if (show.getChild('away')) {
          //client.sendGroupchat(nick + ' is now away');

        } else if (show.getChild('chat')) {
          //client.sendGroupchat(nick + ' is now available for chat');

        } else if (show.getChild('xa')) {
          //client.sendGroupchat(nick + ' is no longer available');

        } else if (show.getChild('dnd')) {
          //client.sendGroupchat('Do not disturb ' + nick);
        }

      } else {
        // check if the presence is from ourself
        var split = data.from.split('/');
        if (split.length > 1 && split[0] == config.connection.jid) {
          // we sent this

        } else {
          // someone else joined/left the room we're in
          //console.log(JSON.stringify(data, null, 2));

          if (data.attrs.type == 'unavailable') {
            // ignore these for now
            
          } else {

            // get local storage
            var users = storage.getItem('users') || {};
            var followers = storage.getItem('followers') || {};

            // greet
            var user = users[data.attrs.from];
            if (user) {
              greetUser(user);
            }
          }
        }
      }
    }
  });

  var greetUser = function(user) {
    if (!user.greeting || !storage.getItem('settings').greeting) {
      return;
    }

    if (user.follower) {
      client.sendGroupchat(user.nick + '! Thanks again for following!');
    } else if (user.visits > 2) {
      client.sendGroupchat('Hey, ' + user.nick + '! What\'s new?');
    } else if (user.visits > 1) {
      client.sendGroupchat('Welcome back, ' + user.nick + '!');
    } else {
      client.sendGroupchat('Welcome to my channel, ' + user.nick + '!');
    }
  };

};

module.exports = UserPlugin;