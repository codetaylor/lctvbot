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
            client.sendGroupchat('The !rules command is on cooldown for 5 seconds, please be patient.');
          } else {
            cooldown = true;
            client.sendGroupchat(
              '\n' +
              '# Don\'t spam:\n' +
              'Don\'t repeat yourself many times in a row, ' +
              'don\'t write long messages (use pastebin), ' +
              'don\'t join/leave many times in a row, ' +
              'don\'t fire off many messages in a short period, ' +
              'and don\'t advertise.\n' +
              '# Keep profanity reasonable:\n' +
              'I swear, you swear, we all do it; shit happens. ' +
              'By reasonable I mean don\'t be vulgar or obscene.\n' +
              '# No trolling:\n' +
              'If you want to troll, go somewhere else, we will do fine without you. ' +
              'By trolling, I mean "making deliberate offensive or provocative ' +
              'remarks with the aim of upsetting someone or eliciting an angry ' +
              'response from them".'
              );
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