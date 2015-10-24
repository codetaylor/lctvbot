var Util = function() {
  
  var pub = {};

  pub.getNickFrom = function(from) {
    return from.split('/')[1];
  };

  pub.isOperator = function(nick, config) {
    var ops = config.operators;
    for (var i = 0; i < ops.length; ++i) {
      if (ops[i] == nick) {
        return true;
      }
    }
    return false;
  };

  // http://stackoverflow.com/questions/5539028/converting-seconds-into-hhmmss/5539081#5539081
  pub.toHHMMSS = function (data) {
    var d = parseInt(data, 10); // don't forget the second param
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s); 
  };

  pub.getTimestamp = function() {
    return Math.floor(Date.now() / 1000);
  };

  return pub;

};

module.exports = Util();