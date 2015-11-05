var XMPP = require('node-xmpp-client');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var XMPPClient = function(config) {
  this.config = config;
  this.client = false;
  this.proxy = false;

  this.setMaxListeners(20);
};

util.inherits(XMPPClient, EventEmitter);

XMPPClient.prototype.connect = function(callback) {
  var _self = this;
  this.client = new XMPP.Client({
    jid:        this.config.connection.jid,
    password:   this.config.connection.password,
    transport:  this.config.connection.transport,
    wsURL:      this.config.connection.wsURL
  });

  this.proxy = false;
  if (this.config.proxy) {
    this.proxy = new XMPP.Client({
      jid:        this.config.proxy.jid,
      password:   this.config.proxy.password,
      transport:  this.config.proxy.transport,
      wsURL:      this.config.proxy.wsURL
    });

    this.proxy.connection.socket.setTimeout(0);
    this.proxy.connection.socket.setKeepAlive(true, 10000);

    this.proxy.on('online', function(data) {
    
      console.log('Proxied as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource);

      // send initial presence
      _self.proxy.send(new XMPP.Stanza('presence', { type: 'available' }));

      _self.proxy.send(new XMPP.Stanza('presence', { to: _self.config.room + '/' + _self.config.proxy.nick })
        .c('x', { xmlns: 'http://jabber.org/protocol/muc' })
        .c('history', { maxchars: 0 })
      );
    });

    this.client.proxy = this.proxy; // used during cleanup
  }

  this.client.connection.socket.setTimeout(0);
  this.client.connection.socket.setKeepAlive(true, 10000);

  this.client.on('stanza', function(data) {
    //console.log(JSON.stringify(data, null, 2));
    _self.emit('stanza', data);
  });

  this.client.on('error', function(data) {
    console.log(JSON.stringify(data, null, 2));
  });

  this.client.on('online', function(data) {
    
    _self.config.session = data.jid;
    console.log('Connected as ' + data.jid.user + '@' + data.jid.domain + '/' + data.jid.resource);

    // send initial presence
    _self.client.send(new XMPP.Stanza('presence', { type: 'available' }));

    _self.client.send(new XMPP.Stanza('presence', { to: _self.config.room + '/' + _self.config.nick })
      .c('x', { xmlns: 'http://jabber.org/protocol/muc' })
      .c('history', { maxchars: 0 })
    );

    if (callback) {
      callback();
    }

  });
};

XMPPClient.prototype.send = function(stanza) {
  this.client.send(stanza);
};

XMPPClient.prototype.sendGroupchat = function(message, asSelf) {
  if (this.proxy && !asSelf) {
    this.proxy.send(new XMPP.Stanza('message', { to: this.config.room, type: 'groupchat' })
      .c('body').t(message)
    );
  } else {
    this.client.send(new XMPP.Stanza('message', { to: this.config.room, type: 'groupchat' })
      .c('body').t(message)
    );
  }
};

XMPPClient.prototype.end = function() {
  this.client.end();
  if (this.proxy) {
    this.proxy.end();
  }
};

module.exports = XMPPClient;