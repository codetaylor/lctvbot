var OBSClient = function(config, postOnlineCallback) {
  
  // set up the remote
  var OBSRemote = require('obs-remote');
  var obs = new OBSRemote();

  obs.onConnectionOpened = function() {
    console.log('Connection to OBSRemote open');
  };
  obs.onConnectionClosed = function() {
    console.log('Connection to OBSRemote closed');
  };
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
  obs.onSceneSwitched = function() {
    console.log('Scene switched');
  };
  obs.connect(config.obsRemote.host, config.obsRemote.password);

  return obs;
};

module.exports = OBSClient;