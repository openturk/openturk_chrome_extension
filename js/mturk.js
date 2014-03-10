$(document).ready(function() {
  var storage = chrome.storage.sync;
  var form = '';
  var openturk_endpoint = 'http://alpha.openturk.com/endpoint/redirect';
  var autoaccept = true;

  function getWorkerId(callback) {
    chrome.runtime.sendMessage({
      get_mturk_host: true
    }, function(response) {
      $.get('https://' + response.mturk_host + '/mturk/dashboard', {}, function(data) {
        var spanText = $(data).filter("table").find("span:contains('Worker ID')").text();
        var workerIdPattern = /Worker ID: (.*)$/;
        var workerId = spanText.match(workerIdPattern)[1];
        callback(workerId);
      });
    });
  }

  function getUrlParameters(link) {
    if (typeof link === 'undefined') {
      link = window.location.href;
    }
    var params = [],
      hash;
    var hashes = link.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
      hash = hashes[i].split('=');
      params.push(hash[0]);
      params[hash[0]] = hash[1];
    }
    return params;
  }

  function setGroupId() {
    var groupId = getUrlParameters()['groupId'];
    if (typeof groupId !== "undefined") {
      chrome.runtime.sendMessage({
        group_id: groupId
      }, function(response) {});
    }
    return groupId;
  }
  setGroupId();

  function getGroupId(callback) {
    chrome.runtime.sendMessage({
      group_id_get: true
    }, function(response) {
      var groupId = response.group_id;
      if (typeof groupId === "undefined") {
        groupId = "undefined";
      } else {}
      callback(groupId);
    });
  }

  function setAutoAccept(autoaccept) {
    if ($('input[name=autoAcceptEnabled]').length > 0) {
      chrome.runtime.sendMessage({
        autoaccept: autoaccept
      });
    }
  }

  function getAutoAccept(callback) {
    chrome.runtime.sendMessage({
      autoaccept_get: true
    }, function(response) {
      callback(response.autoaccept);
    });
  }

  function postAndRedirect(form) {
    request = $.ajax({
      url: form.attr('action'),
      type: "POST",
      data: form.serialize()
    }).done(function() {
      log(redirect, false, false);
    });
  }

  function redirect() {
    var jqxhr = $.getJSON(openturk_endpoint).done(function(data) {
      var redirectUrl = data.url[0];
      window.top.location.href = redirectUrl;
    });
  }

  function redirectme(redirectUrl) {
    window.top.location.href = redirectUrl;
  }

  function log(callback, hitSkipped, batchSkipped) {
    getWorkerId(function(workerId) {
      if (typeof workerId === "undefined") {
        workerId = "undefined";
      }
      getGroupId(function(groupId) {
        data = {
          worker_id: workerId,
          group_id: groupId,
          hit_skipped: hitSkipped,
          batch_skipped: batchSkipped
        };
        request = $.ajax({
          url: 'http://alpha.openturk.com/endpoint/log',
          type: "POST",
          data: data
        }).always(function() {
          callback();
        });
      });
    });
  }

  function star(callback) {

    getWorkerId(function(workerId) {
      if (typeof workerId === "undefined") {
        workerId = "undefined";
      }
      getGroupId(function(groupId) {
        var rewardText = $("table").find("td:contains('Reward')").next().text();
        var rewardPattern = /([0-9\.]*) per/;
        var reward = parseFloat(rewardText.match(rewardPattern)[1]);

        var hitsAvailable = parseFloat($.trim($("table").find("td:contains('HITs Available')").next().text()));

        var duration = $.trim($("table").find("td:contains('Duration')").next().text());

        data = {
          worker_id: workerId,
          group_id: groupId,
          reward: reward,
          duration: duration,
          hits_available: hitsAvailable,
          message: $('#star_message').val()
        };
        request = $.ajax({
          url: 'http://alpha.openturk.com/endpoint/star',
          type: "POST",
          data: data
        }).always(function(data) {
          callback();
        });
      });
    });
  }

  // THE AUTO-REDIRECT BLOCK
  // Always check auto accept next HIT
  // $('input[name=autoAcceptEnabled]').prop('checked', true);
  // setAutoAccept(true);
  // $('input[name=autoAcceptEnabled]').click(function(event) {
  //   setAutoAccept($('input[name=autoAcceptEnabled]').is(':checked'));
  // });

  // if ($('#mturk_form').length > 0) {
  //   $('#mturk_form').on("submit", function(e, hint) {
  //     if (typeof hint === "undefined") {
  //       e.preventDefault();
  //       getAutoAccept(function(autoaccept) {
  //         if (autoaccept) {
  //           log(function() {
  //             $('#mturk_form').trigger("submit", true);
  //           }, false, false);
  //         } else {
  //           $($(this).find('input[type=submit]')[0]).prop('disabled', true);
  //           postAndRedirect($(this));
  //         }
  //       });
  //     }
  //   });
  // } else if ($('form[name=hitForm]').length > 0) {
  //   form = $('form[name=hitForm]')[0];
  //   $('input[name="/submit"]').on("click", function(e, hint) {
  //     if (typeof hint === "undefined") {
  //       e.preventDefault();
  //       getAutoAccept(function(autoaccept) {
  //         if (autoaccept) {
  //           log(function() {
  //             $('input[name="/submit"]').trigger("submit", true);
  //           }, false, false);
  //         } else {
  //           $(this).prop('disabled', true);
  //           postAndRedirect($(form));
  //         }
  //       });
  //     }
  //   });
  // }

  //Add subscribe buttons
  storage.get('requesters', function(items) {
    var obj = items;
    var already = {};
    if (obj.requesters) {
      for (var j = 0; j < obj.requesters.length; j++) {
        already[obj.requesters[j].id] = true;
      }
    }
    var tasks = $('div > table > tbody > tr > td > table');
    for (var i = 0; i < tasks.length; i += 2) {
      var task = $(tasks[i]);
      var tr = $(task.find('tbody > tr > td > table > tbody > tr > td > table > tbody > tr')[0]);
      var requester = $(tr.find('td > a')[1]);
      var requesterId = getUrlParameters('lala?' + requester.attr('href'))['requesterId'];
      var requesterName = requester.html();
      var insertAfterElt = tr.find('td').eq(1);
      insertAfterElt.attr('width', 100);

      if (!(requesterId in already)) {
        insertAfterElt.after('<a class="subscribe btn btn-icon" data-id="' + requesterId + '" data-name="' + requesterName + '"><span class="icon-star3"></span></button></td>');
      }
    }

    //also add it on HIT page
    var el = $('td[class="capsulelink_bold"]').next().next();
    requesterId =  $('input[name=requesterId').val();
    requesterName = $('input[name=prevRequester').val();
    el.after('<td width="100" valign="middle" nowrap>&nbsp;<span class="capsulelink"><a class="subscribe" href="#" data-id="' + requesterId + '" data-name="' + requesterName + '">&#187; Star requester</a></span></td>');

    //bind events
    $('.subscribe').click(function(e) {
      chrome.runtime.sendMessage({
        addRequester: {
          "name": $(this).attr('data-name'),
          "id": $(this).attr('data-id'),
          "numtask": 0
        }
      }, function(response) {});
      $('.subscribe[data-id=' + $(this).attr('data-id') + ']').hide();
    });
  });

  // MANUAL RECOMMENDATION HIT
  // Add Recommendation button
  $('#searchbar').after('<div class="clear"><button id="recommendation-button" class="btn btn-warning">Recommend me a HIT</button></div>');
  $('#recommendation-button').click(function(e) {
    e.preventDefault();
    fetchHit();
  });
  var attempt = 0;
  var max_attempt = 10p;
  function fetchHit() {
    if(attempt < max_attempt) {
      var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/next').done(function(result) {
        if (result) {   
          var group_id = result.next;
          var url = 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/preview?groupId=' + group_id;
          validateRecommendation(url, redirectme);
        } 
      });
    } else {
      console.log('max attempts achieved.' +  attempts);
      $('#recommendation-button').html('0 for now (try later)');
    }
  }
  // Alerts if needed ...
  // if(cond) {
  //   $('#subtabs_and_searchbar').after('<div class="message info"><span class="icon"></span><h6><span id="alertboxHeader">HITs that need your attention.</span></h6></div>');
  // }

  function validateRecommendation(url, callback) {
    $.get(url, {}, function(data) {
      var title = $(data).find('.capsulelink_bold');
      console.log(url);
      attempt ++;
      console.log(url);
      if (title.length > 0) {
        console.log(url + " - success redirect");
        callback(url);
      } else {
        console.log(url + " - failure retry");
        fetchHit();
      }
    });
  }



  //Add the ShareHIT Button
  getGroupId(function(group_id) {
    var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
      var el = $('td[class="capsulelink_bold"]').next().next();
      // $('td[class="capsulelink_bold"]').after('<td align="right" valign="middle" width="250" nowrap=""><span class="capsulelink"><a href="/mturk/preview?groupId=2KGW3K4F0OHOS2X5OUBO9L95OFJ10P">Share HIT</a></span></td>');
      if (typeof result.username !== "undefined") {
        $(el)
          .append('<span class="capsulelink"><a href="#" id="sharehit">&#187; Share HIT</a></span>')
          .after('<div id="modal" style="display:none;z-index:10;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;"><h2>We will post the following message on mturkforum.com</h2><textarea id="star_message" style="width: 340px; height: 100px">OpenTurk user ' + (result.username) + ' recommended the following task: ' + group_id + '</textarea><br /><input id="modal_submit" type="submit" value="ok"><input id="modal_cancel" type="submit" value="cancel"></div>');
      } else {
        $(el)
          .append('<span class="capsulelink"><a href="#" id="sharehit">&#187; Share HIT</a></span>')
          .after('<div id="modal" style="display:none;z-index:10;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;"><h2>Please log in on <a href="http://alpha.openturk.com/accounts/login/">OpenTurk.com</a></h2></div>');
      }
      $('#sharehit').click(function(e) {
        e.preventDefault();
        var left = Math.max($(window).width() - $('#modal').outerWidth(), 0) / 2;
        $('#modal').css({
          left: left + $(window).scrollLeft()
        });
        $('#modal').toggle();
      });
      $('#modal_cancel').click(function(e) {
        e.preventDefault();
        $('#modal').toggle();
      });
      $('#modal_submit').click(function(e) {
        e.preventDefault();
        $('#modal').toggle();
        star(function() {});
      });
    });
  });

});
