module.exports = function(app) {
  app.get('/', function(req, res) {
    var path = require('path');
    res.sendFile(path.join(app.get('views'), '/index.html'));
  });
}