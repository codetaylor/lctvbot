var FAQPlugin = function(params) {

  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var cooldown = false;

  var Util = require('../libs/Util');
  
  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {
        var nick = Util.getNickFrom(data.attrs.from);

        var message = data.getChildText('body');
        handleCommand(message, false);
      }
    }
  });

  cli.on('command', function(command) {
    handleCommand(command, true);
  });

  var handleCommand = function(message, local) {

    if (message.indexOf('!faq') === 0) {

      // usage: !faq [<number>]

      if (cooldown) {
        client.sendGroupchat('The !faq command has a cooldown of 3 seconds.');
      }

      var filename = require('path').join(app.get('configPath'), 'faq.json');
      var faq = JSON.parse(require('fs').readFileSync(filename));

      var split = message.split(' ');

      if (split.length > 1 && !isNaN(split[1])) {
        var index = +split[1];
        if (index > 0 && index <= faq.length) {
          client.sendGroupchat(faq[index - 1].answer);
          cooldown = true;
          setTimeout(function() {
            cooldown = false;
          }, 3 * 1000);
        }

      } else {
        var output = '\nType !faq <number>:';
        for (var i = 0; i < faq.length; ++i) {
          output += '\n[' + (i + 1) + '] ' + faq[i].query;
        }
        client.sendGroupchat(output);
        cooldown = true;
        setTimeout(function() {
          cooldown = false;
        }, 3 * 1000);
      }

    }
  };
};

module.exports = FAQPlugin;