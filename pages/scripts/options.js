$(function() {
  console.log('Hello world');

  var $btnAddSearchTerm = $('#btnAddSearchTerm'),
    $terminput= $('#terminput'),
    $searchterms = $('#searchterms');

  console.log('this is ' + $btnAddSearchTerm);

  $btnAddSearchTerm.on('click', function(e) {
    e.preventDefault();
    console.log($('#searchterms').find('.url').size());
    if ($('#searchterms').find('.url').size() >= 5) {
      alert('you have reached the maximum search terms');
    } else {
      var term = $('#terminput').val().trim();
      if (term) {
        var termobj = {
            'phrase': term,
            'numtask': 0
          }
        obj.searchterms.push(termobj);
        plusSearchTerm(term);
        savesearchterms();
      }
    }
  });

  $terminput.keyup(function(event) {
    if (event.keyCode == 13) {
      $btnAddSearchTerm.click();
    }
  });

  restoreOptions();
  $('.sandbox-tabs-radio, #RequestInterval').change(function() {
    saveOptions();
  });
});

var obj = {};
var index = {};

var selectReqInterval;
var radioSandbox;

function savesearchterms() {
  chrome.storage.sync.set({
    'searchterms': obj.searchterms
  }, function() {
    console.log('opt: reload the searchterms');
    chrome.extension.sendMessage({
      fetch: "true"
    });
  });
}

function initVariables() {
  // Init the requesters
  chrome.storage.sync.get('requesters', function(items) {
    $('#requesters').empty();
    // Loading the requesters.
    obj.requesters = [];
    $(items.requesters).each(function() {
      obj.requesters.push(this);
      plusRequester(this);
    });
    // Setup the requester delete action
    $('.requester-delete').click(function(e) {
      e.preventDefault();
      console.log("clicked");
      chrome.runtime.sendMessage({
        deleteRequester: {
          "name": $(this).attr('data-name'),
          "id": $(this).attr('data-id'),
          "numtask": 0
        }
      }, function(response) {});
      var $a = $(this),
        $li = $a.closest('li');
      $li.remove();
    });
  });
  // Init the search terms
  chrome.storage.sync.get('searchterms', function(items) {
    $('#searchterms').empty();
    obj.searchterms = [];
    $(items.searchterms).each(function() {
      obj.searchterms.push(this);
      plusSearchTerm(this['phrase']);
    });
    // Setup the term delete action
    $('.term-delete').click(function(e) {
      e.preventDefault();
      var phrase = $(this).attr('data-name');
      console.log("clicked:" + phrase);
      $(obj.searchterms).each(function(i) {
        console.log(this.phrase + 'vs' + phrase);
        if (this.phrase == phrase) {
          console.log('removing:');
          console.log(this);
          delete obj.searchterms[i];
        }
      });
      savesearchterms();
      var $a = $(this),
      $li = $a.closest('li');
      $li.remove();
    });
  });
  // load the thingies ..
  selectReqInterval = document.getElementById("RequestInterval");
  radioSandbox = document.getElementsByName("Sandbox");
}

function plusRequester(requester) {
  console.log(requester['id']);
  var $li = $('<li><img src="http://www.gravatar.com/avatar.php?gravatar_id=' + md5(requester['id']) + '&r=PG&s=15&default=identicon"/> <span class="requester">' + requester['name'] + '</span> <a href="#" class="requester-delete" data-id="' + requester['id'] + '"> unsubscribe</a></li>');
  $('#requesters').append($li);
}

function plusSearchTerm(phrase) {
  var $li = $('<li><span class="url">' + phrase.replace('+', ' ') + '</span> <a href="#" class="term-delete" data-name="' + phrase + '"> delete</a></li>');
  $('#searchterms').append($li);
}

function restoreOptions() {
  initVariables();
  var reqInterval = localStorage["RequestInterval"];
  for (var i = 0; i < selectReqInterval.children.length; i++) {
    if (selectReqInterval[i].value == reqInterval) {
      selectReqInterval[i].selected = "true";
      break;
    }
  }
  var sandboxTabs = localStorage["Sandbox"];
  for (var i = 0; i < radioSandbox.length; i++) {
    if (radioSandbox[i].value == sandboxTabs) {
      radioSandbox[i].checked = "true";
    }
  }
}


function saveOptions() {
  // simply save the thingies
  var interval = selectReqInterval.children[selectReqInterval.selectedIndex].value;
  localStorage["RequestInterval"] = interval;

  for (var i = 0; i < radioSandbox.length; i++) {
    if (radioSandbox[i].checked) {
      localStorage["Sandbox"] = radioSandbox[i].value;
      break;
    }
  }
}
