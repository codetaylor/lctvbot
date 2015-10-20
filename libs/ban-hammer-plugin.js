var BanHammerPlugin = function(app, config, io, client) {

  var xmpp = require('node-xmpp-client');

  var rateSeconds = 30;
  var messageLimit = 20;
  var warnDurationSeconds = 60 * 10;
  var banDurationSeconds = 60;

  // maintains 
  var spamBank = {};
  setInterval(function() {
    for (key in spamBank) {
      var value = spamBank[key];
      for (var i = value.length - 1; i >= 0; --i) {
        if (value[i] < Math.floor(Date.now() / 1000)) {
          value.splice(i, 1);
          console.log('Spam bank reduced to ' + value.length + ' for ' + key);
        }
      }
    }
  }, 1000);

  var spamWarn = {};
  setInterval(function() {
    for (key in spamWarn) {
      if (spamWarn[key].time + warnDurationSeconds < Math.floor(Date.now() / 1000)) {
        if (spamWarn[key].count === 0) {
          // expire the warning
          delete spamWarn[key];
          console.log('Expired spam warning for ' + key);

        } else {
          // reduce the warning level
          spamWarn[key].count -= 1;
          // re-up the timestamp
          spamWarn[key].time = Math.floor(Date.now() / 1000);
          console.log('Spam warning level reduced to ' + spamWarn[key].count + ' for ' + key);
        }
      }
    }
  }, 1000);

  var banBank = {};
  setInterval(function() {
    for (key in banBank) {
      if (banBank[key].time < Math.floor(Date.now() / 1000)) {
        // expire the ban
        delete banBank[key];
        console.log('Ban lifted from ' + key);
      }
    }
  });

  client.on('stanza', function(data) {

    if (data.is('presence')) {

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

          if (banBank[data.attrs.from]) {
            var remaining = banBank[data.attrs.from].time - (Math.floor(Date.now() / 1000));
            kick(data.attrs.from.split('/')[1], 'You\'re still banned for: ' + remaining + ' more seconds.');
          }

        }
      }

    } else if (data.is('message')) {

      if (banBank[data.attrs.from]) {
        return;
      }

      if (data.getChild('delay')) {
        // this is most likely room history

      } else if (data.attrs.from == config.room + '/' + config.nick) {
        // we sent this message
        //console.log(JSON.stringify(data, null, 2));
        data.who = 'self';
        handleMessage(data);

      } else {
        // if there's a record, add to it, otherwise make a new one
        if (spamBank[data.attrs.from]) {
          spamBank[data.attrs.from].push(Math.floor(Date.now() / 1000) + rateSeconds);
        } else {
          spamBank[data.attrs.from] = [ Math.floor(Date.now() / 1000) + rateSeconds ];
        }

        if (spamBank[data.attrs.from].length > messageLimit) {
          var nick = data.attrs.from.split('/')[1];

          if (!spamWarn[data.attrs.from]) {
            // hasn't been warned
            client.sendGroupchat('@' + nick + ': Please don\'t spam the channel, thanks! :)');
            spamWarn[data.attrs.from] = {
              time: Math.floor(Date.now() / 1000) + warnDurationSeconds,
              count: 0
            };
            spamBank[data.attrs.from] = [ Math.floor(Date.now() / 1000) + rateSeconds];

          } else {
            // has been warned
            var warnCount = spamWarn[data.attrs.from].count;
            var duration = banDurationSeconds * (Math.pow(10, warnCount)); // * 1, 10, 100 minutes
            var message = '@' + nick + ': You were warned. Please make a deposit in the spam bank and come back when you\'ve calmed down a bit. (' + duration +' seconds)';
            client.sendGroupchat(message);
            spamWarn[data.attrs.from] = {
              time: Math.floor(Date.now() / 1000) + warnDurationSeconds,
              count: warnCount + 1
            };
            banBank[data.attrs.from] = {
              time: Math.floor(Date.now() / 1000) + duration,
              duration: duration
            };
            console.log('Banned ' + data.attrs.from + ' for ' + duration + ' seconds');
            setTimeout(function() {
              kick(data.attrs.from.split('/')[1], 'spamming');
            }, 3000);
          }
        }
        console.log('spam: ' + data.attrs.from + ' => ' + spamBank[data.attrs.from].length);
      }

    }

  });

  var handleMessage = function(data) {

    var message = data.getChildText('body');

    if (message.indexOf('!kick') === 0) {

      var split = message.split(' ');
      var nick = split[1];
      var reason = '';
      if (split.length > 2) {
        reason = split.slice(2).join(' ');
      }
      kick(nick, reason);

    } else if (message.indexOf('!ban') === 0) {

      var split = message.split(' ');
      var nick = split[1];
      var reason = '';
      if (split.length > 2) {
        reason = split.slice(2).join(' ');
      }
      ban(nick, reason);

    } else if (message.indexOf('!uban') === 0) {

      var split = message.split(' ');
      var nick = split[1];
      unban(nick);

    } else if (message.indexOf('!tban') === 0) {

      var split = message.split(' ');
      var nick = split[1];
      var seconds = split[2];
      var reason = '';
      if (split.length > 3) {
        reason = split.slice(3).join(' ');
      }

      ban(nick, reason);
    }

  };

  var kick = function(nick, reason) {
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

    console.log(JSON.stringify(stanza.root(), null, 2));

    client.send(stanza);
  };

  var temporaryBan = function(nick, timeSeconds, reason) {

    var reason = 'You have been banned for ' + timeSeconds + ' seconds because: ' + reason;

    ban(nick, reason);
    setTimeout(function() {
      unban(nick);
    }, timeSeconds * 1000);

    // TODO: persist temporary ban?

  };

  var unban = function(nick) {
    var stanza = new xmpp.Stanza('iq', {
      from: config.session.local + '@' + config.session.domain + '/' + config.session.resource,
      id: 'ban3',
      to: config.room,
      type: 'set'
    })
    .c('query', { xmlns: 'http://jabber.org/protocol/muc#admin' })
    .c('item', { affiliation: 'none', jid: nick + '@' + config.connection.jid.split('/')[1] });

    //console.log(JSON.stringify(stanza.root(), null, 2));

    // TODO: persist unban

    client.send(stanza);
  };

  var ban = function(nick, reason) {

    var stanza = new xmpp.Stanza('iq', {
      from: config.session.local + '@' + config.session.domain + '/' + config.session.resource,
      id: 'ban1',
      to: config.room,
      type: 'set'
    })
    .c('query', { xmlns: 'http://jabber.org/protocol/muc#admin' })
    .c('item', { affiliation: 'outcast', jid: nick + '@' + config.connection.jid.split('/')[1] });
    if (reason) {
      stanza.c('reason').t(reason);
    }

    //console.log(JSON.stringify(stanza.root(), null, 2));

    // TODO: persist ban

    client.send(stanza);
  };

}

module.exports = BanHammerPlugin;