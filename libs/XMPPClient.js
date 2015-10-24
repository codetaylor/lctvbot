module.exports = function(config, postOnlineCallback) {

  var XMPP = require('node-xmpp-client');
  var client = new XMPP.Client({
    jid:        config.connection.jid,
    password:   config.connection.password,
    transport:  config.connection.transport,
    wsURL:      config.connection.wsURL
  });

  var proxy = false;
  if (config.proxy) {
    proxy = new XMPP.Client({
      jid:        config.proxy.jid,
      password:   config.proxy.password,
      transport:  config.proxy.transport,
      wsURL:      config.proxy.wsURL
    });

    proxy.connection.socket.setTimeout(0);
    proxy.connection.socket.setKeepAlive(true, 10000);

    proxy.on('online', function(data) {
    
      console.log('Proxied as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource);

      // send initial presence
      proxy.send(new XMPP.Stanza('presence', { type: 'available' }));

      proxy.send(new XMPP.Stanza('presence', { to: config.room + '/' + config.proxy.nick })
        .c('x', { xmlns: 'http://jabber.org/protocol/muc' })
        .c('history', { maxchars: 0 })
      );
    });

    client.proxy = proxy;
  }

  client.connection.socket.setTimeout(0);
  client.connection.socket.setKeepAlive(true, 10000);

  client.on('stanza', function(data) {
    // console.log(JSON.stringify(data, null, 2));
  });

  client.on('error', function(data) {
    console.log(JSON.stringify(data, null, 2));
  });

  client.on('online', function(data) {
    
    config.session = data.jid;
    console.log('Connected as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource);

    // send initial presence
    client.send(new XMPP.Stanza('presence', { type: 'available' }));

    client.send(new XMPP.Stanza('presence', { to: config.room + '/' + config.nick })
      .c('x', { xmlns: 'http://jabber.org/protocol/muc' })
      .c('history', { maxchars: 0 })
    );

    if (postOnlineCallback) {
      postOnlineCallback();
    }

  });

  client.sendGroupchat = function(message) {
    if (proxy) {
      proxy.send(new XMPP.Stanza('message', { to: config.room, type: 'groupchat' })
        .c('body').t(message)
      );
    } else {
      client.send(new XMPP.Stanza('message', { to: config.room, type: 'groupchat' })
        .c('body').t(message)
      );
    }
  };

  client.sendGroupchatAsSelf = function(message) {
    client.send(new XMPP.Stanza('message', { to: config.room, type: 'groupchat' })
      .c('body').t(message)
    );
  };

  client.sendChat = function(to, message) {
    // doesn't work
    client.send(new XMPP.Stanza('message', { to: config.session.domain + '/' + to, type: 'groupchat' })
      .c('body').t(message)
    );
  };

  return client;
};