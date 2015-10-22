var UserImage = function() {
  
  var pub = {};

  // in memory image url cache
  var image_cache = {};

  pub.get = function(nick, callback) {
    if (image_cache[nick]) {
      if (callback) {
        callback(image_cache[nick]);
      }
      return;
    }
    var request = require('request');
    var cheerio = require('cheerio');
    var url = 'https://www.livecoding.tv/' + nick;
    request(url, function(err, resp, body) {
      $ = cheerio.load(body);
      var src = $('div.stream-title--image img').attr('src');
      url = 'https://www.livecoding.tv' + src;
      image_cache[nick] = url;
      if (callback) {
        callback(url);
      }
    });
  };

  return pub;
  
};

module.exports = UserImage();