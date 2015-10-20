var ClientViewPlugin = function(app, config, io, client) {

  // holds user image filenames in memory
  var image_cache = {};

  // pipes the room joins/leaves and messages to io

  client.on('online', function(data) {
    //console.log('session:started');
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
          // handlePresence(data);

        } else if (split.length > 1 && split[0] == config.connection.jid) {
          // we sent this

        } else {
          // someone else joined/left the room we're in
          //console.log(JSON.stringify(data, null, 2));
          handlePresence(data);

        }
      }

    } else if (data.is('message')) {

      if (data.getChild('delay')) {
        // this is most likely room history

      } else if (data.attrs.from == config.room + '/' + config.nick) {
        // we sent this message
        //console.log(JSON.stringify(data, null, 2));
        handleMessage(data);

      } else {
        // someone else sent this message
        //console.log(JSON.stringify(data, null, 2));
        handleMessage(data);
      }

    } else {
      //console.log(JSON.stringify(data, null, 2));
    }
  });

  var handleMessage = function(data) {

    // console.log('Message: ');
    // console.log(data);

    var body = data.getChildText('body');
    var isSelf = data.attrs.from == config.room + '/' + config.nick;


    if (isSelf && body.indexOf('!') === 0) {
      // if the message is from an op and command


    } else if (body.indexOf('!') === 0) { // is general user

      var filename = require('path').join(app.get('configPath'), 'popout.json');
      var popoutCommands = JSON.parse(require('fs').readFileSync(filename));

      // loop through the popout commands
      for (var k in popoutCommands) {

        if (popoutCommands.hasOwnProperty(k)) {

          if (body.indexOf(k) === 0) {
            var message = popoutCommands[k].message;
            
            if (message) {
              // if the message is an array, pick a random one
              if (message.constructor === Array) {
                message = message[Math.floor(Math.random() * message.length)];
              }
              
              // overwrites default message if caller supplies a message after the command
              /*if (body.length > k.length) {
                message = body.substring(k.length).trim();
              }*/
            }

            // send the popout command to the view
            io.sockets.in(config.room).emit('sk3lls:popout', {
              image: popoutCommands[k].image,
              message: message,
              offset: popoutCommands[k].bubble_position
            });

          }
        }
      }

    } else if (body.indexOf('!') !== 0) { // is not ! command
      // get the user's image, send the message command to the view
      getUserImage(data.attrs.from.split('/')[1], function (image_url) {
        io.sockets.in(config.room).emit('message', {
          from: data.attrs.from,
          to: data.attrs.to,
          op: isSelf,
          type: data.attrs.type,
          body: body,
          image_url: image_url
        });
      });
    }
  };

  var handlePresence = function(data) {

    var body = data.getChildText('body');
    var isSelf = data.attrs.from == config.room + '/' + config.nick;

    if (data.attrs.type == 'unavailable') {
      console.log('unavailable');
      getUserImage(data.attrs.from.split('/')[1], function(image_url) {
        io.sockets.in(config.room).emit('unavailable', {
          from: data.attrs.from,
          to: data.attrs.to,
          op: isSelf,
          type: data.attrs.type,
          body: body,
          image_url: image_url
        });
      });

    } else {
      console.log('available');
      getUserImage(data.attrs.from.split('/')[1], function(image_url) {
        io.sockets.in(config.room).emit('available', {
          from: data.attrs.from,
          to: data.attrs.to,
          op: isSelf,
          type: data.attrs.type,
          body: body,
          image_url: image_url
        });
      });

    }
  };

  var getUserImage = function(username, callback) {
    if (image_cache[username]) {
      if (callback) {
        callback(image_cache[username]);
      }
      return;
    }
    var request = require('request');
    var cheerio = require('cheerio');
    var url = 'https://www.livecoding.tv/' + username;
    request(url, function(err, resp, body) {
      $ = cheerio.load(body);
      var src = $('div.stream-title--image img').attr('src');
      url = 'https://www.livecoding.tv' + src;
      image_cache[username] = url;
      if (callback) {
        callback(url);
      }
    });
  };
  
};

module.exports = ClientViewPlugin;