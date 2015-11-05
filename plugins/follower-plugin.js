var FollowerPlugin = function(params) {

  var app = params.app;
  var config = params.config;
  var io = params.io;
  var client = params.client;
  
  var storage = require('node-persist');
  var feed = require('feed-read');

  var update = function() {
    feed(config.followerFeedURL, function(err, articles) {
      if (err) throw err;

      //console.log(JSON.stringify(articles, null, 1));

      var newFollowers = [];
      var dirty = false;
      var firstLoad = false;

      // get the stored follower list
      var followers = storage.getItem('followers');
      if (!followers) {
        followers = {};
        dirty = true;
        firstLoad = true;
      }

      var users = false;
      for (var i = 0; i < articles.length; ++i) {
        var article = articles[i];
        var nick = article['title'].toLowerCase();

        // if we don't have the nick stored as a follower, store it
        if (!followers[nick]) {
          if (!users) {
            users = storage.getItem('users');
          }
          followers[nick] = {
            timestamp: getTimestamp()
          };
          newFollowers.push(nick);

          var user = users[config.room + '/' + nick];
          if (!user) {
            user = users[config.room + '/' + nick] = {
              nick: nick,
              visits: 0,
              follower: false,
              founder: false,
              greeting: true,
              role: '',
              affiliation: '',
              donations: 0
            };
          }

          user.follower = true;
          dirty = true;
        }
      }

      if (dirty) {
        storage.setItem('followers', followers);
        storage.setItem('users', users);
      }

      if (!firstLoad) {
        for (var i = 0; i < newFollowers.length; ++i) {
          console.log('New follower: ' + newFollowers[i]);
          client.sendGroupchat('Thanks for following, ' + newFollowers[i] + '!');
          // do something cool for new followers!
          io.sockets.in(config.room).emit('sk3lls:new_follower', {
            nick: newFollowers[i]
          });
        }
      }
    });
  };

  var getTimestamp = function() {
    return Math.floor(Date.now() / 1000);
  };

  //http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
  var fromTimestamp = function(timestamp) {
    var a = new Date(timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }

  update();
  setInterval(function() {
    update();
  }, 5000);
  
};

module.exports = FollowerPlugin;