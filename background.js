// Variables for the task management
var storage = chrome.storage.local;
var obj = {};
var index = {};

// Legacy support for pre-event-pages.
var oldChromeVersion = !chrome.runtime;
var requestTimerId;

// More Vars
var animationSpeed = 10; // ms
var animationFrames = 36;
var animationSpeed = 10; // ms
var pollIntervalMin = 1; // 1 minute
var pollIntervalMax = 60; // 1 hour
var requestTimeout = 1000 * 2; // 2 seconds
var rotation = 0;
var loadingAnimation = new LoadingAnimation();

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

    if (typeof request.autoaccept !== "undefined") {
      autoaccept = request.autoaccept;
    }
    if (request.autoaccept_get) {
      sendResponse({
        autoaccept: autoaccept
      });
    }
  }
);


function loadRequesters() {
  storage.get('requesters', function(items) {
    obj = items;
    indexRequesters();
  });
}

function indexRequesters() {
  $(obj.requesters).each(function() {
    index[this.id] = this;
  });
}

function save() {
  console.log('saving ... ');
  chrome.storage.sync.set(obj);
}


loadRequesters();

function getNewBatchs() {
  storage.get('requesters', function(items) {
    if (typeof items.requesters !== "undefined") {
      items.requesters.forEach(function(url) {
        scrapForBatchs(url);
      });
    }
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
    url: 'https://workersandbox.mturk.com/mturk/searchbar' + '?selectedSearchType=hitgroups' + '&qualifiedFor=on' + '&requesterId=' + url['id'],
    success: function(result) {
      var spanText = $(result).find("td:contains('Results')").text();
      var resPattern = /of (.*) Results/;
      var res = spanText.match(resPattern)[1];
      id = url['id'];
      // if(res != index[id].numtask ) {
      console.log('doing some update');
      index[id].numtask = res;
      save();
      // }
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


chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
      'Old value was "%s", new value is "%s".',
      key,
      namespace,
      storageChange.oldValue,
      storageChange.newValue);
    setBadge(storageChange.newValue.length.toString());
  }
});

function setBadge(text) {
  chrome.browserAction.setBadgeText({
    text: text
  });
}

// Setting an alarm scheduler

function scheduleRequest() {
  console.log('scheduleRequest');
  var randomness = Math.random() * 2;
  var exponent = Math.pow(2, localStorage.requestFailureCount || 0);
  var multiplier = Math.max(randomness * exponent, 1);
  var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
  delay = Math.round(delay);
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

  updateUnreadCount(3);
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

function updateUnreadCount(count) {
  var changed = localStorage.unreadCount != count;
  localStorage.unreadCount = count;
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
      path: "icons/icon128.png"
    });
    chrome.browserAction.setBadgeBackgroundColor({
      color: [208, 0, 24, 255]
    });
    chrome.browserAction.setBadgeText({
      text: localStorage.unreadCount != "0" ? localStorage.unreadCount : ""
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
