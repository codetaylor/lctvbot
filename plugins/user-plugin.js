var UserPlugin = function(params) {
  
  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var storage = require('node-persist');
  var Util = require('../libs/Util');

  var users = storage.getItem('users');
  if (!users) {
    // first time run, set up the admin user
    // this assumes role moderator and affiliation admin
    console.log('Initializing user store...');
    users = {};
    var user = users[config.room + '/' + config.nick] = {
      nick: config.nick,
      visits: 1,
      follower: false,
      role: 'moderator',
      affiliation: 'admin',
      founder: false,
      greeting: false
    };
    // persist
    storage.setItem('users', users);
  }

  console.log('Loaded ' + Object.keys(users).length + ' users');

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

            // check if they have a record
            if (users[data.attrs.from]) {
              var user = users[data.attrs.from];

              // update the user's visits
              user.visits++;

              // update these as they may change
              user.follower = followers[nick.toLowerCase()] ? true : false;
              user.role = data.getChild('x').getChild('item').attrs.role;
              user.affiliation = data.getChild('x').getChild('item').attrs.affiliation;
              
              // defaults
              if (!user.hasOwnProperty('greeting')) {
                user.greeting = true;
              }
              if (!user.hasOwnProperty('founder')) {
                user.founder = false;
              }
              if (!user.hasOwnProperty('donations')) {
                user.donations = 0;
              }
              
              // persist
              storage.setItem('users', users);

            } else {
              // create new user
              var user = users[data.attrs.from] = {
                nick: nick,
                visits: 1,
                follower: followers[nick.toLowerCase()] ? true : false,
                role: data.getChild('x').getChild('item').attrs.role,
                affiliation: data.getChild('x').getChild('item').attrs.affiliation,
                greeting: true,
                founder: false,
                donations: 0
              };

              // persist
              storage.setItem('users', users);
            }

          }
        }
      }
    } else if (data.is('message')) {
      
      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        var nick = Util.getNickFrom(data.attrs.from);
        var message = data.getChildText('body');

        // operator only
        if (Util.isOperator(nick, config) && message.indexOf('!') === 0) {
          handleCommand(message, false);
        }

      }

    }

  });

  cli.on('command', function(command) {
    handleCommand(command, true);
  });

  var getTimestamp = function() {
    return Math.floor(Date.now() / 1000);
  };

  var handleCommand = function(message, local) {

    var split = message.split(' ');

    if (message.indexOf('!greeting') === 0) {

      // usage: !greeting [<'true'|'false'>]

      if (split.length === 1) {
        client.sendGroupchat('greeting: ' + storage.getItem('settings').greeting);
      } else {
        storage.getItem('settings').greeting = (split[1] == 'true') ? true : false;
      }

    } else if (message.indexOf('!user') === 0) {

      // usage: !user <nick> <'get'|'set'> <variable> [<value>]

      var nickParam = split[1];
      var users = storage.getItem('users');
      var user = users[config.room + '/' + nickParam];
      if (split.length == 2) {
        // display the entire user
        if (!user) {
          if (local) {
            console.log(nickParam + ': undefined');  
          } else {
            client.sendGroupchat(nickParam + ': undefined');
          }
        } else {
          if (local) {
            console.log(JSON.stringify(user, null, 1));  
          } else {
            client.sendGroupchat('\n' + JSON.stringify(user, null, 1));
          }
        }
        return;
      }

      if (split.length < 4) {
        console.log('Expected 4 arguments, got ' + split.length + ': ' + split);
      }
      // clean up the nick
      if (nickParam.indexOf('@') === 0) {
        nickParam = nickParam.substring(1);
      }
      var command = split[2];
      var variable = split[3];
      if (!user) {
        // create new empty user
        var user = users[config.room + '/' + nickParam] = {
          nick: nickParam,
          visits: 0,
          follower: false,
          founder: false,
          greeting: true,
          role: '',
          affiliation: '',
          donations: 0
        };
      }

      switch (command) {
        case 'get':
          if (local) {
            console.log(nickParam + ' - ' + variable + ': ' + user[variable]);  
          } else {
            client.sendGroupchat(nickParam + ' - ' + variable + ': ' + user[variable]);
          }
          break;

        case 'set':
          if (split.length < 5) {
            // TODO notify
            return;
          }
          var value = split[4];
          if (isNaN(value)) {
            // is string
            if (value == 'true') {
              value = true;
            } else if (value == 'false') {
              value = false;
            }
          } else {
            // is number
            value = +value;
          }
          user[variable] = value;
          if (local) {
            console.log('user set ' + nickParam + ' - ' + variable + ': ' + user[variable]);  
          } else {
            client.sendGroupchat(nickParam + ' - ' + variable + ': ' + user[variable]);
          }
          break;
      }

      storage.setItem('users', users);

    }

  };

};

module.exports = UserPlugin;