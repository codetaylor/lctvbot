var ViewController = function(app) {
  app.get('io').on('connection', function(socket) {
    socket.join(app.get('config').room);
  });

  app.get('/view', function(req, res) {
    var path = require('path');
    res.sendFile(path.join(app.get('views'), '/view.html'));
  });
};

module.exports = ViewController;
