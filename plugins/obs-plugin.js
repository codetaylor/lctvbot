var OBSPlugin = function(app, config, io, client) {

  var Util = require('../libs/Util')  ;
  var OBSClient = require('../libs/OBSClient');
  var storage = require('node-persist');

  var defaultView = 'Desktop2';
  var currentView = defaultView;
  var cooldown = 0;

  var OBS = OBSClient(config, function() {
    OBS.setCurrentScene(defaultView);
  });

  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        var nick = Util.getNickFrom(data.attrs.from);
        var user = storage.getItem('users')[data.attrs.from];

        var message = data.getChildText('body');
        if (message.indexOf('!view') === 0) {

          // operator only
          if (Util.isOperator(nick, config)) {

            // usage: !view

            if (cooldown) {
              client.sendGroupchat('Sorry, @' + nick + ', !view is on cooldown for ' + cooldown + ' more seconds.');
              return;
            }

            cooldown = 30;

            if (currentView == 'Desktop2') {
              currentView = 'Desktop1';
              OBS.setCurrentScene('Desktop1');
            } else {
              currentView = 'Desktop2';
              OBS.setCurrentScene('Desktop2');
            }

            var handle = setInterval(function() {
              --cooldown;
              if (cooldown == 0) {
                clearInterval(handle);
                // client.sendGroupchat('Try changing the view with !view.');
              }
            }, 1000);

          } else {
            client.sendGroupchat('@' + nick + ', donate or pre-order and gain access to this command!');

          }
        }

      }
    }
  });

};

module.exports = OBSPlugin;