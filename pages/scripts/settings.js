$(function() {
  console.log('hello world');

  var $btnAdd = $('#add'),
      $url = $('#url'),
      $urls = $('#searchterms');

  console.log('this is ' + $btnAdd);

  function save() {
      console.log($('#searchterms').find('.url'));
      var terms = $('#searchterms').find('.url').map(function(i, el) {
          return el.textContent;
      }).get();
      chrome.storage.local.set({'searchterms': terms}, function() {
      });
  }

  $urls.on('click', 'a.edit', function(e) {
      e.preventDefault();
      
      var $a = $(this),
          $li = $a.closest('li'),
          url = $li.find('.url').text();
      $url.val(url);
      $btnAdd.addClass('edit-mode');
      $li.remove();
  });

  $urls.on('click', 'a.delete', function(e) {
      e.preventDefault();
      var $a = $(this),
          $li = $a.closest('li');
      $li.remove();
      save();
  });

  $btnAdd.on('click', function(e) {
      e.preventDefault();
      console.log($('#searchterms').find('.url').size());
      if($('#searchterms').find('.url').size() >= 5) {
        alert('you have reached the maximum search terms');
      }
      else {
        var url = $('#url').val().trim();
        if ( url ) {
            plusSearchTerm(url);
            save();
        }
      }
  });
  restoreOptions();
  // $('.notifications-radio, .background-tabs-radio, #RequestInterval').change(function(){
  //   saveOptions();
  // });
});

var selectReqInterval;
var radioNotifications;
var radioBackgroundTabs;

function initVariables() {
    chrome.storage.sync.get('requesters', function(items) {
        $('#requesters').empty();
        items.requesters.forEach(function(requester) {
            plusRequester(requester);
        });
    });
    chrome.storage.local.get('searchterms', function(items) {
        $('#searchterms').empty();
        items.searchterms.forEach(function(searchterm) {
            plusSearchTerm(searchterm);
        });
    });
}

function plusRequester(requester) {
    var $li = $('<li><img src="http://www.gravatar.com/avatar.php?gravatar_id=' + md5(requester['id']) + '&r=PG&s=15&default=identicon"/> <span class="requester">' + requester['name'] + '</span> <a href class="Delete">unsubscribe <span class="fa fa-trash-o"></span></a></li>');
    $('#requesters').append($li);
}

function plusSearchTerm(url) {
    var $li = $('<li><span class="url">' + url + '</span> <a href class="edit">edit</a> <a href class="delete">delete</a></li>');
    $('#searchterms').append($li);
}

function restoreOptions() {
  initVariables();
  var reqInterval = localStorage["RequestInterval"];
  for (var i=0; i<selectReqInterval.children.length; i++) {
    if (selectReqInterval[i].value == reqInterval) {
      selectReqInterval[i].selected = "true";
      break;
    }
  }
  var notifications = localStorage["Notifications"];
  for (var i=0; i<radioNotifications.length; i++) {
    if (radioNotifications[i].value == notifications) {
      radioNotifications[i].checked = "true";
    }
  }
  var backgroundTabs = localStorage["BackgroundTabs"];
  for (var i=0; i<radioBackgroundTabs.length; i++) {
    if (radioBackgroundTabs[i].value == backgroundTabs) {
      radioBackgroundTabs[i].checked = "true";
    }
  }
}

function saveOptions() {
  var interval = selectReqInterval.children[selectReqInterval.selectedIndex].value;
  localStorage["HN.RequestInterval"] = interval;

  for (var i=0; i<radioNotifications.length; i++) {
    if (radioNotifications[i].checked) {
      localStorage["HN.Notifications"] = radioNotifications[i].value;
      break;
    }
  }

  for (var i=0; i<radioBackgroundTabs.length; i++) {
    if (radioBackgroundTabs[i].checked) {
      localStorage["HN.BackgroundTabs"] = radioBackgroundTabs[i].value;
      break;
    }
  }
}