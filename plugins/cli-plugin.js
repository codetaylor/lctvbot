var CLIPlugin = function(params) {

  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var Util = require('../libs/Util')  ;
  var storage = require('node-persist');

  cli.on('message', function(message) {
    var asSelf = true;
    client.sendGroupchat(message, asSelf);
  });

  client.on('stanza', function(data) {
    if (data.is('message')) {
      var nick = Util.getNickFrom(data.attrs.from);
      if (nick != config.proxy.nick) {
        console.log('*** ' + nick + ': ' + data.getChildText('body'));
      }
    }
  });

};

module.exports = CLIPlugin;