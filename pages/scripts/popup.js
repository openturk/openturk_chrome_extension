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
      $('#recommendation-feed').empty();
      $('#recMore').prop('disabled', true).html('load more');
      OT.recChecked = 0;
      OT.recAppended = 0;
      OT.recCount = 0;
      OT.recCurrentPage = 1 ;
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
      chrome.tabs.query({
        url: optionsUrl,
      }, function(results) {
        if (results.length)
          chrome.tabs.update(results[0].id, {
            active: true
          });
        else
          chrome.tabs.create({
            url: optionsUrl
          });
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

    $('#recMore').click(function() {
      if (OT.recChecked < OT.recCount) {
        console.log('Loading next page');
        OT.recCurrentPage++;
        OT.recAppended = 0;
        OT.get_recommendation(OT.recCurrentPage);
      } else {
        $('#recMore').prop('disabled', true).html('no more recommendations');
        console.log('Reached last page');
      }
    });

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
    $.ajax({
      url: 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/dashboard',
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
  },

  recCurrentPage: 1,
  recCount: 0,
  recAppended: 0,
  recChecked: 0,
  stars: [],

  get_recommendation: function() {
    // $('#recommendation-feed').empty();
    if (OT.status.openturk_username) {
      var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/recommendations?page=' + OT.recCurrentPage).done(function(results) {
        console.log('Loading recommendation page #' + OT.recCurrentPage);
        if (results.stars) {   
          console.log('stars returned something: ' + results + ' ' + results.stars.length);     
          if (results.stars.length > 0) {
            console.log('stars returned something');
            $('#recspin').show();
            OT.recCount = results.count;
            OT.stars = results.stars;
            fetchRecommendation();
          } else {
            $('#recspin').hide();
            $('#recMore').prop('disabled', true).html('No more recommendations');
          }
        } 
        // else {
        //   $("#rec-msg").html('There is currently 0 recommendations.');
        // }
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
    $.get('https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/dashboard', {}, function(data) {
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
      // $('#earning').sparkline(submitted_hist, { type: 'bar', barColor: '#fb6b5b', height: '50px'});
      // $('#earning').sparkline(earning_hist, { composite: true, fillColor: false, lineColor: 'afcf6f' , width: '100px', height: '50px'});
    });
  },

  status: {
    workerId: '',
    openturk_username: '',
    container: {}
  }
};

var newbatchs = JSON.parse(localStorage["newbatchs"] || "null");
var newterms = JSON.parse(localStorage["newterms"] || "null");

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
  //console.log(md5(url['id']));
  var title = document.createElement("a");
  title.id = "requester_link";
  title.className = "link_title";
  title.innerText = url['name'];

  title.href = 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/searchbar?selectedSearchType=hitgroups&requesterId=' + url['id'] + '&qualifiedFor=on';
  var batchs = document.createElement("span");
  batchs.className = "hint";

  if (newbatchs && $.inArray(url['id'], newbatchs) > -1) {
    batchs.innerText = "(" + url['numtask'] + " batchs) new!";
    batchs.className = "hint_new  ";
  } else {
    batchs.innerText = "(" + url['numtask'] + " batchs)";
  }
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
  // Make as a like button
  var icone = document.createElement("td");
  var im = document.createElement("img");
  im.src = 'images/grayarrow.gif';
  im.width = 10;
  im.height = 10;
  var title = document.createElement("a");
  title.id = "search_link";
  title.className = "link_title";
  title.innerText = url['phrase'].replace('+', ' ');
  title.href = 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/searchbar?selectedSearchType=hitgroups&qualifiedFor=on&searchWords=' + url['phrase'];
  var batchs = document.createElement("span");
  batchs.className = "hint";

  if (newterms && $.inArray(url['phrase'], newterms) > -1) {
    batchs.innerText = "(" + url['numtask'] + " batchs) new!";
    batchs.className = "hint_new";
  } else {
    batchs.innerText = "(" + url['numtask'] + " batchs)";
  }

  // batchs.href = url['numtask'];
  icone.appendChild(im);
  link_col.appendChild(title);
  link_col.appendChild(batchs);
  row.appendChild(icone);
  row.appendChild(link_col);
  feed.appendChild(row);
}

function fetchRecommendation() {
  console.log(OT.stars);
  console.log(OT.stars.length);
  var recommendation = OT.stars.pop();
  if(recommendation) {
    var group_id = recommendation[0];
    var reward = recommendation[1];
    var url = 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/preview?groupId=' + group_id;
    // FIXME
    // if (results.stars[i][0] == "undefined" || results.stars[i][1] == "undefined") {
    //   continue;
    // }
    validateRecommendation(url, reward, function() {
      if (OT.recAppended < 10) {
        console.log(OT.recChecked + ' ' + OT.recAppended + '  .... Not reached 10');
        if (OT.stars.length > 0) {
          fetchRecommendation();
        }
        else if (OT.recChecked < OT.recCount) {
            console.log('Loading next page');
            OT.recCurrentPage++;
            OT.get_recommendation(OT.recCurrentPage);
        } else {
          console.log('Reached last page');
          $('#recspin').hide();
          $('#recMore').prop('disabled', true).html('No more recommendations');
        }
        $('a#recommendation_link').click(function(e) { e.preventDefault(); openLink(this.href)});
      }
    });
  }
}

function validateRecommendation(url, reward, callback) {
  $.get(url, {}, function(data) {
    var title = $(data).find('.capsulelink_bold');
    console.log(url);
    OT.recChecked++;
    if (title.length > 0) {
      OT.recAppended++;
      insertRecommendation(data, title, reward); 
    }
    callback();
  });
}

function insertRecommendation(data, title, reward) {
  var feed = document.getElementById("recommendation-feed");
  var gid = $(data).find('input[name=groupId]').val();
  var row = document.createElement("tr");
  row.className = "link";
  var link_col = document.createElement("td");
  var task = document.createElement("a");
  task.id = "recommendation_link"
  task.className = "link_title";
  task.innerText = $(title).text().trim();
  task.href = 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/preview?groupId=' + gid;

  var rewardSpan = document.createElement("span");
  rewardSpan.className = "hint";
  rewardSpan.innerText = "($" + reward + ")";

  // Make as a like button
  var heart = document.createElement("td");
  var im = document.createElement("img");
  im.src = 'images/grayarrow.gif';
  im.width = 10;
  im.height = 10;

  heart.appendChild(im);
  link_col.appendChild(task);
  link_col.appendChild(rewardSpan);
  row.appendChild(heart);
  row.appendChild(link_col);
  feed.appendChild(row);
  console.log(row);
  $("#rec-msg").hide();
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
      //console.log(this);
      if (this['numtask']) {
        appendRequester(this);
        count = count + 1;
        $("#content-msg").hide();
      }
    });
    if (count == 0) {
      $("#content-msg").html('There is currently no batch from your favorite requesters.<br> Subscribe to more requesters on the dashboard.');
    }
    indexRequesters();
    $('a#requester_link').click(function(e) { e.preventDefault(); openLink(this.href)});
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
    if (count == 0) {
      $("#search-msg").html('There is currently 0 search. <br>Add scheduled search on the options page.');
    }
    $('a#search_link').click(function(e) { e.preventDefault(); openLink(this.href)});
  });
  // chrome.storage.sync.get('workhistory', function(items) {
  //   if (!obj.workhistory) {
  //     obj['workhistory'] = [];
  //   }
  //   var previous_total_earnings = 0;
  //   var previous_hit_submitted = 0;
  //   $(items.workhistory).each(function() {
  //     obj.workhistory.push(this);
  //     earning_hist.push(this.total_earnings - previous_total_earnings);
  //     previous_total_earnings = this.total_earnings;
  //     submitted_hist.push(this.hit_submitted - previous_hit_submitted);
  //     previous_hit_submitted = this.hit_submitted;
  //   });
  // });
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

  if (keywords.length > 0) {
    var search_url = "https://" + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + "/mturk/searchbar?selectedSearchType=hitgroups&searchWords=" + keywords.replace(" ", "+");
    openUrl(search_url, true);
  }
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

function openLink(urlto) {
  var mturk_pattern = '*://www.mturk.com/*';
  chrome.tabs.query({
    url: mturk_pattern,
  }, function(results) {
    if (results.length)
      chrome.tabs.update(results[0].id, {
        url: urlto,
        active: true
      });
    else
      chrome.tabs.create({
        url: urlto
      });
  });
}

$(document).ready(function() {
  OT.init();
  //console.log('loading stuff');
  loadUIObjects();
  chrome.extension.sendMessage({
    reset: "resetIcon"
  });
});
