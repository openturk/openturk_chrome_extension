$(document).ready(function() {
  var storage = chrome.storage.sync;
  var form = '';
  var openturk_endpoint = 'http://alpha.openturk.com/endpoint/redirect';
  var autoaccept = true;

  if ($('#font-awesome-style').length == 0) {
    var fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.id = 'font-awesome-style';
    fontAwesomeLink.href = chrome.extension.getURL('pages/styles/font-awesome/css/font-awesome.min.css');
    document.head.appendChild(fontAwesomeLink);
  }

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

      data = {
        worker_id: workerId,
        group_id: getUrlParameters()['groupId'],
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
  }

  function recommend() {

    getWorkerId(function(workerId) {
      if (typeof workerId === "undefined") {
        workerId = "undefined";
      }

      var rewardText = $("table").find("td:contains('Reward')").next().text();
      var rewardPattern = /([0-9\.]*) per/;
      var reward = parseFloat(rewardText.match(rewardPattern)[1]);

      var hitsAvailable = parseFloat($.trim($("table").find("td:contains('HITs Available')").next().text()));

      var duration = $.trim($("table").find("td:contains('Duration')").next().text());
      var hit_name = $.trim($(".capsulelink_bold").find('div').html());

      data = {
        worker_id: workerId,
        group_id: getUrlParameters()['groupId'],
        reward: reward,
        duration: duration,
        hit_name: hit_name,
        hits_available: hitsAvailable,
        message: $('#recommend_message').val()
      };

      request = $.ajax({
        url: 'http://alpha.openturk.com/endpoint/recommend',
        type: "POST",
        data: data
      });
    });
  }

  if ($('form[name=hitForm]').length > 0) {
    form = $('form[name=hitForm]')[0];
    $('input[name="/accept"]').on("click", function(e, hint) {
      if (typeof hint === "undefined") {
        e.preventDefault();
        getAutoAccept(function(autoaccept) {
          log(function() {
            $('input[name="/accept"]').trigger("click", true);
          }, false, false);
        });
      }
    });
  }

  var shareHitButton = '<tr><td><a href="#" class="ot-share" id="sharehit"><span class="ot-subscribe-text">Share HIT</span></a></td></tr>';

  var modalTpl = function(content) {
    return '<div id="modal" style="display:none;z-index:10;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;">' + content + '</div>';
  };

  //Add the ShareHIT Button
  if ($('td[class="capsulelink_bold"]').length > 0) {
    var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
      var el = $('div > table > tbody > tr > td > table > tbody > tr').last();
      var group_id = getUrlParameters()['groupId'];
      if (typeof result.username !== "undefined") {
        $(el)
          .after(shareHitButton)
          .after(modalTpl('<h2>Share this HIT for other workers:</h2><textarea id="recommend_message" style="width: 340px; height: 100px">OpenTurk user ' + (result.username) + ' recommended the following task: ' + group_id + '</textarea><br /><input id="modal_submit" type="submit" value="ok"><input id="modal_cancel" type="submit" value="cancel">'));
      } else {
        $(el)
          .after(shareHitButton)
          .after(modalTpl('<h2>Please log in on <a href="http://alpha.openturk.com/accounts/login/">OpenTurk.com</a></h2>'));
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
        recommend();
      });
      var requesterId = $('input[name=requesterId').val();
      var requesterName = $('input[name=prevRequester').val();
      storage.get('requesters', function(items) {
        var obj = items;
        var already = {};
        if (obj.requesters) {
          for (var j = 0; j < obj.requesters.length; j++) {
            already[obj.requesters[j].id] = true;
          }
        }
        console.log(el);
        if (!(requesterId in already)) {
          $("#sharehit").parent().after('<td><a class="ot-subscribe" href="#" data-id="' + requesterId + '" data-name="' + requesterName + '"><span class="ot-subscribe-text">subscribe</span></a></td>');
          //bind events
          $('.ot-subscribe').click(function(e) {
            chrome.runtime.sendMessage({
              addRequester: {
                "name": $(this).attr('data-name'),
                "id": $(this).attr('data-id'),
                "numtask": 0
              }
            }, function(response) {});
            $('.ot-subscribe[data-id=' + $(this).attr('data-id') + ']').hide();
          });
        }
      });
    });
  }

  $hitFinished = $('#alertboxHeader');
  if ($hitFinished.length > 0) {
    var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
      var group_id = getUrlParameters()['groupId'];
      if (typeof group_id !== "undefined") {
        $hitFinished.parent().next()
          .append('<hr><h6>If you liked this HIT, share it on Openturk. <a href="#" class="ot-share" id="sharehit"><span class="ot-subscribe-text">Share HIT</span></a></h6>')
          .append(modalTpl('<h2>Share this HIT for other workers:</h2><textarea id="recommend_message" style="width: 340px; height: 100px">OpenTurk user ' + (result.username) + ' recommended the following task: ' + group_id + '</textarea><br /><input id="modal_submit" type="submit" value="ok"><input id="modal_cancel" type="submit" value="cancel">'));

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
          recommend();
        });
      }
    });
  }

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

      if (!(requesterId in already)) {
        insertAfterElt.after('<a class="ot-subscribe" href="#" data-id="' + requesterId + '" data-name="' + requesterName + '"><span class="ot-subscribe-text">Subscribe</span></a>');
      }
    }
    //bind events
    $('.ot-subscribe').click(function(e) {
      chrome.runtime.sendMessage({
        addRequester: {
          "name": $(this).attr('data-name'),
          "id": $(this).attr('data-id'),
          "numtask": 0
        }
      }, function(response) {});
      $('.ot-subscribe[data-id=' + $(this).attr('data-id') + ']').hide();
    });
  });

  // MANUAL RECOMMENDATION HIT
  // Add Recommendation button
  $('#searchbar').after('<div class="clear"><a id="recommendation-button" href="#" class="ot-schedule"><i id="recommendation-button-i" class="fa fa-heart"></i> Recommend me a HIT</a></div>');
  $('#recommendation-button').click(function(e) {
    e.preventDefault();
    $('#recommendation-button-i').addClass("fa-spinner fa-spin");
    fetchHit();
  });
  var attempt = 0;
  var max_attempt = 20;

  function fetchHit() {
    if (attempt < max_attempt) {
      var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/schedule').done(function(result) {
        if (result) {
          var group_id = result.next;
          var url = 'https://' + ((localStorage['Sandbox'] == "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/preview?groupId=' + group_id;
          validateRecommendation(url, redirectme);
        }
      });
    } else {
      console.log('max attempts achieved.' + attempt);
      $('#recommendation-button').html('0 for now (try later)');
      $('#recommendation-button-i').removeClass("fa-spinner fa-spin");
    }
  }
  // Alerts if needed ...
  // if(cond) {
  //   $('#subtabs_and_searchbar').after('<div class="message info"><span class="icon"></span><h6><span id="alertboxHeader">HITs that need your attention.</span></h6></div>');
  // }

  function validateRecommendation(url, callback) {
    $.get(url, {}, function(data) {
      var title = $(data).find('.capsulelink_bold');
      attempt++;
      if (title.length > 0) {
        console.log(url + " - success redirect");
        $('#recommendation-button-i').removeClass("fa-spinner fa-spin");
        callback(url);
      } else {
        console.log(url + " - failure retry");
        fetchHit();
      }
    });
  }
});
