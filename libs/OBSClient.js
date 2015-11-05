var OBSClient = function(config, postOnlineCallback) {
  
  // set up the remote
  var OBSRemote = require('obs-remote');
  var obs = new OBSRemote();

  obs.onAuthenticationFailed = function(data) {
    console.log('Authentication to OBSRemote failed: ' + data);
  };
  obs.onAuthenticationSucceeded = function() {
    obs.getCurrentScene(function(data) {
      //console.log(JSON.stringify(data, null, 2));
      if (postOnlineCallback) {
        postOnlineCallback();
      }
    });
  };
  obs.connect(config.obsRemote.host, config.obsRemote.password);

  return obs;
};

module.exports = OBSClient;