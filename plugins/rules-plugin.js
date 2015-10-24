var RulesPlugin = function(params) {
  
  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;

  var cooldown = false;

  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        var message = data.getChildText('body');
        if (message.indexOf('!rules') === 0) {
          if (cooldown) {
            client.sendGroupchat('*bot* The !rules command is on cooldown for 5 seconds, please be patient.');
          } else {
            cooldown = true;
            client.sendGroupchat('*bot* The rules: Don\'t spam, keep profanity reasonable, and show respect.');
            setTimeout(function() {
              cooldown = false;
            }, 5000);
          }
        }

      }

    }

  });

};

module.exports = RulesPlugin;