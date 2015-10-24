var OBSPlugin = function(params) {

  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var Util = require('../libs/Util')  ;
  var OBSClient = require('../libs/OBSClient');
  var storage = require('node-persist');

  var defaultView = 'Desktop2';
  var currentView = defaultView;
  var cooldown = 0;

  var afk = false;

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

        if (Util.isOperator(nick, config)) {
          var message = data.getChildText('body');
          handleCommand(message, false);
        }

      }
    }
  });

  cli.on('command', function(command) {
    handleCommand(command, true);
  });

  var handleCommand = function(message) {
    
    if (message.indexOf('!view') === 0) {

      // usage: !view
      if (currentView == 'Desktop2') {
        currentView = 'Desktop1';
        OBS.setCurrentScene('Desktop1');
      } else {
        currentView = 'Desktop2';
        OBS.setCurrentScene('Desktop2');
      }
      client.sendGroupchat('Switched view to: ' + currentView);
      console.log('Switched view to: ' + currentView);

    } else if (message.indexOf('!afk') === 0) {
      // toggle the AFK overlay
      if (!afk) {
        afk = true;
        OBS.setSourceRender('AFK', afk);
      }

    } else if (message.indexOf('!back') === 0) {

      if (afk) {
        afk = false;
        OBS.setSourceRender('AFK', false);
      }
    }

  };
};

module.exports = OBSPlugin;