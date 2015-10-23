$(document).ready(function() {
  var socket = io();
  var m_id = 0;
  var queue = [];
  var duration = "+=1000.0";
  var popout = false;
  var timerHandle;
  var buzzerHandle = 0;

  setInterval(function() {
    var data = queue.shift();
    if (data) {
      var founder = data.user.founder ? ' founder' : '';
      var id = getId(data.from);
      var html = tmpl('message_popup_tmpl', {
        id: m_id, 
        style: data.style + ' ' + data.user.nick + founder,
        icon: data.image_url, 
        user: data.user, 
        message: data.body 
      });
      $('#list').append(html);
      var element = $('#message_' + (m_id++))[0];
      var tl = new TimelineLite();
      tl.to(element, 2.5, { maxHeight: "900px" });
      tl.to(element, 0.5, { right: "0px", opacity: 1 }, "-=2.0");
      tl.to(element, 10.0, { opacity: 0, onComplete: function() { element.remove(); } }, duration);
      tl.play();
    }
  }, 1000);

  socket.on('sk3lls:new_follower', function(data) {
    console.log(data);
    // TODO

  });
  socket.on('sk3lls:focus', function(data) {
    if (data.off) {
      // turn it off

      var element = $('.timer-wrapper')[0];
      if (element) {
        if (timerHandle) {
          clearInterval(timerHandle);
          timerHandle = 0;
        }
        // turn off the buzzer
        if (buzzerHandle) {
          clearInterval(buzzerHandle);
          buzzerHandle = 0;
        }
        // slide off screen and destroy
        var tl = new TimelineLite();
        tl.to(element, 0.5, { left: "-400px", onComplete: function() { element.remove(); }});
        tl.play();
      }

    } else {
      // turn it on for data.minutes

      // if not on:
      // create
      // slide onto screen
      var element = $('.timer-wrapper')[0];
      if (!element) {
        var html = tmpl('focus_tmpl', {});
        $('.wrapper').prepend(html);
        setupFocusTimer(data.minutes, 0.5);
        var element = $('.timer-wrapper')[0];
        var tl = new TimelineLite();
        tl.from(element, 0.5, { left: "-400px" });
        tl.play();
      }
      
    }
  });
  socket.on('sk3lls:task_set', function(data) {
    //console.log('task_set');
    //console.log(data);
    var element = $('.task')[0];
    var tl = new TimelineLite();
    tl.to(element, 0.5, { top: "-400px", onComplete: function() { $('.task .text-container').text('Current task: ' + data.task); } });
    tl.to(element, 0.5, { top: "0px" });
    tl.play();
  });
  socket.on('sk3lls:task_clear', function(data) {
    //console.log('task_clear');
    //console.log(data);
    var element = $('.task')[0];
    var tl = new TimelineLite();
    tl.to(element, 0.5, { top: "-400px", onComplete: function() { $('.task .text-container').text('Current task: - idle -'); } });
    tl.to(element, 0.5, { top: "0px" });
    tl.play();
  });
  socket.on('sk3lls:spammer', function(data) {
    console.log('Spammer: ' + JSON.stringify(data, null, 1));
    var nick = data.from.split('/')[1];
    $('.' + nick).each(function() {
      $(this).remove();
    });
    for (var i = queue.length - 1; i >= 0; --i) {
      if (queue[i].from == data.from) {
        queue.pop();
        //console.log('Removed message index ' + i);
      }
    }
  });
  socket.on('message', function(data) {
    //console.log('message: ');
    //console.log(data);
    getId(data.from);
    data.style = (data.op) ? 'op' : '';
    data.style += (data.user.follower) ? ' follower' : '';
    if (data.type == 'groupchat') {
      queue.push(data);
    }
  });
  socket.on('available', function(data) {
    //console.log('muc:available: ');
    console.log(data);
    data.style = 'joined';
    data.style += (data.user.follower) ? ' follower' : '';
    data.body = data.user.nick + ' joined the channel';
    queue.push(data);
  });
  socket.on('unavailable', function(data) {
    //console.log('muc:unavailable: ');
    console.log(data);
    data.style = 'left';
    data.style += (data.user.follower) ? ' follower' : '';
    data.body = data.user.nick + ' left the channel';
    queue.push(data);
  });
  socket.on('sk3lls:popout', function(data) {
    if (!popout) {
      popout = true;
      var html = tmpl('popout_tmpl', {
        image: data.image,
        message: data.message
      });
      $('.wrapper').prepend(html);
      if (data.offset) {
        if (data.offset.x) {
          $('.popout .popout-text-container').css('left', data.offset.x);
        }
        if (data.offset.y) {
          $('.popout .popout-text-container').css('top', data.offset.y);
        }
      }
      var element = $('.popout').get(0);
      var textElement = $('.popout .popout-text-container').get(0);
      var t = new TimelineLite();
      
      if (data.message) {
        t.from(element, 0.5, { left: -300, opacity: 0 });
        t.from(textElement, 0.5, { opacity: 0 });
        t.to(textElement, 0.5, { opacity: 0 }, '+=3');
        t.to(element, 0.5, { left: -300, opacity: 0, onComplete: function() { 
          element.remove(); popout = false 
        }});
      } else {
        t.from(element, 0.5, { left: -300, opacity: 0 });
        t.to(element, 0.5, { left: -300, opacity: 0, onComplete: function() { 
          element.remove(); popout = false 
        }}, '+=3');
      }
      t.play();
    }
  });

  var setupFocusTimer = function(minutes, volume) {

    var seconds = 59;
    //var minutes = 45; // variable
    minutes -= 1;

    $('.timer-seconds input').knob({
      min: 0,
      max: 60,
      displayInput: false,
      width: 44,
      fgColor: '#A65500',
      bgColor: '#111111',
      thickness: 0.175
    });

    $('.timer-minutes input').knob({
      min: 0,
      max: minutes,
      width: 64,
      fgColor: '#FF8300',
      bgColor: '#A65500',
      thickness: 0.2
    });

    $('.timer-seconds input').val(seconds);
    $('.timer-minutes input').val(minutes);
    timerHandle = setInterval(function() {
      --seconds;
      if (seconds < 0) {
        seconds = 59;
        --minutes;
        if (minutes < 0) {
          clearInterval(timerHandle); // stop the countdown
          // start the bell
          $('.timer-wrapper audio').prop('volume', volume);
          $('.timer-wrapper audio')[0].play();
          buzzerHandle = setInterval(function() {
            $('.timer-wrapper audio')[0].play();
          }, 10000);
          return;
        }
        $('.timer-minutes input').val(minutes).trigger('change');
      }
      $('.timer-seconds input').val(seconds).trigger('change');
    }, 1000);
  }

  var getId = function(to_split) {
    var from_split = to_split.split('/');
    return {
      room: from_split[0],
      user: from_split[1]
    }
  };
});
