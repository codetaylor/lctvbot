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

  return pub;

};

module.exports = Util();