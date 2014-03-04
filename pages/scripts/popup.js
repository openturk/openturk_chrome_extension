var OT = {
  init: function() {
    OT.status.container = $('header.footer');

    if (localStorage['Sandbox'] == "true") {
      $('#login_mturk').attr('href', 'https://www.amazon.com/gp/aws/ssop/index.html?awscbctx=&awscbid=urn%3Aaws%3Asid%3A0N1A8324EEG1142T9G02&awscredential=&awsnoclientpipeline=true&awsstrict=false&awsturknosubway=true&wa=wsignin1.0&wctx=&wreply=https%3A%2F%2Fworkersandbox.mturk.com%3A443%2Fmturk%2Fendsignin&wtrealm=urn%3Aaws%3Asid%3A0N1A8324EEG1142T9G02&awssig=UlH2xRjIlr69pdR3kpZEtiCTN1I%3D');
      $('#signout').attr('href', 'https://workersandbox.mturk.com/mturk/beginsignout');
    } else {
      $('#login_mturk').attr('href', 'https://www.amazon.com/gp/aws/ssop/index.html?awscbctx=&awscbid=urn%3Aaws%3Asid%3A027Y0TCSPRG5XHFYJSR2&awscredential=&awsnoclientpipeline=true&awsstrict=false&awsturknosubway=true&wa=wsignin1.0&wctx=&wreply=https%3A%2F%2Fwww.mturk.com%2Fmturk%2Fendsignin&wtrealm=urn%3Aaws%3Asid%3A027Y0TCSPRG5XHFYJSR2&awssig=B%2BG7QiQm8L9a0G5RMeOrw0IHASk%3D');
      $('#signout').attr('href', 'https://www.mturk.com/mturk/beginsignout');
    }
    if (localStorage['batchs'] == "true") {
      $('#favorites-notification').show();
    }
    if (localStorage['search'] == "true") {
      $('#search-notification').show();
    }

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
      // chrome.tabs.create({
      //   url: optionsUrl
      // });
      chrome.tabs.query({
          url: optionsUrl,
      }, function(results) {
          if (results.length)
              chrome.tabs.update(results[0].id, {active:true});
          else
              chrome.tabs.create({url:optionsUrl});
      })
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
          console.log(results.stars);
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
        OT.switch_balance();
        // $('#workdone').sparkline(submitted_hist, {
        //   type: 'line',
        //   width: '300px',
        //   chartRangeMin: 0,
        //   lineColor: '#fb6b5b'
        // });
        // $('#earning').sparkline(earning_hist, {
        //   type: 'line',
        //   width: '300px',
        //   chartRangeMin: 0,
        //   barColor: '#afcf6f'
        // });
        $('#earning').sparkline(submitted_hist, { type: 'bar', barColor: '#fb6b5b' , width: '300px', height: '50px'});
        $('#earning').sparkline(earning_hist, { composite: true, fillColor: false, lineColor: 'afcf6f' , width: '300px', height: '50px'});
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
    title.href = 'https://' + response.mturk_host + '/mturk/searchbar?selectedSearchType=hitgroups&requesterId=' + url['id'] + '&qualifiedFor=on';
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

  chrome.runtime.sendMessage({
    get_mturk_host: true
  }, function(response) {
    var count = 0;
    for (var i = 0; i < results.stars.length; i++) {
      if (results.stars[i][0] == "undefined" || results.stars[i][1] == "undefined") {
        continue;
      }
      var group_id = results.stars[i][0];
      var value = results.stars[i][1];
      var url = 'https://' + response.mturk_host + '/mturk/preview?groupId=' + group_id;
      console.log(url);
      $.get(url, {}, function(data) {
        var title = $(data).find('.capsulelink_bold');
        if (title.length > 0) {
          console.log(title);
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

          // Make as a like button
          var heart = document.createElement("td");
          var im = document.createElement("img");
          im.src = 'images/grayarrow.gif';
          im.width = 10;
          im.height = 10;

          heart.appendChild(im);
          link_col.appendChild(task);
          link_col.appendChild(reward);
          row.appendChild(heart);
          row.appendChild(link_col);
          feed.appendChild(row);
          count = count + 1;
          $("#rec-msg").hide();
        }
      });
    }
    // Check the case where all the recommendations are unsuitable.
    if( count == 0) {
      $("#rec-msg").html('There is currently 0 recommendations for you.');
    }
  });
}

var obj = {};
var index = {};

var earning_hist = [];
var submitted_hist = [];

function loadUIObjects() {
  chrome.storage.sync.get('requesters', function(items) {
    if (!obj.requesters) {
      obj['requesters'] = [];
    }
    var count = 0;
    $(items.requesters).each(function() {
      obj.requesters.push(this);
      console.log(this);
      if (this['numtask']) {
        appendRequester(this);
        count = count+1;
        $("#content-msg").hide();
      }
    });
    if (count == 0 ){
      $("#content-msg").html('There is currently no batch from your favorite requesters.<br> Subscribe to more requesters on the dashboard.');
    }
    indexRequesters();
  });
  chrome.storage.sync.get('searchterms', function(items) {
    if (!obj.searchterms) {
      obj['searchterms'] = [];
    }
    var count = 0;
    $(items.searchterms).each(function() {
      obj.searchterms.push(this);
      if (this['numtask']) {
        appendSearch(this);
        count = count + 1;
        $("#search-msg").hide();
      }
    });
    if (count == 0 ){
      $("#search-msg").html('There is currently 0 search. <br>Add scheduled search on the options page.');
    }
  });
  chrome.storage.sync.get('workhistory', function(items) {
    if (!obj.workhistory) {
      obj['workhistory'] = [];
    }
    var previous_total_earnings = 0;
    var previous_hit_submitted = 0;
    $(items.workhistory).each(function() {
      obj.workhistory.push(this);
      earning_hist.push(this.total_earnings - previous_total_earnings);
      previous_total_earnings = this.total_earnings;
      submitted_hist.push(this.hit_submitted - previous_hit_submitted);
      previous_hit_submitted = this.hit_submitted;
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
      var search_url = "https://" + response.mturk_host + "/mturk/searchbar?selectedSearchType=hitgroups&searchWords=" + keywords.replace(" ", "+");
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
  loadUIObjects();
  chrome.extension.sendMessage({
    read: "resetIcon"
  });
});
