var ControlController = function(app) {
  app.get('io').on('connection', function(socket) {
    socket.join(app.get('config').room);
  });

  app.get('/control', function(req, res) {
    var path = require('path');
    res.sendFile(path.join(app.get('views'), '/control.html'));
  });
};

module.exports = ControlController;
