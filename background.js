// Variables for the task management
var storage = chrome.storage.sync;
var obj = {};
var index = {};
var updates = 0;
var captcha = false;

// Legacy support for pre-event-pages.
var oldChromeVersion = !chrome.runtime;
var requestTimerId;

// More Vars
var animationFrames = 36;
var animationSpeed = 10; // ms
var canvas = document.getElementById('canvas');
var loggedInImage = document.getElementById('logged_in');
var canvasContext = canvas.getContext('2d');
var pollIntervalMin = 1; // 1 minute
var pollIntervalMax = 60; // 1 hour
var requestTimeout = 1000 * 2; // 2 seconds
var rotation = 0;
var loadingAnimation = new LoadingAnimation();


SetInitialOption("RequestInterval", 5);
SetInitialOption("Sandbox", "false");
SetInitialOption("Reqnotif", "true");
SetInitialOption("Termnotif", "true");
SetInitialOption("Logging", "true");
SetInitialOption("Target", 1000);
SetInitialOption("TGP", 0);
SetInitialOption("earnings", 0);

localStorage.setItem('workerId', 'undefined');

localStorage['batchs'] = "false";
localStorage['search'] = "false";
localStorage['money'] = "false";
localStorage['newbatchs'] = [];
localStorage['newterms'] = [];
var newbatchs = [];
var newterms = [];

// setting the worker for the first time if possible.
$.ajax({
  url: 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/dashboard',
  success: function(result) {
    var spanText = $(result).filter("table").find("span:contains('Worker ID')").text();
    var workerIdPattern = /Worker ID: (.*)$/;
    var workerId = spanText.match(workerIdPattern);
    if (workerId && workerId.length > 0) {
      localStorage.workerId = workerId[1];
    } else {
      localStorage.workerId = 'Not yet set';
    }
  },
  error: function(xhr, status) {
    localStorage.workerId = 'Not yet set';
  }
});

// Functions !

function SetInitialOption(key, value) {
  if (localStorage[key] === null) {
    localStorage[key] = value;
  }
}

// Set the Listeners
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if (request.get_mturk_host) {
      sendResponse({
        mturk_host: (localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com"
      });
    }

    if (request.get_logging) {
      sendResponse({
        logging: localStorage['Logging']
      });
    }

    if (request.captcha) {
      captcha = true;
    } else {
      captcha = false;
    }

    if (request.get_worker_id) {
      // console.log('id requested');
      if (localStorage.workerId) {
        // console.log('id requested: ' + localStorage.workerId);
        sendResponse({
          workerId: localStorage.workerId
        });
      } else {
        sendResponse({
          workerId: "undefined"
        });
      }
    }

    if (request.reset === "resetIcon") {
      console.log('msg: reset the icon');
      updates = 0;
      localStorage['batchs'] = "false";
      localStorage['search'] = "false";
      localStorage['money'] = "false";
      localStorage['newbatchs'] = [];
      localStorage['newterms'] = [];
      newbatchs = [];
      newterms = [];
      updateUnreadCount();
    }
    if (request.addRequester) {
      console.log('msg: adding requester ' + request.addRequester);
      addRequester(request.addRequester);
    }
    if (request.deleteRequester) {
      console.log('msg: deleting requester' + request.deleteRequester);
      deleteRequester(request.deleteRequester);
    }
    if (request.unblockRequester) {
      console.log('msg: unblocking requester' + request.unblockRequester);
      unblockRequester(request.unblockRequester);
    }
    if (request.fetch) {
      console.log('msg: reloading data');
      loadSearchTerms();
      loadRequesters();
    }
  }
);

function subscribe(req, unsubscribe) {
  data = {
    requester_id: req.id,
    name: req.name || "undefined"
  };
  var endpoint = 'http://alpha.openturk.com/endpoint/' + (unsubscribe === true ? 'unsubscribe' : 'subscribe');
  request = $.ajax({
    url: endpoint,
    type: "POST",
    data: data
  }).always(function(data) {});
}

function block(req, unblock) {
  data = {
    requester_id: req.id,
    name: req.name || "undefined"
  };
  var endpoint = 'http://alpha.openturk.com/endpoint/' + (unblock === true ? 'unblock' : 'block');
  request = $.ajax({
    url: endpoint,
    type: "POST",
    data: data
  }).always(function(data) {});
}

function addRequester(req) {
  console.log('saving');
  if (!obj.requesters) {
    obj['requesters'] = [];
  }
  obj.requesters.push(req);
  saveRequesters();
  getNewBatchs();
  indexRequesters();
  if(req.blocked) {
    block(req);
  } else {
    subscribe(req);
  }
}

function deleteRequester(req) {
  console.log(req);
  obj.requesters = obj.requesters.filter(function(el) {
    return el.id != req.id;
  });
  saveRequesters();
  indexRequesters();
  subscribe(req, true);
}

function unblockRequester(req) {
  console.log(req);
  obj.requesters = obj.requesters.filter(function(el) {
    return el.id != req.id;
  });
  saveRequesters();
  indexRequesters();
  block(req, true);
}

function loadRequesters() {
  storage.get('requesters', function(items) {
    obj.requesters = [];
    $(items.requesters).each(function() {
      obj.requesters.push(this);
    });
    indexRequesters();
    getNewBatchs();
  });
}

function loadSearchTerms() {
  storage.get('searchterms', function(items) {
    obj.searchterms = [];
    $(items.searchterms).each(function() {
      obj.searchterms.push(this);
    });
    getNewSearch();
  });
}

function loadWorkHistory() {
  storage.get('workhistory', function(items) {
    obj.workhistory = [];
    $(items.workhistory).each(function() {
      obj.workhistory.push(this);
    });
  });
}

function indexRequesters() {
  $(obj.requesters).each(function() {
    index[this.id] = this;
  });
}

function modifyCount(phrase, count) {
  $(obj.searchterms).each(function() {
    if (this.phrase == phrase) {
      console.log('changing ..');
      this.numtask = count;
    }
  });
}

function saveSearchTerms() {
  chrome.storage.sync.set({
    'searchterms': obj.searchterms
  });
}

function saveRequesters() {
  chrome.storage.sync.set({
    'requesters': obj.requesters
  });
}

function saveWorkHist() {
  chrome.storage.sync.set({
    'workhistory': obj.workhistory
  });
}

loadRequesters();
loadSearchTerms();
loadWorkHistory();

function getNewBatchs() {
  storage.get('requesters', function(items) {
    if (typeof items.requesters !== "undefined") {
      timeOut(items.requesters, scrapForBatchs);
    }
  });
}

function getNewSearch() {
  storage.get('searchterms', function(items) {
    if (typeof items.searchterms !== "undefined") {
      timeOut(items.searchterms, scrapForSearch);
    }
  });
}

function timeOut(items, call) {
  if (items.length > 0) {
    setTimeout(function() {
      call(items.pop());
      timeOut(items, call);
    }, 3000);
  }
}

function getWorkerStats() {
  if (!captcha) {
    $.get('https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/dashboard', {}, function(data) {
      var rewards = $(data).find('.reward');
      // var hit_submitted = $(data).filter("table").find("td.metrics-table-first-value:contains('HITs Submitted')").next().text();
      // var balance = {
      //   total_earnings: parseInt($(rewards[2]).html().replace('$', '')),
      //   hit_submitted: parseInt(hit_submitted)
      // };
      // //obj.workhistory.push(balance);
      // //saveWorkHist();
      var total_earnings = parseInt($(rewards[2]).html().replace('$', ''), 10);
      if (total_earnings > localStorage.earnings) {
        updateNewMoney();
        localStorage.earnings = total_earnings;
        localStorage.money = true;
      }
    });
  } else {
    console.log('[msg]captach detected! stats request blocked');
  }
}

function printTasks() {
  if (typeof obj.requesters !== "undefined") {
    obj.requesters.forEach(function(url) {
      console.log(url['name'] + ':' + url['numtask']);
    });
  }
}


//TODO: pop the term from the notification list.

function scrapForBatchs(url) {
  if (!captcha) {
    $.ajax({
      url: 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/searchbar' + '?selectedSearchType=hitgroups' + '&qualifiedFor=on' + '&requesterId=' + url['id'],
      success: function(result) {
        var spanText = $(result).find("td:contains('Results')").text();
        var resPattern = /of (.*) Results/;
        var res = spanText.match(resPattern);
        var id;
        if (res) {
          res = res[1];
          id = url['id'];
          var old_res = index[id].numtask;
          console.log('Checking requester : ' + id);
          if (res != old_res) {
            index[id].numtask = res;
            console.log('REQUESTER. Before: ' + old_res + ' After: ' + res);
            if (res > old_res) {
              var diff = res - old_res;
              if (localStorage['Reqnotif'] === "true") {
                updates = updates + diff;
              }
              localStorage['batchs'] = "true";
              diff = res - old_res;
              console.log('Requester diff: ' + diff);
              updateUnreadCount();
              if (!(id in newbatchs)) {
                newbatchs.push(id);
              }
              localStorage['newbatchs'] = JSON.stringify(newbatchs);
            }
            saveRequesters();
          }
        } else {
          //TODO: add maxrate case ...
          id = url['id'];
          index[id].numtask = 0;
          saveRequesters();
        }
      },
      error: function(xhr, status) {
        // do something when it's wrong
      }
    });
  } else {
    console.log('[msg]captach detected! requester request blocked');
  }
}

function scrapForSearch(phrase) {
  if (!captcha) {
    $.ajax({
      url: 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/searchbar' + '?selectedSearchType=hitgroups' + '&qualifiedFor=on' + '&searchWords=' + phrase['phrase'],
      success: function(result) {
        var spanText = $(result).find("td:contains('Results')").text();
        var resPattern = /of (.*) Results/;
        console.log('https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/searchbar' + '?selectedSearchType=hitgroups' + '&qualifiedFor=on' + '&searchWords=' + phrase['phrase']);
        var res = spanText.match(resPattern);
        if (res) {
          res = res[1];
          var old_res = phrase['numtask'];
          console.log('Checking phrase : ' + phrase['phrase']);
          if (res != old_res) {
            console.log('SEARCH. Before: ' + old_res + ' After: ' + res);
            phrase['numtask'] = res;
            modifyCount(phrase['phrase'], res);
            if (res > old_res) {
              var diff = res - old_res;
              if (localStorage['Termnotif'] === "true") {
                updates = updates + diff;
              }
              localStorage['search'] = "true";
              console.log('Search diff: ' + diff);
              updateUnreadCount();
              if (!(phrase in newterms)) {
                newterms.push(phrase['phrase']);
              }
              localStorage['newterms'] = JSON.stringify(newterms);
            }
            saveSearchTerms();
          }
        } else {
          //TODO: add maxrate case ...
          modifyCount(phrase['phrase'], 0);
          saveSearchTerms();
        }
      },
      error: function(xhr, status) {
        console.log('something went wrong ! ' + phrase);
      }
    });
  } else {
    console.log('[msg]captach on! keyword request blocked');
  }
}

// chrome.storage.onChanged.addListener(function(changes, namespace) {
//   for (key in changes) {
//     var storageChange = changes[key];
//     console.log('Storage key "%s" in namespace "%s" changed. ' +
//       'Old value was "%s", new value is "%s".',
//       key,
//       namespace,
//       storageChange.oldValue,
//       storageChange.newValue);
//     //This is disgusting ...
//     updateUnreadCount(1);
//   }
// });

function setBadge(text) {
  chrome.browserAction.setBadgeText({
    text: text
  });
}

// Setting an alarm scheduler
function scheduleRequest() {
  console.log('scheduleRequest');
  delay = parseInt(localStorage['RequestInterval'], 10);
  console.log('Scheduling for (in minutes): ' + delay);

  if (oldChromeVersion) {
    if (requestTimerId) {
      window.clearTimeout(requestTimerId);
    }
    requestTimerId = window.setTimeout(onAlarm, delay * 60 * 1000);
  } else {
    console.log('Creating alarm');
    // Use a repeating alarm so that it fires again if there was a problem
    // setting the next alarm.
    chrome.alarms.create('refresh', {
      periodInMinutes: delay
    });
  }
}

// ajax stuff
function startRequest(params) {
  // Schedule request immediately. We want to be sure to reschedule, even in the
  // case where the extension process shuts down while this request is
  // outstanding.
  if (params && params.scheduleRequest) scheduleRequest();

  function stopLoadingAnimation() {
    if (params && params.showLoadingAnimation) loadingAnimation.stop();
  }

  if (params && params.showLoadingAnimation)
    loadingAnimation.start();

  stopLoadingAnimation();
  getNewBatchs();
  getNewSearch();
}

// Beautyfication

function ease(x) {
  return (1 - Math.sin(Math.PI / 2 + x * Math.PI)) / 2;
}

function animateFlip() {
  rotation += 1 / animationFrames;
  drawIconAtRotation();

  if (rotation <= 1) {
    setTimeout(animateFlip, animationSpeed);
  } else {
    rotation = 0;
    // updateIcon();
  }
}

function drawIconAtRotation() {
  canvasContext.save();
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  canvasContext.translate(
    Math.ceil(canvas.width / 2),
    Math.ceil(canvas.height / 2));
  canvasContext.rotate(2 * Math.PI * ease(rotation));
  canvasContext.drawImage(loggedInImage, -Math.ceil(canvas.width / 2), -Math.ceil(canvas.height / 2));
  canvasContext.restore();

  chrome.browserAction.setIcon({
    imageData: canvasContext.getImageData(0, 0,
      canvas.width, canvas.height)
  });
}

function updateUnreadCount() {
  var changed = localStorage.unreadCount != updates;
  localStorage.unreadCount = updates;
  updateIcon();
  if (changed) {
    animateFlip();
  }
}

function updateNewMoney() {
  updateIcon(true);
  animateFlip();
}

function updateIcon(isMoney) {
  if (!localStorage.hasOwnProperty('unreadCount')) {
    chrome.browserAction.setIcon({
      path: "icons/browser_action_disabled.png"
    });
    chrome.browserAction.setBadgeBackgroundColor({
      color: [190, 190, 190, 230]
    });
    chrome.browserAction.setBadgeText({
      text: "?"
    });
  } else {
    chrome.browserAction.setIcon({
      path: "icons/icon19.png"
    });
    if (isMoney) {
      chrome.browserAction.setBadgeBackgroundColor({
        color: "#00FF00"
      });
      chrome.browserAction.setBadgeText({
        text: "$"
      });
    } else {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [208, 0, 24, 255]
      });
      chrome.browserAction.setBadgeText({
        text: localStorage.unreadCount != "0" ? "new" : ""
      });
    }
  }
}

// A "loading" animation

function LoadingAnimation() {
  this.timerId_ = 0;
  this.maxCount_ = 8; // Total number of states in animation
  this.current_ = 0; // Current state
  this.maxDot_ = 4; // Max number of dots in animation
}

LoadingAnimation.prototype.paintFrame = function() {
  var text = "";
  for (var i = 0; i < this.maxDot_; i++) {
    text += (i == this.current_) ? "." : " ";
  }
  if (this.current_ >= this.maxDot_)
    text += "";

  chrome.browserAction.setBadgeText({
    text: text
  });
  this.current_++;
  if (this.current_ == this.maxCount_)
    this.current_ = 0;
};

LoadingAnimation.prototype.start = function() {
  if (this.timerId_)
    return;

  var self = this;
  this.timerId_ = window.setInterval(function() {
    self.paintFrame();
  }, 100);
};

LoadingAnimation.prototype.stop = function() {
  if (!this.timerId_)
    return;

  window.clearInterval(this.timerId_);
  this.timerId_ = 0;
};

// Init stuff (from the gmail extension .. )

function onInit() {
  console.log('onInit');
  localStorage.requestFailureCount = 0; // used for exponential backoff
  startRequest({
    scheduleRequest: true,
    showLoadingAnimation: true
  });
  if (!oldChromeVersion) {
    // TODO(mpcomplete): We should be able to remove this now, but leaving it
    // for a little while just to be sure the refresh alarm is working nicely.
    chrome.alarms.create('watchdog', {
      periodInMinutes: 5
    });
  }
}

function onAlarm(alarm) {
  console.log('Got alarm', alarm);
  // |alarm| can be undefined because onAlarm also gets called from
  // window.setTimeout on old chrome versions.
  if (alarm && alarm.name == 'watchdog') {
    onWatchdog();
  } else {
    startRequest({
      scheduleRequest: true,
      showLoadingAnimation: false
    });
  }
}

function onWatchdog() {
  getWorkerStats();
  if (updates === 0) {
    updateUnreadCount();
  }
  chrome.alarms.get('refresh', function(alarm) {
    if (alarm) {
      console.log('Refresh alarm exists. Yay.');
    } else {
      console.log('Refresh alarm doesn\'t exist!? ' +
        'Refreshing now and rescheduling.');
      startRequest({
        scheduleRequest: true,
        showLoadingAnimation: false
      });
    }
  });
  // re-init the random watchdog
  var delay = Math.floor(Math.random() * 6) + 1;
  chrome.alarms.create('watchdog', {
    periodInMinutes: delay
  });
}

if (oldChromeVersion) {
  updateIcon();
  onInit();
} else {
  chrome.runtime.onInstalled.addListener(onInit);
  chrome.alarms.onAlarm.addListener(onAlarm);
}


if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(function() {
    console.log('Starting browser... updating icon.');
    startRequest({
      scheduleRequest: false,
      showLoadingAnimation: false
    });
    updateIcon();
  });
} else {
  // This hack is needed because Chrome 22 does not persist browserAction icon
  // state, and also doesn't expose onStartup. So the icon always starts out in
  // wrong state. We don't actually use onStartup except as a clue that we're
  // in a version of Chrome that has this problem.
  chrome.windows.onCreated.addListener(function() {
    console.log('Window created... updating icon.');
    startRequest({
      scheduleRequest: false,
      showLoadingAnimation: false
    });
    updateIcon();
  });
}

CTXMenu.generate();
