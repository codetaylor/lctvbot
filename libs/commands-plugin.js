var RulesPlugin = function(app, config, io, client) {
  
  var cooldown = false;

  client.on('stanza', function(data) {

    if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        var message = data.getChildText('body');
        if (message.indexOf('!commands') === 0) {
          if (cooldown) {
            client.sendGroupchat('*bot* The !commands command is on cooldown for 5 seconds, please be patient.');
          } else {
            cooldown = true;

            var filename = require('path').join(app.get('configPath'), 'popout.json');
            var popoutCommands = JSON.parse(require('fs').readFileSync(filename));

            var list = [];
            for (command in popoutCommands) {
              list.push(command);
            }
            client.sendGroupchat('*bot* Popout commands: ' + list.join(', '));

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