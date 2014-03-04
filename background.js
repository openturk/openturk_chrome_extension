// Variables for the task management
var storage = chrome.storage.sync;
var obj = {};
var index = {};
var updates = 0;

// var version = chrome.app.getDetails().version; 
// if (version != "0.0.9")
// {
//   storage.clear();
// }
// localStorage.clear();

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

SetInitialOption("RequestInterval", 1);
SetInitialOption("Sandbox", false);

localStorage['batchs'] = false;
localStorage['search'] = false;
localStorage['newbatchs'] = [];
localStorage['newterms'] = [];
var newbatchs = [];
var newterms = [];

function SetInitialOption(key, value) {
  if (localStorage[key] == null) {
    localStorage[key] = value;
  }
}

// Some random init for test
// storage.clear();
// obj['requesters'] = [{"name":"CrowdSource","id":"A2SUM2D7EOAK1T","numtask":0},{"name":"Philippe Cudre-Mauroux","id":"A28PIN9Y6KHR3H","numtask":0},{"name":"Roman","id":"A165LMPFHNTKFG","numtask":0}];
// storage.set(obj);

// Variables for the content script
var group_id;
var autoaccept;

// Set the Listener for the autoaccept
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (typeof request.group_id !== "undefined" && request.group_id !== "undefined") {
      group_id = request.group_id;
      sendResponse({
        group_id: group_id
      });
    }

    if (request.group_id_get) {
      sendResponse({
        group_id: group_id
      });
    }

    if (request.get_mturk_host) {
      sendResponse({
        mturk_host: (localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com"
      });
    }

    if (request.autoaccept !== null) {
      autoaccept = request.autoaccept;
    }

    if (request.autoaccept_get) {
      sendResponse({
        autoaccept: autoaccept
      });
    }

    if (request.reset === "resetIcon") {
      console.log('msg: reset the icon');
      updates = 0;
      localStorage['batchs'] = false;
      localStorage['search'] = false;
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
    if (request.fetch) {
      console.log('msg: reloading data');
      loadSearchTerms();
      loadRequesters();
    }
  }
);

function addRequester(req) {
  console.log('saving');
  if (!obj.requesters) {
    obj['requesters'] = []
  }
  obj.requesters.push(req);
  saverequesters();
  getNewBatchs();
  indexRequesters();
}

function deleteRequester(req) {
  console.log(req);
  obj.requesters = obj.requesters.filter(function(el) {
    return el.id != req.id;
  });
  saverequesters();
  indexRequesters();
}

function loadRequesters() {
  storage.get('requesters', function(items) {
    obj['requesters'] = [];
    $(items.requesters).each(function() {
      obj.requesters.push(this);
    })
    indexRequesters();
    getNewBatchs();
  });
}

function loadSearchTerms() {
  storage.get('searchterms', function(items) {
    obj['searchterms'] = [];
    $(items.searchterms).each(function() {
      obj.searchterms.push(this);
    });
    getNewSearch();
  });
}

function loadWorkHistory() {
  storage.get('workhistory', function(items) {
    obj['workhistory'] = [];
    $(items.workhistory).each(function() {
      obj.workhistory.push(this);
    })
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

function savesearchterms() {
  chrome.storage.sync.set({
      'searchterms': obj.searchterms
    });
}

function saverequesters() {
  chrome.storage.sync.set({
      'requesters': obj.requesters
    });
}

function saveworkhist() {
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
      items.requesters.forEach(function(url) {
        scrapForBatchs(url);
      });
    }
  });
}

function getNewSearch() {
  storage.get('searchterms', function(items) {
    if (typeof items.searchterms !== "undefined") {
      items.searchterms.forEach(function(phrase) {
        scrapForSearch(phrase);
      });
    }
  });
}

function getWorkerStats() {
  $.get('https://'+((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com")+'/mturk/dashboard', {}, function(data) {
    var rewards = $(data).find('.reward');
    var hit_submitted = $(data).filter("table").find("td.metrics-table-first-value:contains('HITs Submitted')").next().text();
    var balance = {
      total_earnings: parseInt($(rewards[2]).html().replace('$','')),
      hit_submitted: parseInt(hit_submitted)
    };
    obj.workhistory.push(balance);
    saveworkhist();
  });
}

function printTasks() {
  if (typeof obj.requesters !== "undefined") {
    obj.requesters.forEach(function(url) {
      console.log(url['name'] + ':' + url['numtask']);
    });
  }
}

function scrapForBatchs(url) {
  $.ajax({
    url: 'https://'+((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com")+'/mturk/searchbar' + '?selectedSearchType=hitgroups' + '&qualifiedFor=on' + '&requesterId=' + url['id'],
    success: function(result) {
      var spanText = $(result).find("td:contains('Results')").text();
      var resPattern = /of (.*) Results/;
      var res = spanText.match(resPattern);
      if (res) {
        res = res[1];
        var id = url['id'];
        var old_res = index[id].numtask;
        if (res != old_res) {
          console.log('doing some update');
          index[id].numtask = res;
          if(res > old_res) {
            var diff = res - old_res;
            updates = updates + diff;
            localStorage['batchs'] = true;
            var diff = res - old_res;
            console.log('Requester diff: ' + diff);
            updateUnreadCount();
            if(!(id in newbatchs)) {
              newbatchs.push(id);
            }
            localStorage['newbatchs'] = JSON.stringify(newbatchs);
          }
          saverequesters();
        }
      }
    },
    error: function(xhr, status) {
      // do something when it's wrong
    }
  });
}

function scrapForSearch(phrase) {
  $.ajax({
    url: 'https://'+((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com")+'/mturk/searchbar' + '?selectedSearchType=hitgroups' + '&qualifiedFor=on' + '&searchWords=' + phrase['phrase'],
    success: function(result) {
      var spanText = $(result).find("td:contains('Results')").text();
      var resPattern = /of (.*) Results/;
      console.log('https://'+((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com")+'/mturk/searchbar' + '?selectedSearchType=hitgroups' + '&qualifiedFor=on' + '&searchWords=' + phrase['phrase']);
      var res = spanText.match(resPattern);
      if (res) {
        res = res[1];
        var old_res = phrase['numtask'];
        console.log('searchgin for : ' + phrase['phrase'] + ' ' + res);
        if (res != old_res) {
          console.log('changed number of tasks: ' + phrase['numtask']);
          phrase['numtask'] = res;
          modifyCount(phrase['phrase'], res);
          if(res > old_res) {
            var diff = res - old_res;
            updates = updates + diff;
            localStorage['search'] = true;
            console.log('Search diff: ' + diff);
            updateUnreadCount();
            if(!(phrase in newterms)) {
              newterms.push(phrase['phrase']);
            }
            localStorage['newterms'] = JSON.stringify(newterms);
          }
          savesearchterms();
        }
      }
    },
    error: function(xhr, status) {
      // do something when it's wrong
    }
  });
}

setTimeout(function() {
  console.log('Fetching new Batchs !');
  getNewBatchs();
  printTasks();
}, 1000)


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
  // var randomness = Math.random() * 2;
  // var exponent = Math.pow(2, localStorage.requestFailureCount || 0);
  // var multiplier = Math.max(randomness * exponent, 1);
  // var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
  // delay = Math.round(delay);
  delay = parseInt(localStorage['RequestInterval']);
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
  getWorkerStats();
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
    updateIcon();
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
  if (changed)
    animateFlip();
}

function updateIcon() {
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
    chrome.browserAction.setBadgeBackgroundColor({
      color: [208, 0, 24, 255]
    });
    chrome.browserAction.setBadgeText({
      text: localStorage.unreadCount != "0" ? "new" : ""
    });
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
}

LoadingAnimation.prototype.start = function() {
  if (this.timerId_)
    return;

  var self = this;
  this.timerId_ = window.setInterval(function() {
    self.paintFrame();
  }, 100);
}

LoadingAnimation.prototype.stop = function() {
  if (!this.timerId_)
    return;

  window.clearInterval(this.timerId_);
  this.timerId_ = 0;
}

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
