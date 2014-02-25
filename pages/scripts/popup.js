var OT = {
  init: function() {
    OT.status.container = $('header.footer');

    OT.get_worker_id();
    OT.get_openturk_username();

    $('#save').click(function(e) {
      e.preventDefault();
      OT.creds.save();
    })
    $('#logout').click(function(e) {
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
      localStorage.removeItem('workerId');
      localStorage.removeItem('openturk_username');
      localStorage.setItem('validated', 'false');
      $('mturkusername').val('');
      $('mturkuser').val('');
      OT.get_worker_id();
    },

    save: function() {
      var username = $('#mturkusername').val();
      localStorage.setItem('workerId', username);
      localStorage.setItem('validated', 'true');
      OT.switch_content();
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
    $('#container').show();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').hide();
  },
  switch_login: function() {
    $('#container').hide();
    $('#login').show();
    $('#sign').hide();
    $('#spinner').hide();
  },
  switch_sign: function() {
    $('#container').hide();
    $('#login').hide();
    $('#sign').show();
    $('#spinner').hide();
  },
  switch_spinner: function() {
    $('#container').hide();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').show();
  },

  get_worker_id: function() {
    $.ajax({
      url: 'https://workersandbox.mturk.com/mturk/dashboard',
      success: function(result) {
        var spanText = $(result).filter("table").find("span:contains('Worker ID')").text();
        var workerIdPattern = /Worker ID: (.*)$/;
        var workerId = spanText.match(workerIdPattern);
        if (workerId == null) {
          OT.switch_sign();
        } else {
          workerId = workerId[1];
          console.log('adfa');
          OT.status.workerId = workerId;
          $('#mturkusername').html('MT:'+workerId);
          $('#mturkusername').html('MT:'+workerId);
          if (localStorage.getItem('validated') == 'true') {
            OT.switch_content();
          } else {
            OT.switch_login();
          }
        }
      },
      error: function(xhr, status) {
        console.log('you are not logged in MTURK');
        localStorage.removeItem('workerId');
        localStorage.setItem('validated', 'false');
        OT.switch_sign();
      }
    });
  },

  get_openturk_username: function() {
    var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
      if (typeof result.username !== "undefined") {
        OT.status.openturk_username = result.username;
        $('#openturkuser').html('OT:'+OT.status.openturk_username);
      } else {
        $('#openturkuser').html('connect to openturk');
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
  var feed = document.getElementById("feed");
  var row = document.createElement("tr");
  row.className = "link";
  var link_col = document.createElement("td");
  var identicon = document.createElement("td");
  var im = document.createElement("img");
  im.src = 'http://www.gravatar.com/avatar.php?gravatar_id=' + md5(url['id']) + '&r=PG&s=15&default=identicon';
  im.width = 15;
  im.height = 15;
  console.log(md5(url['id']));
  var title = document.createElement("a");
  title.className = "link_title";
  title.innerText = url['name'];
  title.href = 'https://workersandbox.mturk.com/mturk/searchbar?selectedSearchType=hitgroups&requesterId=' + url['id'] + '&qualifiedFor=on';
  var batchs = document.createElement("a");
  batchs.className = "batchs";
  batchs.innerText = "(" + url['numtask'] + " batchs)";
  batchs.href = url['numtask'];
  identicon.appendChild(im);
  link_col.appendChild(title);
  link_col.appendChild(batchs);
  row.appendChild(identicon);
  row.appendChild(link_col)
  feed.appendChild(row);
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

function setupEvents() {
  $('a#settings').click(function() {
    openSettings();
  });
}

function openSettings() {
  var settingsUrl = chrome.extension.getURL('/pages/settings.html');
  console.log('going to ' + settingsUrl);
  chrome.tabs.create({
    url: settingsUrl
  });
}

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
get_worker_stats(function() {});

$(document).ready(function() {
  OT.init();
  //console.log('loading stuff');
  loadUIRequesters();
  setupEvents();
  chrome.extension.sendMessage({
    read: "resetIcon"
  });
});
