$(function() {
  console.log('hello world');

  var $btnAdd = $('#add'),
      $url = $('#url'),
      $urls = $('#searchterms');

  console.log('this is ' + $btnAdd);

  function save() {
      console.log($('#searchterms').find('.url'));
      var terms = $('#searchterms').find('.url').map(function(i, el) {
          var phrase = el.textContent.replace(/ /g, '+');
          return {'phrase':phrase, 'numtask': 0};
      }).get();
      chrome.storage.sync.set({'searchterms': terms}, function() {
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
  $('.sandbox-tabs-radio, #RequestInterval').change(function(){
    saveOptions();
  });
});

var selectReqInterval;
var radioSandbox;

function initVariables() {
  chrome.storage.sync.get('requesters', function(items) {
      $('#requesters').empty();
      items.requesters.forEach(function(requester) {
          plusRequester(requester);
      });
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
  chrome.storage.sync.get('searchterms', function(items) {
      $('#searchterms').empty();
      items.searchterms.forEach(function(searchterm) {
          plusSearchTerm(searchterm['phrase']);
      });
  });
  selectReqInterval = document.getElementById("RequestInterval");
  radioSandbox = document.getElementsByName("Sandbox");
}

function plusRequester(requester) {
  console.log(requester['id']);
    var $li = $('<li><img src="http://www.gravatar.com/avatar.php?gravatar_id=' + md5(requester['id']) + '&r=PG&s=15&default=identicon"/> <span class="requester">' + requester['name'] + '</span> <a href="#" class="requester-delete" data-id="'+requester['id']+'"> unsubscribe</a></li>');
    $('#requesters').append($li);
}

function plusSearchTerm(url) {
    var $li = $('<li><span class="url">' + url.replace('+',' ') + '</span> <a href class="edit">edit</a> <a href class="delete">delete</a></li>');
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
  var sandboxTabs = localStorage["Sandbox"];
  for (var i=0; i<radioSandbox.length; i++) {
    if (radioSandbox[i].value == sandboxTabs) {
      radioSandbox[i].checked = "true";
    }
  }
}

function attachEvent() {

}

function saveOptions() {
  var interval = selectReqInterval.children[selectReqInterval.selectedIndex].value;
  localStorage["RequestInterval"] = interval;

  for (var i=0; i<radioSandbox.length; i++) {
    if (radioSandbox[i].checked) {
      localStorage["Sandbox"] = radioSandbox[i].value;
      break;
    }
  }
}