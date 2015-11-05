var postConnectDelaySeconds = 5;

var CLI = require('./libs/CLI');
var cli = new CLI();

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
var mkdirp = require('mkdirp');
var backup = require('backup');
var Util = require('./libs/Util');

// backup ---------------------------------------------------------------------

try {
  var filename = './backup/backup-' + Util.getTimestamp() + '.gz';
  mkdirp.sync('./backup');
  backup.backup('./persist', filename);
  console.log('Created backup: ' + filename);
} catch (err) {
  console.error(err);
}

// ----------------------------------------------------------------------------

var immediatePlugins = [
  'follower-plugin',
  'user-plugin'
];

var plugins = [
  'client-view-plugin',
  'ban-hammer-plugin',
  'rules-plugin',
  'greeting-plugin',
  'commands-plugin',
  'task-plugin',
  'focus-plugin',
  'obs-plugin',
  'cli-plugin',
  'faq-plugin'
];

var storage = require('node-persist');
storage.initSync();
var settings = storage.getItem('settings') || {
  // default settings
  greeting: true
};
storage.setItem('settings', settings);

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
var XMPPClient = require('./libs/XMPPClient');
var client = new XMPPClient(config);

client.connect(function() {
  console.log('Delay loading plugins for ' + postConnectDelaySeconds + ' seconds...');
  var params = {
    app: app,
    config: config,
    io: io,
    client: client,
    cli: cli
  };
  var success = 0;
  for (var i = 0; i < immediatePlugins.length; ++i) {
    try {
      require('./plugins/' + immediatePlugins[i])(params);
      ++success;
      console.log('Loaded plugin: ' + immediatePlugins[i]);
    } catch (e) {
      console.log(e.stack);
    }
  }
  console.log('Successfully loaded ' + success + '/' + immediatePlugins.length + ' immediate plugins');
  setTimeout(function() {
    var success = 0;
    for (var i = 0; i < plugins.length; ++i) {
      try {
        require('./plugins/' + plugins[i])(params);
        ++success;
        console.log('Loaded plugin: ' + plugins[i]);
      } catch (e) {
        console.log(e.stack);
      }
    }
    console.log('Successfully loaded ' + success + '/' + plugins.length + ' delayed plugins');
    //client.sendGroupchat('- sk3lls v1.0 online -');
  }, postConnectDelaySeconds * 1000);
});

// controllers
require('./controllers/view')(app);
require('./controllers/control')(app);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
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

var cleanup = false;
app.exitHandler = function(opts, err) {
  if (!cleanup) {
    cleanup = true;
    if (opts.cleanup) {
      console.log('Cleanup...');
      //client.sendGroupchat(' - offline -');
      client.end();
      cli.end();
    }
    if (err) console.log(err.stack);
    if (opts.exit) process.exit();
  }
};

process.on('exit', app.exitHandler.bind(null, { cleanup:true }));
process.on('SIGINT', app.exitHandler.bind(null, { cleanup: true, exit: true }));
process.on('uncaughtException', app.exitHandler.bind(null, { exit: true }));

cli.on('command', function(command) {
  if (command.indexOf('!exit') === 0) {
    process.exit();
  }
});

module.exports = app;
