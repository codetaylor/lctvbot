var BanHammerPlugin = function(params) {

  var config = params.config;
  var io = params.io;
  var client = params.client;
  var cli = params.cli;

  var xmpp = require('node-xmpp-client');
  var Util = require('../libs/Util');

  var rateSeconds = 15;
  var messageLimit = 10;
  var warnDurationSeconds = 60 * 10;
  var banDurationSeconds = 60;
  var maxRepeats = 3;
  var repeatPruneSeconds = 60;
  var maxMessageLength = 350;

  // maintains 
  var spamBank = {};
  setInterval(function() {
    for (key in spamBank) {
      var value = spamBank[key];
      for (var i = value.length - 1; i >= 0; --i) {
        if (value[i] < getTimestamp()) {
          value.splice(i, 1);
          //console.log('Spam bank reduced to ' + value.length + ' for ' + key);
        }
      }
    }
  }, 1000);

  // keeps track of last X things someone said
  var repeatBank = {};
  setInterval(function() {
    for (key in repeatBank) {
      // clean up the tail of this collection every N seonds.
      repeatBank[key].shift();
    }
  }, repeatPruneSeconds * 1000);

  var spamWarn = {};
  setInterval(function() {
    for (key in spamWarn) {
      if (spamWarn[key].time + warnDurationSeconds < getTimestamp()) {
        if (spamWarn[key].count === 0) {
          // expire the warning
          delete spamWarn[key];
          console.log('Expired spam warning for ' + key);

        } else {
          // reduce the warning level
          spamWarn[key].count -= 1;
          // re-up the timestamp
          spamWarn[key].time = getTimestamp();
          //console.log('Spam warning level reduced to ' + spamWarn[key].count + ' for ' + key);
        }
      }
    }
  }, 1000);

  var banBank = {};
  setInterval(function() {
    for (key in banBank) {
      if (banBank[key].time < getTimestamp()) {
        // expire the ban
        unban(key.split('/')[1]);
        console.log('Ban auto-lifted from ' + key);
      }
    }
  });

  client.on('stanza', function(data) {

    if (data.is('presence')) {

      //console.log(JSON.stringify(data, null, 1));

      if (data.getChild('delay')) {
        // this is most likely room history

      } else if (data.attrs.from == data.attrs.to) {
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

        }
      }

    } else if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else {

        // check for ops
        var nick = Util.getNickFrom(data.attrs.from);
        if (Util.isOperator(nick, config)) {
          var message = data.getChildText('body');
          handleCommand(message, false);
          return; // bypass the ban hammer for ops
        }

        // if there's a record, add to it, otherwise make a new one
        if (spamBank[data.attrs.from]) {
          spamBank[data.attrs.from].push(getTimestamp() + rateSeconds);
        } else {
          spamBank[data.attrs.from] = [ getTimestamp() + rateSeconds ];
        }

        // --------------------------------------------------------------------
        // check the length of the message
        var body = data.getChildText('body');
        if (body && body.length > maxMessageLength) {

          // alert the view to a spammer
          io.sockets.in(config.room).emit('sk3lls:spammer', {
            from: data.attrs.from
          });

          handleSpammer(
            data.attrs.from, 
            data.attrs.from.split('/')[1],
            'Please don\'t spam the channel, thanks! :)'
          );
          return;
        }

        // --------------------------------------------------------------------
        // check if they're repeating
        var entry = repeatBank[data.attrs.from];
        if (!entry) {
          entry = repeatBank[data.attrs.from] = [ data.getChildText('body') ];
        } else {
          entry.push(data.getChildText('body'));
        }
        // prune old entries
        while (entry.length > maxRepeats) {
          entry.shift();
        }
        // check for repeats
        var isRepeating = true;
        for (var i = 1; i < entry.length; ++i) {
          isRepeating = isRepeating && (entry[i - 1] == entry[i]);
          if (!isRepeating) {
            break;
          }
        }
        if (entry.length == maxRepeats && isRepeating) {

          // alert the view to a spammer
          io.sockets.in(config.room).emit('sk3lls:spammer', {
            from: data.attrs.from
          });
          
          // yep...
          var nick = data.attrs.from.split('/')[1];
          handleSpammer(data.attrs.from, nick, 'Please don\'t spam the channel, thanks! :)', function() {
            // clear the repeat counter
            repeatBank[data.attrs.from] = [];
          });
          return;
        }

        // --------------------------------------------------------------------
        // check if they're spamming
        if (spamBank[data.attrs.from].length > messageLimit) {

          io.sockets.in(config.room).emit('sk3lls:spammer', {
            from: data.attrs.from
          });

          handleSpammer(data.attrs.from, nick, 'Please don\'t spam the channel, thanks! :)', function() {
            // clear the spam counter
            spamBank[data.attrs.from] = [ getTimestamp() + rateSeconds];
          });
        }
        //console.log('spam-counter: ' + data.attrs.from + ' => ' + spamBank[data.attrs.from].length);
      }
    }

  });

  cli.on('command', function(command) {
    handleCommand(command, true);
  });

  var handleSpammer = function(from, nick, message, callback) {
    if (!spamWarn[from]) {
      // hasn't been warned
      var message = '@' + nick + ': ' + message;
      client.sendGroupchat(message);
      // add a warning
      spamWarn[from] = {
        time: getTimestamp() + warnDurationSeconds,
        count: 0
      };
      console.log('Warned ' + from);
      popupDeath(message);
      if (callback) {
        callback();
      }

    } else {
      // has been warned
      var warnCount = spamWarn[from].count;
      var duration = banDurationSeconds * (Math.pow(10, warnCount)); // * 1, 10, 100 minutes
      var message = '@' + nick + ': You were warned. Please come back when you\'ve calmed down a bit. (' + toHHMMSS(duration) +')';
      popupDeath(message);
      client.sendGroupchat(message);
      // update the existing warning
      spamWarn[from] = {
        time: getTimestamp() + warnDurationSeconds,
        count: warnCount + 1
      };
      ban(from, nick, duration, message);
      if (callback) {
        callback();
      }
    }
  };

  var popupDeath = function(message) {
    // send the popout command to the view
    if (message) {
      io.sockets.in(config.room).emit('sk3lls:popout', {
        image: './images/death.png',
        message: message,
        offset: { x: '200px', y: '300px' }
      });
    }
  };

  var handleCommand = function(message, local) {

    if (message.indexOf('!kick') === 0) {

      // usage: !kick <nick> [<reason>]

      var split = message.split(' ');
      var nick = split[1];
      // clean up the nick
      if (nick.indexOf('@') === 0) {
        nick = nick.substring(1);
      }
      var reason = '';
      if (split.length > 2) {
        reason = split.slice(2).join(' ');
      }
      popupDeath(reason ? '@' + nick + ' kicked for: ' + reason : '@' + nick + ': G\'bye!');
      kick(nick, reason);

    } else if (message.indexOf('!ban') === 0) {

      // usage: !ban <nick> <minutes> [<reason>]

      var split = message.split(' ');
      var nick = split[1];
      var duration = '*';
      if (split.length > 2) {
        if (!isNaN(split[2])) {
          duration = +split[2] * 60;          
        }        
      }

      // clean up the nick
      if (nick.indexOf('@') === 0) {
        nick = nick.substring(1);
      }
      // create the from
      var from = nick;
      if (from.indexOf('@') === -1) {
        from = config.room + '/' + nick;
      }

      // assemble the reason, starting with default reason
      var reason;
      if (isNaN(duration)) {
        '@' + nick + ': You have been permanently banned.';
      } else {
        '@' + nick + ': Please wait ' + toHHMMSS(duration) +' before returning.';
      }
      if (split.length > 3) {
        reason = split.slice(3).join(' ');
      }

      popupDeath(reason);
      ban(from, nick, duration, reason);

    } else if (message.indexOf('!uban') === 0) {

      // usage: !uban <nick>

      var split = message.split(' ');
      var nick = split[1];
      var from = nick;
      if (from.indexOf('@') === -1) {
        from = config.room + '/' + nick;
      }
      unban(nick);
      console.log('Ban manually lifted from ' + from);

    }

  };

  var kick = function(nick, reason) {

    // kick works for moderator

    var stanza = new xmpp.Stanza('iq', {
      from: config.session.local + '@' + config.session.domain + '/' + config.session.resource,
      id: 'kick1',
      to: config.room,
      type: 'set'
    })
    .c('query', { xmlns: 'http://jabber.org/protocol/muc#admin' })
    .c('item', { nick: nick, role: 'none' })
    if (reason) {
      stanza.c('reason').t(reason);
    }

    //console.log(JSON.stringify(stanza.root(), null, 2));
    client.send(stanza);
  };

  var unban = function(nick) {

    // clean up the nick
    if (nick.indexOf('@') === 0) {
      nick = nick.substring(1);
    }
    // create the from
    var from = nick;
    if (from.indexOf('@') === -1) {
      from = config.room + '/' + nick;
    }

    delete banBank[from];

    var stanza = new xmpp.Stanza('iq', {
      from: config.session.local + '@' + config.session.domain + '/' + config.session.resource,
      id: 'ban3',
      to: config.room,
      type: 'set'
    })
    .c('query', { xmlns: 'http://jabber.org/protocol/muc#admin' })
    .c('item', { affiliation: 'none', jid: nick + '@' + config.session.domain });

    //console.log(JSON.stringify(stanza.root(), null, 2));

    // client.sendChat(nick, 'Your ban has been lifted from ' + config.room + ', you may come back.');

    client.send(stanza);

  };

  var ban = function(from, nick, duration, message) {

    if (!isNaN(duration)) {
      banBank[from] = {
        time: getTimestamp() + duration,
        duration: duration
      };
      console.log('Banned ' + from + ' for ' + toHHMMSS(duration));
    } else {
      console.log('Banned ' + from + ' permanently');
    }
    setTimeout(function() {
      kick(from.split('/')[1], message);
    }, 3000);

    var stanza = new xmpp.Stanza('iq', {
      from: config.session.local + '@' + config.session.domain + '/' + config.session.resource,
      id: 'ban1',
      to: config.room,
      type: 'set'
    })
    .c('query', { xmlns: 'http://jabber.org/protocol/muc#admin' })
    .c('item', { affiliation: 'outcast', jid: nick + '@' + config.session.domain });
    if (message) {
      stanza.c('reason').t(message);
    }

    //console.log(JSON.stringify(stanza.root(), null, 2));

    client.send(stanza);
    
  };

  // http://stackoverflow.com/questions/5539028/converting-seconds-into-hhmmss/5539081#5539081
  var toHHMMSS = function (data) {
    var d = parseInt(data, 10); // don't forget the second param
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s); 
  };

  var getTimestamp = function() {
    return Math.floor(Date.now() / 1000);
  };

}

module.exports = BanHammerPlugin;