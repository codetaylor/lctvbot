var TemplatePlugin = function(params) {
  
  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  client.on('stanza', function(data) {

    if (data.is('presence')) {

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

          if (data.attrs.type == 'unavailable') {
            // left
            
          } else {
            // joined

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

  var handleCommand = function(message, local) {

    var split = message.split(' ');

    if (message.indexOf('!command') === 0) {


    }

  };

};

module.exports = TemplatePlugin;