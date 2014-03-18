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
        active: true, 
        currentWindow: true
      }, function(results) {
        if (results.length)
          chrome.tabs.update(results[0].id, {
            active: true
          }, function(){window.close();});
        else
          chrome.tabs.create({
            url: optionsUrl
          });
      })
    });
    $('a#target-projection').click(function(e) {
      e.preventDefault();
      var optionsUrl = chrome.extension.getURL('pages/options.html');
      chrome.tabs.query({
        url: optionsUrl,
        active: true, 
        currentWindow: true
      }, function(results) {
        if (results.length)
          chrome.tabs.update(results[0].id, {
            active: true
         }, function(){window.close();});  
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
      localStorage.setItem('workerId', getCookie('wid'));
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
    $('#openturk_login').hide();
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
    $('#openturk_login').hide();
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
    $('#openturk_login').hide();
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
    $('#openturk_login').hide();
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
    $('#openturk_login').hide();
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
    $('#openturk_login').hide();
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
    $('#openturk_login').hide();
  },
  switch_openturk_login: function() {
    $('#content').hide();
    $('#login').hide();
    $('#sign').hide();
    $('#spinner').hide();
    $('#balancer').hide();
    $('#recommendation').hide();
    $('#search-container').hide();
    $('#header').show();
    $('#footer').show();
    $('#openturk_login').show();
  },

  get_worker_id: function() {
    if (getCookie('wid') != undefined) {
      var workerId = getCookie('wid');
      console.log(workerId);
      OT.status.workerId = workerId;
      $('#mturkusername').html(workerId);
      $('#mturkuser').html(workerId);
      localStorage.workerId = workerId;
      if (localStorage.getItem('validated') == 'true') {
        OT.switch_content();
      } else {
        OT.switch_login();
      }
    } else {
      // Else, go get the cookie
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
            $('#mturkusername').html(workerId);
            $('#mturkuser').html(workerId);
            setCookie('wid',workerId,1);
            localStorage.workerId = workerId;
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
    }
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
      OT.switch_recommendation();
    } else {
      // TODO: login button somewhere ..
      $("#rec-msg").html('Login to openturk to get recommendations from your peers');
      OT.switch_openturk_login();
    }
  },

  get_openturk_username: function() {
    var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
      if (typeof result.username !== "undefined") {
        OT.status.openturk_username = result.username;
        $('#openturkuser').html(OT.status.openturk_username);
        $('#ot-connect').hide();
      } else {
        $('#openturkuser').html('Connect to openturk');
        $('#ot-connect').show();
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
    var shares = recommendation[2];
    var url = 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/preview?groupId=' + group_id;
    // FIXME
    // if (results.stars[i][0] == "undefined" || results.stars[i][1] == "undefined") {
    //   continue;
    // }
    validateRecommendation(url, reward, shares, function() {
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
          $('a#recommendation_link').click(function(e) { e.preventDefault(); openLink(this.href)});
        }
      }
    });
  }
}

function validateRecommendation(url, reward, shares, callback) {
  $.get(url, {}, function(data) {
    var title = $(data).find('.capsulelink_bold');
    console.log(url);
    OT.recChecked++;
    if (title.length > 0) {
      OT.recAppended++;
      insertRecommendation(data, title, reward, shares); 
    }
    callback();
  });
}

function insertRecommendation(data, title, reward, shares) {
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
  rewardSpan.innerText = "($" + reward + ") [" + shares+ " workers]";

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
      $("#content-msg").html('There is currently no batch from your favorite requesters.<br> Subscribe to more requesters on the mturk dashboard.');
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
  console.log("going ", urlto);
  var mturk_pattern = '*://www.mturk.com/*';
  chrome.tabs.query({
    url: mturk_pattern,
    currentWindow: true
  }, function(results) {
    if (results.length)
      chrome.tabs.update(results[0].id, {
        url: urlto,
        active: true
      }, function(){window.close();});
    else
      chrome.tabs.create({
        url: urlto
      });
  });
}

function getStats() {
  $.get('https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/status', {}, function(data) {
    var rows = $(data).find('tr');

    var submitted_data = [];
    var pending_data = [];
    var rejected_data = [];
    var approved_data = [];
    var dollar_data = [];
    var dates_data = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];

      if (row.cells.length != 6)
        continue;
      if (row.className.match('grayHead')) {
        continue;
      }
      if (row.className.match('odd|even') == null) {
        continue;
      }

      var odd = row.className.match('odd');
      var submitted = parseInt(row.cells[1].innerHTML);
      var approved = parseInt(row.cells[2].innerHTML);
      var rejected = parseInt(row.cells[3].innerHTML);
      var pending = parseInt(row.cells[4].innerHTML);
      var earnings = row.cells[5].childNodes[0].innerHTML;
      var dollars = parseFloat(earnings.slice(earnings.search('\\$') + 1));
      var date = row.cells[0].childNodes[1].href.substr(53);

      submitted_data.unshift(submitted);
      pending_data.unshift(pending);
      rejected_data.unshift(rejected);
      approved_data.unshift(approved);
      dollar_data.unshift(dollars);

      dates_data.unshift($.trim(row.cells[0].textContent.replace(/, 20../, "")));

    }

    var data = {
      labels : dates_data,
      datasets : [
        {
          fillColor : "rgba(220,220,220,0.5)",
          strokeColor : "rgba(220,220,220,1)",
          pointColor : "rgba(220,220,220,1)",
          pointStrokeColor : "#fff",
          data : submitted_data,
          title : 'Submitted'
        },
        {
          fillColor : "rgba(163, 191, 63,0.5)",
          strokeColor : "rgba(163, 191, 63,1)",
          pointColor : "rgba(163, 191, 63,1)",
          pointStrokeColor : "#fff",
          data : approved_data,
          title : 'Approved'
        },
        {
          fillColor : "rgba(237, 124, 60, 0.5)",
          strokeColor : "rgba(237, 124, 60, 1)",
          pointColor : "rgba(237, 124, 60, 1)",
          pointStrokeColor : "#fff",
          data : pending_data ,
          title : 'Pendings'
        }
      ]
    }
    var options = {
        animation: false
    };
    var ctx = document.getElementById("stats").getContext("2d");
    var myNewChart = new Chart(ctx).Line(data,options);
    legend(document.getElementById("lineLegend"), data);
  });
}

function legend(parent, data) {
    parent.className = 'legend';
    var datas = data.hasOwnProperty('datasets') ? data.datasets : data;

    datas.forEach(function(d) {
        var title = document.createElement('span');
        title.className = 'title';
        title.style.borderColor = d.hasOwnProperty('strokeColor') ? d.strokeColor : d.color;
        title.style.borderStyle = 'solid';
        parent.appendChild(title);

        var text = document.createTextNode(d.title);
        title.appendChild(text);
    });
}


// Earning Projection Function
var STATUSDETAIL_DELAY = 500;
var MPRE_DELAY = 2000;
var STD_DAILY = localStorage['Target'];
var DASHBOARD_URL = 'https://'+ ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") +'/mturk/dashboard';
var STATUSDETAIL_BASE_URL = '/mturk/statusdetail?encodedDate=';
var STATUSDETAIL_FULL_URL = 'https://'+ ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/statusdetail?encodedDate=';
var page_num = 0;
var date_header = '';
var page_total = 0;
var subtotal = 0;

function getProjection() {
  var num = localStorage["Target"];
  $("#target-projection").html("$" +num/100);
  $.get(DASHBOARD_URL, function(data){
    var $src = $(data);
    var day_name = $src.find("a[href^='"+STATUSDETAIL_BASE_URL+"']:first").text();
    if (day_name == 'Today')
    {
        var last_date_worked = $src.find("a[href^='"+STATUSDETAIL_BASE_URL+"']:first").attr('href').replace(STATUSDETAIL_BASE_URL, '');
        var date_URLs = STATUSDETAIL_FULL_URL + last_date_worked + '&sortType=All&pageNumber=' + page_num;
        statusdetail_loop(date_URLs);
    }
    else
    {
        $('#projection').html( '$0.00' );
    }
  });
}

function scrape($src)
{
    var $reward = $src.find("td[class='statusdetailAmountColumnValue']");
    var $approval = $src.find("td[class='statusdetailStatusColumnValue']");
    page_total = 0;

    for (var j = 0; j < $reward.length; j++)
    {
        // I"m worried if I use parseFloat errors will accumulate because floats are inexact
        var reward = parseInt($reward.eq(j).text().replace(/[^0-9]/g,''), 10);
        var approval = $approval.eq(j).text();

        if (approval != 'Rejected')
        {
            page_total += reward;
        }                
    }
}

function statusdetail_loop(next_URL)
{
    if (next_URL.length != 0)
    {
        $.get(next_URL, function(data)
        {
            var $src = $(data);
            var maxpagerate = $src.find("td[class='error_title']:contains('You have exceeded the maximum allowed page request rate for this website.')");
            if (maxpagerate.length == 0)
            {
                subtotal += page_total;
                date_header = $src.find("td[class='white_text_14_bold']:contains('HITs You Worked On For')").clone().children().remove().end().text().trim();
                page_num++;
                scrape($src);

                $next_URL = $src.find("a[href^='/mturk/statusdetail']:contains('Next')");
                next_URL = ($next_URL.length != 0) ? (STATUSDETAIL_FULL_URL + $next_URL.attr('href')) : '';

                setTimeout(function(){statusdetail_loop(next_URL);}, STATUSDETAIL_DELAY);
            }
            else
            {
                setTimeout(function(){statusdetail_loop(next_URL);}, MPRE_DELAY);
            }
        });
    }
    else
    {
        $('#projection').html( '$' + ((subtotal+page_total)/100).toFixed(2) );
        if ((subtotal+page_total) >= STD_DAILY) {
          $('#projection').removeClass("red");
          $('#projection').addClass("green");
        }
    }
}

//
//  Cookie functions copied from http://www.w3schools.com/JS/js_cookies.asp
//

function setCookie(c_name,value,exdays)
{
   var exdate=new Date(); 
   exdate.setDate(exdate.getDate() + exdays);
   var c_value=escape(value) + ((exdays==null) ? '' : '; expires='+exdate.toUTCString());
   document.cookie=c_name + '=' + c_value;
}


function getCookie(c_name)
{
   var i,x,y,ARRcookies=document.cookie.split(';');
   for (i=0;i<ARRcookies.length;i++)
   {
      x=ARRcookies[i].substr(0,ARRcookies[i].indexOf('='));
      y=ARRcookies[i].substr(ARRcookies[i].indexOf('=')+1);
      x=x.replace(/^\s+|\s+$/g,'');
      if (x==c_name)
      {
         return unescape(y);
      }
   }
}

// Launching stuff !

$(document).ready(function() {
  OT.init();
  //console.log('loading stuff');
  loadUIObjects();
  chrome.extension.sendMessage({
    reset: "resetIcon"
  });
  getStats();
  getProjection();
});
