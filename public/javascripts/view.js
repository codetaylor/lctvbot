$(document).ready(function() {
  var socket = io();
  var m_id = 0;
  var queue = [];
  var duration = "+=10.0";
  var popout = false;

  setInterval(function() {
    var data = queue.shift();
    if (data) {
      var id = getId(data.from);
      var html = tmpl('message_popup_tmpl', {
        id: m_id, 
        style: data.style + ' ' + data.from.split('/')[1],
        icon: data.image_url, 
        user: id.user, 
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
    if (data.type == 'groupchat') {
      queue.push(data);
    }
  });
  socket.on('available', function(data) {
    //console.log('muc:available: ');
    //console.log(data);
    data.style = 'joined';
    data.body = 'joined the channel';
    queue.push(data);
  });
  socket.on('unavailable', function(data) {
    //console.log('muc:unavailable: ');
    //console.log(data);
    data.style = 'left';
    data.body = 'left the channel';
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

  var getId = function(to_split) {
    var from_split = to_split.split('/');
    return {
      room: from_split[0],
      user: from_split[1]
    }
  };
});
