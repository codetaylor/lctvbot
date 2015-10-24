var util = require('util');
var readline = require('readline');
var EventEmitter = require('events').EventEmitter;

var CLI = function() {

  var _self = this;

  process.stdout.write('\x1Bc');

  var rl = readline.createInterface(process.stdin, process.stdout);

  rl.setPrompt('> ', 2);
  rl.prompt(true);

  rl.on('line', function(line) {
    if (line.indexOf('!') === 0) {
      _self.emit('command', line);
    } else {
      _self.emit('message', line);
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

module.exports = CLI;