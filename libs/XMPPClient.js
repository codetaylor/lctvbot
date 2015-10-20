module.exports = function(config) {

  var XMPP = require('node-xmpp-client');
  var client = new XMPP.Client({
    jid:        config.connection.jid,
    password:   config.connection.password,
    transport:  config.connection.transport,
    wsURL:      config.connection.wsURL
  });

  client.connection.socket.setTimeout(0);
  client.connection.socket.setKeepAlive(true, 10000);

  client.on('stanza', function(data) {
    //console.log(JSON.stringify(data, null, 2));
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
    );

  });

  client.sendGroupchat = function(message) {
    client.send(new XMPP.Stanza('message', { to: config.room, type: 'groupchat' })
      .c('body').t(message)
    );
  };

  client.sendChat = function(to, message) {
    client.send(new XMPP.Stanza('message', { to: config.room + '/' + to, type: 'groupchat' })
      .c('body').t(message)
    );
  };

  return client;
};