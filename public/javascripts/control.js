$(document).ready(function() {
  var socket = io();

  $('#focus .minutes input').knob({
    min: 1,
    max: 59,
    width: 64,
    fgColor: '#3AAACF',
    bgColor: '#024E68'
  });

  $('#focus-start').click(function() {
    socket.emit('control:focus-start', {
      minutes: $('#focus .minutes input').val()
    });
  });

  $('#focus-stop').click(function() {
    socket.emit('control:focus-stop', {});
  });

  $('#task-set').click(function() {
    setTask();
  });

  $('#task input').keydown(function(e) {
    if (e.keyCode === 13) {
      setTask();
    }
  });

  $('#task-clear').click(function() {
    socket.emit('control:task-clear', {});
  });

  var setTask = function() {
    socket.emit('control:task-set', {
      task: $('#task input').val()
    });
    $('#task input').val('');
  };

});