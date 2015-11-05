var util = require('util');
var readline = require('readline');
var EventEmitter = require('events').EventEmitter;
var mkdirp = require('mkdirp');
var fs = require('fs');

var CLI = function() {

  var _self = this;

  mkdirp.sync('./logs', function(err) {
    if (err) {
      console.error(err);
    }
  });

  this.currentDay = false;
  this.logFile = false;

  var getLogFile = function(date) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();

    month = month < 10 ? '0' + month : '' + month;
    day = day < 10 ? '0' + day : '' + day;
    return year + '_' + month + '_' + day + '.log';
  };

  var assertLogFile = function() {
    var date = new Date();
    if (_self.currentDay !== date.getDate()) {
      _self.currentDay = date.getDate();
      if (_self.logFile) {
        _self.logFile.end();
      }
      var lf = getLogFile(date);
      _self.logFile = fs.createWriteStream('./logs/' + lf, { flags: 'a' });
    }
  };

  process.stdout.write('\x1Bc');

  var rl = readline.createInterface(process.stdin, process.stdout);

  rl.setPrompt('> ', 2);
  rl.prompt(true);

  rl.on('line', function(line) {
    line = line.trim();
    if (line) {
      if (line.indexOf('!') === 0) {
        _self.emit('command', line);
      } else {
        _self.emit('message', line);
      }
    } else {
      console.log('--------------------------------------------------');
    }
    rl.prompt(true);
  });

  rl.on('exit', function() {
    console.log('Exiting...');
    process.exit(0);
  });

  var _console = function(type, args) {
    var t = Math.ceil((rl.line.length + 3) / process.stdout.columns);
    var text = util.format.apply(console, args);

    assertLogFile();
    _self.logFile.write(text + '\n');

    rl.output.write('\n\x1B[' + t + 'A\x1B[0J');
    rl.output.write(text + '\n');
    rl.output.write(Array(t).join('\n\x1B[E'));
    rl._refreshLine();
  };

  console.log = function() {
    _console('log', arguments);
  };
  console.warn = function() {
    _console('warn', arguments);
  };
  console.info = function() {
    _console('info', arguments);
  };
  console.error = function() {
    _console('error', arguments);
  };

};

util.inherits(CLI, EventEmitter);

CLI.prototype.end = function() {
  if (this.logFile) {
    this.logFile.end();
  }
};

module.exports = CLI;