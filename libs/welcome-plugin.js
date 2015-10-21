var RulesPlugin = function(app, config, io, client) {
  
  var filename = require('path').join(app.get('configPath'), 'welcome.json');
  var welcome = {};

  // NOTE: rsync'ing the new stuff removes the welcome file...
  try {
    welcome = JSON.parse(require('fs').readFileSync(filename));
  } catch(e) {
    console.log('No welcome.json file found, will create one: ' + filename);
  }

  var updateFile = function() {
    try {
      require('fs').writeFileSync(filename, JSON.stringify(welcome, null, 1));
      console.log('Updated file: ' + filename);
      console.log(JSON.stringify(welcome, null, 1));
    } catch(e) {
      console.log(e);
    }
  };

  client.on('stanza', function(data) {

    if (data.is('presence')) {

      console.log(JSON.stringify(data, null, 1));

      if (data.attrs.from == data.attrs.to) {
        // this is our own initial presence

      } else {
        // check if the presence is from ourself
        var split = data.from.split('/');
        if (split.length > 1 && split[1] == config.nick) {
          // we sent this, ie. joined a room

        } else if (split.length > 1 && split[0] == config.connection.jid) {
          // we sent this

        } else {
          // someone else joined/left the room we're in
          //console.log(JSON.stringify(data, null, 2));

          if (data.attrs.type == 'unavailable') {
            // ignore these for now
            
          } else {
            var nick = data.attrs.from.split('/')[1];

            // check if they've been here before
            if (welcome[data.attrs.from]) {
              var entry = welcome[data.attrs.from];
              entry.visits++;
              updateFile();

              if (entry.visits > 2) {
                client.sendGroupchat('*bot* Welcome back, ' + nick + '! Good to see you again.')
              }

            } else {
              welcome[data.attrs.from] = {
                visits: 1
              }
              updateFile();

              client.sendGroupchat('*bot* Welcome to my channel, ' + nick + '!');
              client.sendGroupchat('*bot* Check out the rules with !rules and the command list with !commands. Enjoy your stay!');

            }
          }

        }

      }

    }

  });

};

module.exports = RulesPlugin;