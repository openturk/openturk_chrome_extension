var OT = {
  init: function() {
    OT.status.container = $('header.sub');
    OT.status.container2 = $('header.sub2');

    OT.get_worker_id();
    OT.get_openturk_username();

    $('#creds button.save').click(function(e) {
      e.preventDefault();
      OT.creds.save();
    })
    $('#creds button.remove').click(function(e) {
      e.preventDefault();
      OT.creds.remove();
    })
    $('#post button').click(function(e) {
      e.preventDefault();
      OT.api.post();
    })
    $('header.sub a').on('click', function() {
      chrome.windows.getCurrent(null, function(window) {
        if (window.type == 'popup') {
          chrome.windows.remove(window.id);
        }
      });
    });
    $('.hint a').click(function(e) {
      e.preventDefault();
      var $input = $('#tags');
      var tags = $input.val().split(',');

      if (tags.indexOf('tmp') != -1) {
        tags.splice(tags.indexOf('tmp'), 1);
      } else {
        tags.push('tmp');
      }
      var results = new Array();
      for (k in tags)
        if (tags[k]) results.push(tags[k])

      $input.val(results.join(','));
    });
    $('#title').focus();
  },

  creds: {
    populate: function() {
      if (localStorage.getItem('validated') == 'true') {
        $('form #username').val(localStorage.getItem('username'));
        $('form #key').val(localStorage.getItem('api_key'));
      }
    },

    remove: function() {
      localStorage.removeItem('username');
      localStorage.removeItem('api_key');
      localStorage.setItem('validated', 'false');
      $('form #username').val('');
      $('form #key').val('');
      OT.message.set('success', 'Credentials removed');
    },

    save: function() {
      var username = $('#username').val();
      var api_key = $('#key').val();

      var url = OT.api.base_url + '?username=' + username + '&api_key=' + api_key

      $.ajax({
        type: 'GET',
        url: url,
        dataType: 'jsonp',
        success: function(data) {
          localStorage.setItem('username', username);
          localStorage.setItem('api_key', api_key);
          localStorage.setItem('validated', 'true');
          OT.message.set('success', 'Credentials saved');
          OT.switch_content();
        },
        error: function(xhr, status) {
          localStorage.removeItem('username');
          localStorage.removeItem('api_key');
          localStorage.setItem('validated', 'false');
          OT.message.set('error', 'Bad credentials');
        }
      });
    },
  },

  message: {
    set: function(status, message) {
      var bar = OT.status.container;

      bar.removeClass('error success');
      if (status != null) {
        bar.addClass(status);
      }
      bar.html(message);
    }
  },

  message2: {
    set: function(status, message) {
      var bar = OT.status.container2;

      bar.removeClass('error success');
      if (status != null) {
        bar.addClass(status);
      }
      bar.html(message);
    }
  },

  switch_content: function() {
    $('#content').show();
    $('#login').hide();
    $('#load').hide();
  },
  switch_login: function() {
    $('#content').hide();
    $('#login').show();
    $('#load').hide();
  },
  switch_loading: function() {
    $('#content').hide();
    $('#login').hide();
    $('#load').show();
  },

  get_worker_id: function() {
    $.ajax({
      url: 'https://workersandbox.mturk.com/mturk/dashboard',
      success: function(result) {
        var spanText = $(result).filter("table").find("span:contains('Worker ID')").text();
        var workerIdPattern = /Worker ID: (.*)$/;
        var workerId = spanText.match(workerIdPattern)[1];
        OT.status.workerId = workerId;
        localStorage.setItem('workerId', workerId);
        localStorage.setItem('validated', 'true');
        OT.message.set('success', 'Welcome ' + workerId);
        OT.switch_content();
      },
      error: function(xhr, status) {
        localStorage.removeItem('workerId');
        localStorage.setItem('validated', 'false');
        OT.message.set('error', 'You are not logged in Amazon Mechanical Turk');
        OT.switch_login();
      }
    });
  },

  get_openturk_username: function() {
    var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
      if (typeof result.username !== "undefined") {
        OT.status.openturk_username = result.username;
        OT.message2.set('success', 'Welcome ' + result.username);
        OT.switch_content();
      } else {
        OT.message2.set('error', 'Please log in on <a href="http://alpha.openturk.com/accounts/login/">OpenTurk.com</a>');
        OT.switch_login();
      }
    });
  },

  status: {
    workerId: '',
    openturk_username: '',
    container: {}
  }
};



function appendRequester(url) {
  var $li = $('<li><a href="https://workersandbox.mturk.com/mturk/searchbar?selectedSearchType=hitgroups&requesterId=' + url['id'] + '&qualifiedFor=on"> <span class="url">' + url['name'] + '</span></a> <span>' + url['numtask'] + '</span></li>');
  $('#urls').append($li);
}

var obj = {};
var index = {};

function loadUIRequesters() {
  chrome.storage.sync.get('requesters', function(items) {
    obj = items;
    obj.requesters.forEach(function(url) {
      //console.log(url);
      appendRequester(url);
    });
    indexRequesters();
  });

}

function indexRequesters() {
  $(obj.requesters).each(function() {
    index[this.id] = this;
  });
}

$(document).ready(function() {
  OT.init();
  //console.log('loading stuff');
  loadUIRequesters();
  chrome.extension.sendMessage({
    read: "resetIcon"
  });
});



function get_worker_stats(callback) {
  $.get('https://workersandbox.mturk.com/mturk/dashboard', {}, function(data) {
    var rewards = $(data).find('.reward');
    var approval_rate = $(data).filter("table").find("td.metrics-table-first-value:contains('... Approved')").next().next().text();
    var balance = {
      approved_hits: $(rewards[0]).html(),
      bonuses: $(rewards[1]).html(),
      total_earnings: $(rewards[2]).html(),
      approval_rate: approval_rate
    }
    localStorage.setItem('balance', balance);
    callback(balance);
  });
}
get_worker_stats(function(){});
