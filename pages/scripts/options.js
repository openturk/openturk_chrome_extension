$(function() {

  $('.inlinebar').sparkline([100, localStorage.TGP, 100, 66, 33], {
    type: 'bullet',
    width: '215',
    performanceColor: 'green'
  });

  var $btnAddSearchTerm = $('#btnAddSearchTerm'),
    $terminput = $('#terminput'),
    $searchterms = $('#searchterms');

  $btnAddSearchTerm.on('click', function(e) {
    e.preventDefault();
    // console.log($('#searchterms').find('.url').size());
    if ($('#searchterms').find('.url').size() >= 20) {
      alert('You have reached the maximum allowed scheduled search terms');
    } else {
      var term = $('#terminput').val().trim();
      if (term) {
        var termobj = {
          'phrase': term,
          'numtask': 0
        };
        obj.searchterms.push(termobj);
        plusSearchTerm(term);
        savesearchterms();
      }
    }
  });

  $terminput.keyup(function(event) {
    if (event.keyCode == 13) {
      $btnAddSearchTerm.click();
      $(this).val('');
    }
  });

  restoreOptions();
  $('.sandbox-tabs-radio, .reqnotif-tabs-radio, .termnotif-tabs-radio, #RequestInterval').change(function() {
    saveOptions();
  });
  $('#target, .logging-tabs-radio, .qualif-tabs-radio, #HITTotal, #HITApproval').change(function() {
    saveOptions();
  });

  // autocomplete
  $.extend($.ui.autocomplete.prototype, {
    _renderItem: function(ul, item) {
      var term = this.element.val(),
        html = item.label.concat(' (', item.id, ')').replace(new RegExp(term, "ig"), "<b style='color: red;'>$&</b>");
      return $("<li></li>")
        .data("item.autocomplete", item)
        .append($("<a></a>").html(html))
        .appendTo(ul);
    }
  });
  $("#requester_list").autocomplete({
    source: function(request, response) {
      jQuery.get("http://alpha.openturk.com/endpoint/requester", {
        query: request.term
      }, function(data) {
        response(data);
      }, 'json');
    },
    minLength: 3,
    select: function(event, ui) {
      event.preventDefault();
      if (!index[ui.item.id]) {
        var new_req = {
          "name": ui.item.label,
          "id": ui.item.id,
          "numtask": 0
        };
        obj.requesters.push(new_req);
        plusRequester(new_req);
        indexRequesters();
        chrome.runtime.sendMessage({
          addRequester: new_req
        }, function(response) {});
      }
      $(this).val('');
    }
  });
  $("#blocked_list").autocomplete({
    source: function(request, response) {
      jQuery.get("http://alpha.openturk.com/endpoint/requester", {
        query: request.term
      }, function(data) {
        response(data);
      }, 'json');
    },
    minLength: 3,
    select: function(event, ui) {
      event.preventDefault();
      if (!index[ui.item.id]) {
        var new_req = {
          "name": ui.item.label,
          "id": ui.item.id,
          "numtask": 0,
          "blocked": true
        };
        obj.requesters.push(new_req);
        plusRequester(new_req);
        indexRequesters();
        chrome.runtime.sendMessage({
          addRequester: new_req
        }, function(response) {});
      }
      $(this).val('');
    }
  });
});

var obj = {};
var index = {};

var selectReqInterval;
var radioSandbox;
var radioReq;
var radioTerm;
var radioMaster;
var radioCatMaster;
var radioPhotoMaster;
var HITTotal;
var HITApproval;

function savesearchterms() {
  chrome.storage.sync.set({
    'searchterms': obj.searchterms
  }, function() {
    // console.log('opt: reload the searchterms');
    chrome.extension.sendMessage({
      fetch: "true"
    });
  });
}

function initVariables() {
  // Init the requesters
  chrome.storage.sync.get('requesters', function(items) {
    $('#requesters').empty();
    $('#requesters_blocked').empty();
    // Loading the requesters.
    obj.requesters = [];
    $(items.requesters).each(function() {
      obj.requesters.push(this);
      plusRequester(this);
    });
    indexRequesters();
    // Setup the requester delete action
    $('.requester-unsubscribe').click(function(e) {
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
    $('.requester-unblock').click(function(e) {
      e.preventDefault();
      console.log("clicked");
      chrome.runtime.sendMessage({
        unblockRequester: {
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
  radioReq = document.getElementsByName("Reqnotif");
  radioTerm = document.getElementsByName("Termnotif");
  radioLog = document.getElementsByName("Logging");
  radioMaster = document.getElementsByName("Master");
  radioCatMaster = document.getElementsByName("CatMaster");
  radioPhotoMaster = document.getElementsByName("PhotoMaster");
  HITTotal = document.getElementById("HITTotal");
  HITApproval = document.getElementById("HITApproval");
  targetField = $("#target");
}

function indexRequesters() {
  $(obj.requesters).each(function() {
    index[this.id] = this;
  });
}

var TURKOPTICON_BASE = "http://turkopticon.differenceengines.com/";

function plusRequester(requester) {
  var rid = requester['id'];
  var rname = requester['name'];
  var $li = $('<li><img src="http://www.gravatar.com/avatar.php?gravatar_id=' + md5(rid) + '&r=PG&s=15&default=identicon"></img> <span class="requester">' + requester['name'] + '</span> <a href="#" class="requester-unsubscribe" data-id="' + rid + '"> <span class="del fa fa-trash-o"></span></a></li>');
  var $li2 = $('<li><img src="http://www.gravatar.com/avatar.php?gravatar_id=' + md5(rid) + '&r=PG&s=15&default=identicon"></img> <span class="requester">' + requester['name'] + '</span> <a href="#" class="requester-unblock" data-id="' + rid + '"> <span class="del fa fa-trash-o"></span></a></li>');
  var TOEndpoint = 'http://api.turkopticon-devel.differenceengines.com/multi-attrs.php?ids=' + rid;
  if (!requester['blocked']) {
    $('#requesters').append($li);
  } else {
    $('#requesters_blocked').append($li2);
  }
  var jqxhr = $.getJSON(TOEndpoint).done(rid, rname, function(data) {
    var d = [];
    if (data[rid]) {
      d[0] = data[rid].attrs['comm'];
      d[1] = data[rid].attrs['pay'];
      d[2] = data[rid].attrs['fair'];
      d[3] = data[rid].attrs['fast'];

      $("[data-id='" + rid + "']").after('<div class="tob"><span class="toc">&#9660;</span> <span class="tom"><img src="http://data.istrack.in/turkopticon.php?data=' + d.join(',') + '"><a href="' + TURKOPTICON_BASE + 'report?requester[amzn_id]=' + rid + '&requester[amzn_name]=' + rname + '">Report your experience with this requester &raquo;</a><br>Scores based on <a href="' + TURKOPTICON_BASE + rid + '"> these reviews</a></span></div>');
    } else {
      $("[data-id='" + rid + "']").after('<div class="tob"><span>&#9660;</span> <span class="tom"><a href="' + TURKOPTICON_BASE + 'report?requester[amzn_id]=' + rid + '&requester[amzn_name]=' + rname + '">Report your experience with this requester &raquo;</a></span></div>');
    }
  });
}

function plusSearchTerm(phrase) {
  var $li = $('<li><span class="url">' + phrase.replace('+', ' ') + '</span> <a href="#" class="term-delete" data-name="' + phrase + '" title="delete"> <span class="del fa fa-trash-o" alt="delete"></span></a></li>');
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
  if (reqInterval < 5) {
    $('#rateWarning').show();
  } else {
    $('#rateWarning').hide();
  }

  var sandboxTabs = localStorage["Sandbox"];
  for (i = 0; i < radioSandbox.length; i++) {
    if (radioSandbox[i].value == sandboxTabs) {
      radioSandbox[i].checked = "true";
    }
  }
  var reqTabs = localStorage["Reqnotif"];
  for (i = 0; i < radioReq.length; i++) {
    if (radioReq[i].value == reqTabs) {
      radioReq[i].checked = "true";
    }
  }
  var termTabs = localStorage["Termnotif"];
  for (i = 0; i < radioTerm.length; i++) {
    if (radioTerm[i].value == termTabs) {
      radioTerm[i].checked = "true";
    }
  }
  var logTabs = localStorage["Logging"];
  for (i = 0; i < radioLog.length; i++) {
    if (radioLog[i].value == logTabs) {
      radioLog[i].checked = "true";
    }
  }
  var masterTabs = localStorage["Master"];
  for (i = 0; i < radioMaster.length; i++) {
    if (radioMaster[i].value == masterTabs) {
      radioMaster[i].checked = "true";
    }
  }
  var catMasterTabs = localStorage["CatMaster"];
  for (i = 0; i < radioCatMaster.length; i++) {
    if (radioCatMaster[i].value == catMasterTabs) {
      radioCatMaster[i].checked = "true";
    }
  }
  var photoMasterTabs = localStorage["PhotoMaster"];
  for (i = 0; i < radioPhotoMaster.length; i++) {
    if (radioPhotoMaster[i].value == photoMasterTabs) {
      radioPhotoMaster[i].checked = "true";
    }
  }

  var HITTotalField = localStorage["HITTotal"];
  HITTotal.value = HITTotalField;
  var HITApprovalField = localStorage["HITApproval"];
  HITApproval.value = HITApprovalField;

  var num = localStorage["Target"];
  targetField.val(num / 100);
  $("#price").html("$" + num / 100);
}


function saveOptions() {
  // simply save the thingies
  var interval = selectReqInterval.children[selectReqInterval.selectedIndex].value;
  if (interval < 5) {
    $('#rateWarning').show();
  } else {
    $('#rateWarning').hide();
  }
  localStorage["RequestInterval"] = interval;

  for (var i = 0; i < radioSandbox.length; i++) {
    if (radioSandbox[i].checked) {
      localStorage["Sandbox"] = radioSandbox[i].value;
      break;
    }
  }
  for (i = 0; i < radioReq.length; i++) {
    if (radioReq[i].checked) {
      localStorage["Reqnotif"] = radioReq[i].value;
      break;
    }
  }
  for (i = 0; i < radioTerm.length; i++) {
    if (radioTerm[i].checked) {
      localStorage["Termnotif"] = radioTerm[i].value;
      break;
    }
  }
  for (i = 0; i < radioLog.length; i++) {
    if (radioLog[i].checked) {
      localStorage["Logging"] = radioLog[i].value;
      break;
    }
  }
  for (i = 0; i < radioMaster.length; i++) {
    if (radioMaster[i].checked) {
      localStorage["Master"] = radioMaster[i].value;
      break;
    }
  }
  for (i = 0; i < radioCatMaster.length; i++) {
    if (radioCatMaster[i].checked) {
      localStorage["CatMaster"] = radioCatMaster[i].value;
      break;
    }
  }
  for (i = 0; i < radioPhotoMaster.length; i++) {
    if (radioPhotoMaster[i].checked) {
      localStorage["PhotoMaster"] = radioPhotoMaster[i].value;
      break;
    }
  }

  localStorage["HITTotal"] = HITTotal.value;
  localStorage["HITApproval"] = HITApproval.value;

  localStorage["Target"] = parseInt(targetField.val()) * 100;
  $("#price").html("$" + targetField.val());
}
