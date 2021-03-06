var OT = {
  init: function() {
    OT.status.container = $('header.footer');

    if (localStorage.getItem("Sandbox") === "true") {
      $('#login_mturk').attr('href', 'https://workersandbox.mturk.com/');
      $('#signout').attr('href', 'https://workersandbox.mturk.com/');
    } else {
      $('#login_mturk').attr('href', 'https://www.mturk.com/');
      $('#signout').attr('href', 'https://www.mturk.com/');
    }
    if (localStorage.getItem("batchs") === "true") {
      $('#favorites-notification').show();
    }
    if (localStorage.getItem("search") === "true") {
      $('#search-notification').show();
    }
    if (localStorage.getItem("money") === "true") {
      $('#money-notification').show();
      $('#gotpaid').show();
    }

    OT.get_worker_id();
    OT.get_openturk_username();
    getStats();
    getProjection();

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

      if(getCookie('rec') != 1) {
        clearRecommendations();
        setCookie('rec', 1, 1);
      }

      OT.switch_spinner();

      var items = [];
      storage.get('historicalrecommendations', function(item) {
        items = item.historicalrecommendations;
        if(items.length > 0) {
          console.log('Got historical data!');
          OT.switch_recommendation();
          for(var i = 0; i < items.length; i++) {
            if(items[i]['reward'] > localStorage['Target2']) {
              insertRecommendation(items[i]['gid'], items[i]['title'], items[i]['reward'], items[i]['shares']);
            }
          }
        } else {
          $('#recMore').prop('disabled', true).html('Loading ...');
          OT.get_recommendation();
        }
      });
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
        currentWindow: true
      }, function(results) {
        if (results.length)
          chrome.tabs.update(results[0].id, {
            active: true
          }, function() {
            window.close();
          });
        else
          chrome.tabs.create({
            url: optionsUrl
          });
      });
    });
    $('a#target-projection').click(function(e) {
      e.preventDefault();
      var optionsUrl = chrome.extension.getURL('pages/options.html');
      chrome.tabs.query({
        url: optionsUrl,
        currentWindow: true
      }, function(results) {
        if (results.length)
          chrome.tabs.update(results[0].id, {
            active: true
          }, function() {
            window.close();
          });
        else
          chrome.tabs.create({
            url: optionsUrl
          });
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

    $('#recMore').click(function() {
      if (localStorage['recChecked'] < localStorage['recCount']) {
        console.log('Loading ...');
        localStorage['recAppended'] = 0;
        OT.get_recommendation(localStorage['recCurrentPage']);
        $('#recMore').prop('disabled', true).html('Loading ...');
      } else {
        $('#recMore').prop('disabled', true).html('no more recommendations');
        console.log('Reached last page');
      }
    });
  },

  creds: {
    populate: function() {
      if (localStorage.getItem('validated') === "true") {
        OT.status.workerId = localStorage.getItem('workerId');
      }
    },

    remove: function() {
      localStorage.removeItem('workerId');
      localStorage.removeItem('openturk_username');
      localStorage.setItem('validated', false);
      $('mturkusername').val('');
      $('mturkuser').val('');
      OT.get_worker_id();
    },

    save: function() {
      localStorage.setItem('workerId', getCookie('wid'));
      localStorage.setItem('validated', true);
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
    if(localStorage.workerId === "Not yet set" ) {
      setCookie('wid',0,24);
    }
    if (getCookie('wid') !== undefined && getCookie('wid') !== "0") {
      var workerId = getCookie('wid');
      OT.status.workerId = workerId;
      $('#mturkusername').html(workerId);
      $('#mturkuser').html(workerId);
      localStorage.workerId = workerId;
      if (localStorage.getItem('validated') === "true") {
        OT.switch_content();
      } else {
        OT.switch_login();
      }
    } else {
      // Else, go get the cookie
      var dashboard_url = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox" : "www") + '.mturk.com/mturk/dashboard';
      $.ajax({
        url: dashboard_url,
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
            setCookie('wid', workerId, 24);
            localStorage.workerId = workerId;
            if (localStorage.getItem('validated') === "true") {
              OT.switch_content();
            } else {
              OT.switch_login();
            }
          }
        },
        error: function(xhr, status) {
          console.log('You are not logged in MTURK');
          setCookie('wid',0,24);
          localStorage.removeItem('workerId');
          //localStorage.setItem('validated', false);
          OT.switch_sign();
        }
      });
    }
  },

  recommendations: [],

  get_recommendation: function() {
    if (OT.status.openturk_username) {
      if (OT.recommendations && OT.recommendations.length > 0) {
        console.log('continue with previous set ..');
        fetchRecommendation();
      } else {
        localStorage['recCurrentPage']++;
        var master = [];
        if(localStorage['Master'] == "true") {
          master.push('Master');
        }
        if(localStorage['CatMaster'] == "true") {
          master.push('CatMaster');
        }
        if(localStorage['PhotoMaster'] == "true") {
          master.push('PhotoMaster');
        }
        master = master.join(',');
        console.log(master);
        var recommendationUrl = 'http://alpha.openturk.com/endpoint/recommendations';
        var jqxhr = $.getJSON(recommendationUrl + '?page=' + localStorage['recCurrentPage'] + '&master=' + master).done(function(results) {
          console.log('Loading recommendation page #' + localStorage['recCurrentPage']);
          if (results.stars) {
            console.log('recommendations returned something: ' + results + ' ' + results.stars.length);
            if (results.stars.length > 0) {
              console.log('recommendations returned something');
              $('#recspin').show();
              localStorage['recCount'] = results.count;
              OT.recommendations = results.stars.reverse();
              fetchRecommendation();
            } else {
              $('#recspin').hide();
              $('#recMore').prop('disabled', true).html('No more recommendations');
            }
          }
        });
      }
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
    var dashboard_url = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox" : "www") + '.mturk.com/mturk/dashboard';
    $.ajax({url: dashboard_url,
      success: function(data) {
        var rewards = $(data).find('.reward');
        if(rewards.length > 0) {
          var total_approved = $(data).filter("table").find("td.metrics-table-first-value:contains('... Approved')").next().text();
          var approval_rate = $(data).filter("table").find("td.metrics-table-first-value:contains('... Approved')").next().next().text();
          var balance = {
            approved_hits: $(rewards[0]).html(),
            bonuses: $(rewards[1]).html(),
            total_earnings: $(rewards[2]).html(),
            approval_rate: approval_rate,
            total_approved: total_approved
          };
          // For storage
          localStorage.setItem('balance', balance);
          localStorage.setItem('HITTotal', total_approved);
          localStorage.setItem('HITApproval', approval_rate);
          // Balance
          $("#approved_hits").html(balance['approved_hits']);
          $("#bonuses").html(balance['bonuses']);
          $("#total_earnings").html(balance['total_earnings']);
          // metrics
          $("#total_approved").html(balance['total_approved']);
          $("#approval_rate").html(balance['approval_rate']);
          OT.switch_balance();
          $('.inlinebar2').sparkline([100, localStorage.TGP, 100, 66, 33], {
            type: 'bullet',
            width: '50',
            performanceColor: 'green',
            tooltipContainer: 'body.moneytooltip'
          });
        } else {
          // not logged in
          console.log('You are not logged in MTURK');
          localStorage.removeItem('workerId');
          localStorage.setItem('validated', false);
          setCookie('wid',0,24);
          OT.switch_sign();
        }
      },
      error: function(xhr, status) {
          console.log('you are not logged in MTURK');
          localStorage.removeItem('workerId');
          setCookie('wid',0,24);
          OT.switch_sign();
        }
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

  title.href = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/searchbar?selectedSearchType=hitgroups&requesterId=' + url['id'] + '&qualifiedFor=on';
  var batchs = document.createElement("span");
  batchs.className = "hint";

  if (newbatchs && $.inArray(url['id'], newbatchs) > -1) {
    if(url['numtask'] > 1) {
      batchs.innerText = "(" + url['numtask'] + " batches) updated!";
    } else {
      batchs.innerText = "(" + url['numtask'] + " batch) updated!";
    }
    batchs.className = "hint_new ";
  } else {
    if(url['numtask'] > 1) {
      batchs.innerText = "(" + url['numtask'] + " batches)";
    } else {
      batchs.innerText = "(" + url['numtask'] + " batch)";
    }
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
  title.href = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/searchbar?selectedSearchType=hitgroups&qualifiedFor=on&searchWords=' + url['phrase'];
  var batchs = document.createElement("span");
  batchs.className = "hint";

  if (newterms && $.inArray(url['phrase'], newterms) > -1) {
    if(url['numtask'] > 1) {
      batchs.innerText = "(" + url['numtask'] + " batches) some new!";
    } else {
      batchs.innerText = "(" + url['numtask'] + " batch) new!";
    }
    batchs.className = "hint_new";
  } else {
    if(url['numtask'] > 1) {
      batchs.innerText = "(" + url['numtask'] + " batches)";
    } else {
      batchs.innerText = "(" + url['numtask'] + " batch)";
    }
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
  console.log(OT.recommendations);
  console.log(OT.recommendations.length);
  var recommendation = OT.recommendations.pop();
  if (recommendation) {
    var group_id = recommendation[0];
    var reward = recommendation[1];
    var shares = recommendation[2];
    var url = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/preview?groupId=' + group_id;
    // FIXME
    // if (results.recommendations[i][0] == "undefined" || results.recommendations[i][1] == "undefined") {
    //   continue;
    // }
    validateRecommendation(url, reward, shares, function(url) {
      //console.log("DONE CHECKING THIS: " + url);
      //console.log("[RECAP] checked: " + localStorage['recChecked'] + ' added:' + localStorage['recAppended'] + '  .... Not reached 10');
      if (localStorage['recAppended'] < 10) {
        if (OT.recommendations.length > 0) {
          setTimeout(function() {
            fetchRecommendation();
          }, 1000);
        } else if (localStorage['recChecked'] <= localStorage['recCount']) {
          console.log('Loading next page');
          OT.get_recommendation(localStorage['recCurrentPage']);
        } else {
          console.log('Reached last page');
          $('#recspin').hide();
          $('#recMore').prop('disabled', true).html('No more recommendations');
          $('a#recommendation_link').click(function(e) {
            e.preventDefault();
            openLink(this.href);
          });
        }
      } else {
        // load more.
        $('#recMore').prop('disabled', false).html('Load more >>');
        $('#recspin').hide();
      }
    });
  }
}

function validateRecommendation(url, reward, shares, callback) {
  var qualifications = {
    cat_master: false,
    photo_master: false,
    master: false,
    approved_hit: {
      sign: '',
      value: null
    },
    hit_approval_rate: {
      sign: '',
      value: null
    }
  };

  $.get(url, {}, function(data) {
    var title = $(data).find('.capsulelink_bold').text().trim();
    var matchPattern;
    localStorage['recChecked']++;
    if (title.length > 0) { //then user can preview
      var found, qualif;
      found = $(data).find("td.capsule_field_text:contains('Categorization Masters has been granted')");
      if (found.length > 0) {
        qualifications['cat_master'] = true;
      }
      found = $(data).find("td.capsule_field_text:contains('Photo Moderation Masters has been granted')");
      if (found.length > 0) {
        qualifications['photo_master'] = true;
      }
      found = $(data).find("td.capsule_field_text:contains('Masters has been granted')");
      if (found.length > 0) {
        qualifications['master'] = true;
      }
      found = $(data).find("td.capsule_field_text:contains('Total approved HITs is')");
      if (found.length > 0) {
        matchPattern = /Total approved HITs is ([a-z ]+) ([0-9]+)/;
        qualifications['approved_hit']['sign'] = $(found).eq(0).html().match(matchPattern)[1];
        qualifications['approved_hit']['value'] = $(found).eq(0).html().match(matchPattern)[2];
      }
      found = $(data).find("td.capsule_field_text:contains('HIT approval rate (%) is')");
      if (found.length > 0) {
        matchPattern = /HIT approval rate \(\%\) is ([a-z ]+) ([0-9]+)/;
        qualifications['hit_approval_rate']['sign'] = $(found).eq(0).html().match(matchPattern)[1];
        qualifications['hit_approval_rate']['value'] = $(found).eq(0).html().match(matchPattern)[2];
      }
      var gid = $(data).find('input[name=groupId]').val();
      // Checking with BG if worker is qualified.
      chrome.runtime.sendMessage({
        checkQualification: qualifications
      }, function(response) {
          if (response.qualified === true) {
            console.log(response.qualified + "Add it!");
            localStorage['recAppended']++;
            var items;
            storage.get('historicalrecommendations', function(item) {
              items = item['historicalrecommendations'];
              items.push({
                'gid': gid,
                'title': title,
                'reward': reward,
                'shares': shares
              });
              storage.set({
                'historicalrecommendations': items
              });
            });

            if(reward > localStorage['Target2']) {
              insertRecommendation(gid, title, reward, shares);
            }
          }
          callback(url);
      });
    } else {
      callback(url);
    }
  });
}

function insertRecommendation(gid, title, reward, shares) {
  var feed = document.getElementById("recommendation-feed");
  var row = document.createElement("tr");
  row.className = "link";
  var link_col = document.createElement("td");
  var task = document.createElement("a");
  task.id = "recommendation_link";
  task.className = "link_title";
  task.innerText = title;
  task.href = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/preview?groupId=' + gid;

  var rewardSpan = document.createElement("span");
  rewardSpan.className = "hint";
  if (shares > 1) {
    rewardSpan.innerText = "($" + reward + ") [" + shares + " shares]";
  } else {
    rewardSpan.innerText = "($" + reward + ") [" + shares + " share]";
  }
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
}

function clearRecommendations() {
  localStorage['recChecked'] = 0;
  localStorage['recAppended'] = 0;
  localStorage['recCount'] = 0;
  localStorage['recCurrentPage'] = 0;
  storage.set({
    'historicalrecommendations': []
  });
  $('#recommendation-feed').html('');
}

var storage = chrome.storage.local;
var obj = {};
var index = {};

var earning_hist = [];
var submitted_hist = [];

function loadUIObjects() {
  storage.get('requesters', function(items) {
    if (!obj.requesters) {
      obj['requesters'] = [];
    }
    var count = 0;
    $(items.requesters).each(function() {
      obj.requesters.push(this);
      //console.log(this);
      if (this['numtask'] && !this['blocked']) {
        appendRequester(this);
        count = count + 1;
        $("#content-msg").hide();
      }
    });
    if (count === 0) {
      $("#content-msg").html('... Waiting for updates from your favorite requesters.<br> Subscribe to more requesters on the mturk dashboard.');
    }
    indexRequesters();
    $('a#requester_link').click(function(e) {
      e.preventDefault();
      openLink(this.href);
    });
  });
  storage.get('searchterms', function(items) {
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
    if (count === 0) {
      $("#search-msg").html('... Waiting for updates from your saved search terms. <br>Add scheduled searches on the settings page.');
    }
    $('a#search_link').click(function(e) {
      e.preventDefault();
      openLink(this.href);
    });
    $('#clearrec').on('click', function() {
      clearRecommendations();
    });
  });
  // storage.get('workhistory', function(items) {
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
    var search_url = "https://" + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + "/mturk/searchbar?selectedSearchType=hitgroups&searchWords=" + keywords.replace(" ", "+");
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
  if (localStorage.getItem("newwindow") === "true") {
    chrome.tabs.create({
      url: urlto
    });
  } else {
    chrome.tabs.query({
      url: mturk_pattern,
      currentWindow: true
    }, function(results) {
      if (results.length)
        chrome.tabs.update(results[0].id, {
          url: urlto,
          active: true
        }, function() {
          //window.close(); // I think It's better not to close.
        });
      else
        chrome.tabs.create({
          url: urlto
        });
    });
  }
}

function getStats() {
  var status_url = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox" : "www") + '.mturk.com/mturk/status';
  $.ajax({url: status_url,
    success: function(data) {
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
        if (row.className.match('odd|even') === null) {
          continue;
        }

        var odd = row.className.match('odd');
        var submitted = parseInt(row.cells[1].innerHTML, 10);
        var approved = parseInt(row.cells[2].innerHTML, 10);
        var rejected = parseInt(row.cells[3].innerHTML, 10);
        var pending = parseInt(row.cells[4].innerHTML, 10);
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

      data = {
        labels: dates_data,
        datasets: [{
          fillColor: "rgba(220,220,220,0.5)",
          strokeColor: "rgba(220,220,220,1)",
          pointColor: "rgba(220,220,220,1)",
          pointStrokeColor: "#fff",
          data: submitted_data,
          title: 'Submitted'
        }, {
          fillColor: "rgba(163, 191, 63,0.5)",
          strokeColor: "rgba(163, 191, 63,1)",
          pointColor: "rgba(163, 191, 63,1)",
          pointStrokeColor: "#fff",
          data: approved_data,
          title: 'Approved'
        }, {
          fillColor: "rgba(237, 124, 60, 0.5)",
          strokeColor: "rgba(237, 124, 60, 1)",
          pointColor: "rgba(237, 124, 60, 1)",
          pointStrokeColor: "#fff",
          data: pending_data,
          title: 'Pendings'
        }]
      };
      var options = {
        animation: false
      };
      var ctx = document.getElementById("stats").getContext("2d");
      var myNewChart = new Chart(ctx).Line(data, options);
      legend(document.getElementById("lineLegend"), data);
    },
    error: function(xhr, status) {
      console.log('You are not logged in MTURK');
      setCookie('wid',0,24);
      localStorage.removeItem('workerId');
      OT.switch_sign();
    }
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

//
//  Cookie functions from http://www.w3schools.com/JS/js_cookies.asp
//

function setCookie(c_name, value, exhours) {
  var now = new Date();
  var time = now.getTime();
  time += exhours * 3600 * 1000;
  now.setTime(time);

  var c_value = escape(value) + ((exhours === null) ? '' : '; expires=' + now.toUTCString());
  document.cookie = c_name + '=' + c_value;
}


function getCookie(c_name) {
  var i, x, y, ARRcookies = document.cookie.split(';');
  for (i = 0; i < ARRcookies.length; i++) {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
    x = x.replace(/^\s+|\s+$/g, '');
    if (x == c_name) {
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
  $('.inlinebar').sparkline([100, localStorage.TGP, 100, 66, 33], {
    type: 'bullet',
    width: '50',
    performanceColor: 'green',
    tooltipContainer: 'moneytooltip'
  });
  $('.inlinebar').bind('sparklineClick', function(ev) {
    $('#balance').click();
  });
});
