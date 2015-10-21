var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var io = require('socket.io').listen(server);
var fs = require('fs');

app.set('env', 'development');
app.set('debug', true);
app.set('views', path.join(__dirname, 'views'));
app.set('io', io);

// get the config from disk
app.set('configPath', path.join(__dirname, 'config'));
var configFilename = path.join(app.get('configPath'), 'connection.json');
var config = JSON.parse(fs.readFileSync(configFilename));
app.set('config', config);

// use for rendering errors
app.set('view engine', 'jade');

// setup xmpp
var client = require('./libs/XMPPClient')(config, function() {
  setTimeout(function() {
    // libs
    require('./libs/client-view-plugin')(app, config, io, client);
    require('./libs/ban-hammer-plugin')(app, config, io, client);
    require('./libs/rules-plugin')(app, config, io, client);
    require('./libs/welcome-plugin')(app, config, io, client);
    require('./libs/commands-plugin')(app, config, io, client);
    require('./libs/task-plugin')(app, config, io, client);
    console.log('Plugins loaded');
    client.sendGroupchat('*bot* online');
  }, 5000);
});
app.set('client', client);

// controllers
require('./controllers/view')(app);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log(app.splash());
  console.log('      sk3lls is listening...');
  console.log('-----------------------------------');
});

app.splash = function() {
  return '      ,__   ________ .__ .__' + '\n' +
  '  ____|  | _\\_____  \\|  ||  |______' + '\n' +
  ' /  ___/ |/ / _(__  <|  ||  /  ___/' + '\n' +
  ' \\___ \\    <./    \\  \\  ||  \\___ \\' + '\n' +
  '/____  >_|__/______  /__||_/____  >' + '\n' +
  '     \\/            \\/           \\/';
};

process.stdin.resume();

app.exitHandler = function(opts, err) {
  if (opts.cleanup) {
    client.end();
  }
  if (err) console.log(err.stack);
  if (opts.exit) process.exit();
};

process.on('exit', app.exitHandler.bind(null, { cleanup:true }));
process.on('SIGINT', app.exitHandler.bind(null, { cleanup: true, exit: true }));
process.on('uncaughtException', app.exitHandler.bind(null, { exit: true }));

module.exports = app;
