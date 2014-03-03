var OT = {
  init: function() {
    OT.status.container = $('header.footer');

    OT.get_worker_id();
    OT.get_openturk_username();

    $('#save').click(function(e) {
      e.preventDefault();
      OT.creds.save();
    });
    $('#logout').click(function(e) {
      e.preventDefault();
      OT.creds.remove();
    });
    $('#recos').click(function(e) {
      e.preventDefault();
      OT.switch_spinner();
      OT.get_recommendation();
    });
    $('#balance').click(function(e) {
      e.preventDefault();
      OT.switch_spinner();
      OT.get_worker_stats();
    });
    $('#favorites').click(function(e) {
      e.preventDefault();
      OT.switch_spinner();
      OT.switch_content();
    });
    $('#search').click(function(e) {
      e.preventDefault();
      OT.switch_spinner();
      OT.switch_search();
    });
    $('#searchbox').keypress(searchOnEnter);
    var searchButton = document.getElementById("searchbutton");
    searchButton.addEventListener("click", search);
    $('a#options').click(function(e) {
      e.preventDefault();
      var optionsUrl = chrome.extension.getURL('pages/options.html');
      chrome.tabs.create({
        url: optionsUrl
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
      var results = [];
      for (var k in tags) {
        if (tags[k]) {
          results.push(tags[k]);
        }
      }

      $input.val(results.join(','));
    });
    $('#title').focus();
  },

  creds: {
    populate: function() {
      if (localStorage.getItem('validated') == 'true') {
        OT.status.workerId = localStorage.getItem('workerId');
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
      if (status !== null) {
        bar.addClass(status);
      }
      bar.html(message);
    }
  },

  message2: {
    set: function(status, message) {
      var bar = OT.status.container2;

      bar.removeClass('error success');
      if (status !== null) {
        bar.addClass(status);
      }
      bar.html(message);
    }
  },

  switch_content: function() {
    $('#content').show();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').hide();
    $('#balancer').hide();
    $('#recommendation').hide();
    $('#search-container').hide();
    $('#header').show();
    $('#footer').show();
  },
  switch_spinner: function() {
    $('#content').hide();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').show();
    $('#balancer').hide();
    $('#recommendation').hide();
    $('#search-container').hide();
    $('#header').show();
    $('#footer').show();
  },
  switch_balance: function() {
    $('#content').hide();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').hide();
    $('#balancer').show();
    $('#recommendation').hide();
    $('#search-container').hide();
    $('#header').show();
    $('#footer').show();
  },
  switch_recommendation: function() {
    $('#content').hide();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').hide();
    $('#balancer').hide();
    $('#recommendation').show();
    $('#search-container').hide();
    $('#header').show();
    $('#footer').show();
  },
  switch_search: function() {
    $('#content').hide();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').hide();
    $('#balancer').hide();
    $('#recommendation').hide();
    $('#search-container').show();
    $('#header').show();
    $('#footer').show();
  },
  switch_login: function() {
    $('#content').hide();
    $('#login').show();
    $('#sign').hide();
    $('#spinner').hide();
    $('#balancer').hide();
    $('#recommendation').hide();
    $('#search-container').hide();
    $('#header').hide();
    $('#footer').hide();
  },
  switch_sign: function() {
    $('#content').hide();
    $('#login').hide();
    $('#sign').show();
    $('#spinner').hide();
    $('#balancer').hide();
    $('#recommendation').hide();
    $('#search-container').hide();
    $('#header').hide();
    $('#footer').hide();
  },

  get_worker_id: function() {
    chrome.runtime.sendMessage({
      get_mturk_host: true
    }, function(response) {
      $.ajax({
        url: 'https://' + response.mturk_host + '/mturk/dashboard',
        success: function(result) {
          var spanText = $(result).filter("table").find("span:contains('Worker ID')").text();
          var workerIdPattern = /Worker ID: (.*)$/;
          var workerId = spanText.match(workerIdPattern);
          if (OT.status.workerId === null || workerId === null) {
            OT.switch_sign();
          } else {
            workerId = workerId[1];
            OT.status.workerId = workerId;
            $('#mturkusername').html('MT:' + workerId);
            $('#mturkuser').html('MT:' + workerId);
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
    });
  },

  get_recommendation: function() {
    $('#recommendation-feed').empty();
    if (OT.status.openturk_username) {
      var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/recommendations').done(function(results) {
        if (results.stars) {
          appendRecommendation(results);
        } else {
          $("#rec-msg").html('There is currently 0 recommendations.');
        }
      });
    } else {
      // TODO: login button somewhere ..
      $("#rec-msg").html('Login to openturk to get recommendations from your peers');
    }
    OT.switch_recommendation();
  },

  get_openturk_username: function() {
    var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
      if (typeof result.username !== "undefined") {
        OT.status.openturk_username = result.username;
        $('#openturkuser').html('OT:' + OT.status.openturk_username);
      } else {
        $('#openturkuser').html('Connect to openturk');
      }
    });
  },

  get_worker_stats: function() {
    chrome.runtime.sendMessage({
      get_mturk_host: true
    }, function(response) {
      $.get('https://' + response.mturk_host + '/mturk/dashboard', {}, function(data) {
        var rewards = $(data).find('.reward');
        var approval_rate = $(data).filter("table").find("td.metrics-table-first-value:contains('... Approved')").next().next().text();
        var balance = {
          approved_hits: $(rewards[0]).html(),
          bonuses: $(rewards[1]).html(),
          total_earnings: $(rewards[2]).html(),
          approval_rate: approval_rate
        };
        localStorage.setItem('balance', balance);
        $("#approved_hits").html(balance['approved_hits']);
        $("#bonuses").html(balance['bonuses']);
        $("#total_earnings").html(balance['total_earnings']);
        $("#approval_rate").html(balance['approval_rate']);
        console.log(balance);
        OT.switch_balance();
      });
    });
  },


  get_worker_stats2: function() {
    chrome.runtime.sendMessage({
      get_mturk_host: true
    }, function(response) {
      $.get('https://' + response.mturk_host + '/mturk/dashboard', {}, function(data) {
        var rewards = $(data).find('.reward');
        var hit_submitted = $(data).filter("table").find("td.metrics-table-first-value:contains('HITs Submitted')").next().text();

        var balance = {
          total_earnings: $(rewards[2]).html(),
          hit_submitted: hit_submitted
        };
        console.log(balance);
      });
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

  chrome.runtime.sendMessage({
    get_mturk_host: true
  }, function(response) {
    title.href = 'https://' + mturk_host + '/mturk/searchbar?selectedSearchType=hitgroups&requesterId=' + url['id'] + '&qualifiedFor=on';
  });
  var batchs = document.createElement("a");
  batchs.className = "hint";
  batchs.innerText = "(" + url['numtask'] + " batchs)";
  batchs.href = url['numtask'];
  identicon.appendChild(im);
  link_col.appendChild(title);
  link_col.appendChild(batchs);
  row.appendChild(identicon);
  row.appendChild(link_col);
  feed.appendChild(row);
}

function appendSearch(url) {
  var feed = document.getElementById("keywordsearch");
  var row = document.createElement("tr");
  row.className = "link";
  var link_col = document.createElement("td");
  var identicon = document.createElement("td");
  var im = document.createElement("img");
  im.src = 'http://www.gravatar.com/avatar.php?gravatar_id=' + md5(url['phrase']) + '&r=PG&s=15&default=identicon';
  im.width = 15;
  im.height = 15;
  var title = document.createElement("a");
  title.className = "link_title";
  title.innerText = url['phrase'].replace('+', ' ');
  chrome.runtime.sendMessage({
    get_mturk_host: true
  }, function(response) {
    title.href = 'https://' + response.mturk_host + '/mturk/searchbar?selectedSearchType=hitgroups&qualifiedFor=on&searchWords=' + url['phrase'];
  });
  var batchs = document.createElement("a");
  batchs.className = "hint";
  batchs.innerText = "(" + url['numtask'] + " batchs)";
  batchs.href = url['numtask'];
  identicon.appendChild(im);
  link_col.appendChild(title);
  link_col.appendChild(batchs);
  row.appendChild(identicon);
  row.appendChild(link_col);
  feed.appendChild(row);
}

function appendRecommendation(results) {
  var feed = document.getElementById("recommendation-feed");
  for (var i = 0; i < results.stars.length; i++) {
    var group_id = results.stars[i][0];
    var value = results.stars[i][1];

    chrome.runtime.sendMessage({
      get_mturk_host: true
    }, function(response) {
      var url = 'https://' + response.mturk_host + '/mturk/preview?groupId=' + group_id;
      $.get(url, {}, function(data) {
        var title = $(data).find('.capsulelink_bold');
        if (title.length > 0) {

          var row = document.createElement("tr");
          row.className = "link";
          var link_col = document.createElement("td");
          var task = document.createElement("a");
          task.className = "link_title";
          task.innerText = $(title).text().trim();
          task.href = url;

          var reward = document.createElement("a");
          reward.className = "hint";
          reward.innerText = "($" + value + ")";
          reward.href = "";

          link_col.appendChild(task);
          link_col.appendChild(reward);

          row.appendChild(link_col);
          feed.appendChild(row);
        }
      });
    });
  }
}

var obj = {};
var index = {};

function loadUIRequesters() {
  chrome.storage.sync.get('requesters', function(items) {
    if (!obj.requesters) {
      obj['requesters'] = [];
    }
    $(items.requesters).each(function() {
      obj.requesters.push(this);
      console.log(this);
      if (this['numtask']) {
        appendRequester(this);
      }
    });
    indexRequesters();
  });
  chrome.storage.sync.get('searchterms', function(items) {
    if (!obj.searchterms) {
      obj['searchterms'] = [];
    }
    $(items.searchterms).each(function() {
      obj.searchterms.push(this);
      if (this['numtask']) {
        appendSearch(this);
      }
    });
  });
}

function indexRequesters() {
  $(obj.requesters).each(function() {
    index[this.id] = this;
  });
}

function searchOnEnter(e) {
  if (e.keyCode == 13) {
    search();
  }
}

function search() {
  var searchBox = document.getElementById("searchbox");
  var keywords = searchBox.value;

  chrome.runtime.sendMessage({
    get_mturk_host: true
  }, function(response) {
    if (keywords.length > 0) {
      var search_url = "https://"+response.mturk_host+"/mturk/searchbar?selectedSearchType=hitgroups&searchWords=" + keywords.replace(" ", "+");
      openUrl(search_url, true);
    }
  });
}

// Show |url| in a new tab.
function openUrl(url, take_focus) {
  // Only allow http and https URLs.
  if (url.indexOf("http:") !== 0 && url.indexOf("https:") !== 0) {
    return;
  }
  chrome.tabs.create({
    url: url,
    selected: take_focus
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
