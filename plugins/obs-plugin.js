var OBSPlugin = function(params) {

  // https://github.com/nodecg/obs-remote-js/blob/master/docs/OBSRemote.md

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
  var preview = true;

  var streaming = false;

  var OBS = OBSClient(config, function() {
    OBS.setCurrentScene(defaultView);
  });

  OBS.onStreamStarted = function() {
    streaming = true;
  };

  OBS.onStreamStopped = function() {
    streaming = false;
  };

  OBS.onConnectionOpened = function() {
    console.log('Connection to OBSRemote open');
    streaming = false;
  };

  OBS.onConnectionClosed = function() {
    console.log('Connection to OBSRemote closed');
    streaming = false;
  };

  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        var nick = Util.getNickFrom(data.attrs.from);
        var user = storage.getItem('users')[data.attrs.from];

        if (Util.isOperator(nick, config)) {
          // ops only
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

    } else if (message.indexOf('!obs') === 0) {

      var split = message.split(' ');
      if (split.length > 1) {

        if (split[1] == 'connect') {
          /*OBS = OBSClient(config, function() {
            OBS.setCurrentScene(defaultView);
          });*/
          OBS.connect(config.obsRemote.host, config.obsRemote.password);
        }

      }

    } else if (message.indexOf('!stream') === 0) {

      var split = message.split(' ');
      if (split.length > 1) {

        if (split[1] == 'start') {
          // start the stream
          if (!streaming) {
            OBS.setCurrentScene(defaultView);
            if (split.length > 2 && split[2] == 'preview') {
              OBS.toggleStream(true);
            } else {
              OBS.toggleStream(false);
            }
          }

        } else if (split[1] == 'stop') {
          // stop the stream
          if (streaming) {
            OBS.setCurrentScene('End');
            setTimeout(function() {
              OBS.toggleStream();
            }, 10 * 1000);
          }

        }
      }
    }

  };
};

module.exports = OBSPlugin;