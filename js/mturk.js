$(document).ready(function() {

  if ($("[name='captcha']").length > 0 || $("[name='userCaptchaResponse']").length > 0) {
    // The captcha is here !
    chrome.runtime.sendMessage({
      captcha: true
    }, function() {});
  } else { // No captcha, run the scripts
    chrome.runtime.sendMessage({
      captcha: false
    }, function() {});

    var storage = chrome.storage.sync;
    var form = '';
    var openturk_endpoint = 'http://alpha.openturk.com/endpoint/redirect';
    var autoaccept = true;

    if ($('#font-awesome-style').length === 0) {
      var fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.rel = 'stylesheet';
      fontAwesomeLink.id = 'font-awesome-style';
      fontAwesomeLink.href = chrome.extension.getURL('pages/styles/font-awesome/css/font-awesome.min.css');
      document.head.appendChild(fontAwesomeLink);
    }

    // Retrieves worker ID from user's dashboard
    var getWorkerId = function(callback) {
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
    };

    // Parses the current url or the one passed as argument
    var getUrlParameters = function(link) {
      if (typeof link === 'undefined') {
        link = window.location.href;
      }
      link = link.split('#')[0];
      var params = [],
        hash;
      var hashes = link.slice(link.indexOf('?') + 1).split('&');
      for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        params.push(hash[0]);
        params[hash[0]] = hash[1];
      }
      return params;
    };

    var redirect = function() {
      var jqxhr = $.getJSON(openturk_endpoint).done(function(data) {
        var redirectUrl = data.url[0];
        window.top.location.href = redirectUrl;
      });
    };

    var redirectme = function(redirectUrl) {
      window.top.location.href = redirectUrl;
    };

    // Log accepted task to the server
    var log = function(callback, hitSkipped, batchSkipped, autoAccepted) {
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

        var found, master;
        found = $('body').find("td.capsule_field_text:contains('Categorization Masters has been granted')");
        if (found.length > 0) {
          master = 'CatMaster';
        }
        found = $('body').find("td.capsule_field_text:contains('Photo Moderation Masters has been granted')");
        if (found.length > 0) {
          master = 'PhotoMaster';
        }
        found = $('body').find("td.capsule_field_text:contains('Masters has been granted')");
        if (found.length > 0) {
          master = 'Master';
        }

        var groupId = getUrlParameters()['groupId'];
        if (!groupId) {
          groupId = $('input[name="groupId"]').val();
        }

        data = {
          worker_id: workerId,
          group_id: groupId,
          reward: reward,
          duration: duration,
          hit_name: hit_name,
          requester_id: $('input[name=requesterId]').val(),
          hits_available: hitsAvailable,
          autoaccepted: autoAccepted,
          hit_skipped: hitSkipped,
          batch_skipped: batchSkipped,
          master: master
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

    // Send recommendation to the server
    var recommend = function() {
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

        var groupId = getUrlParameters()['groupId'];
        if (!groupId) {
          groupId = $('input[name="groupId"]').val();
        }

        var requesterId = $('input[name=requesterId]').val();
        if (!requesterId) {
          requesterId = getUrlParameters()['requesterId'];
        }

        var found, master;
        found = $('body').find("td.capsule_field_text:contains('Categorization Masters has been granted')");
        if (found.length > 0) {
          master = 'CatMaster';
        }
        found = $('body').find("td.capsule_field_text:contains('Photo Moderation Masters has been granted')");
        if (found.length > 0) {
          master = 'PhotoMaster';
        }
        found = $('body').find("td.capsule_field_text:contains('Masters has been granted')");
        if (found.length > 0) {
          master = 'Master';
        }

        var data = {
          worker_id: workerId,
          group_id: groupId,
          reward: reward,
          duration: duration,
          hit_name: hit_name,
          requester_id: requesterId,
          hits_available: hitsAvailable,
          master: master,
          message: $('#recommend_message').val()
        };

        var request = $.ajax({
          url: 'http://alpha.openturk.com/endpoint/recommend',
          type: "POST",
          data: data
        });
      });
    };

    chrome.runtime.sendMessage({
      get_logging: true
    }, function(response) {
      if (response.logging === "true") {
        //if accepted
        if (window.top.location.pathname === "/mturk/accept") {
          log(function() {}, false, false, false);
        }
        //if autoacceptenabled=true
        if (getUrlParameters()['autoAcceptEnabled'] == 'true') {
          log(function() {}, false, false, true);
        }
      }
    });

    var shareHitButton = '<tr><td><a href="#" class="ot-share" id="sharehit"><span class="ot-subscribe-text">Share HIT</span></a></td></tr>';

    var modalTpl = function(id, content) {
      return '<div id="' + id + '" style="display:none;z-index:10;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;">' + content + '</div>';
    };

    var bindModalEvents = function(modal) {
      var $modal = $('#' + modal);
      $('#sharehit').click(function(e) {
        e.preventDefault();
        var left = Math.max($(window).width() - $modal.outerWidth(), 0) / 2;
        $modal.css({
          left: left + $(window).scrollLeft()
        });
        $modal.toggle();
      });
      $('#' + modal + '_cancel').click(function(e) {
        e.preventDefault();
        $modal.toggle();
      });
      $('#' + modal + '_submit').click(function(e) {
        e.preventDefault();
        $modal.toggle();
        recommend();
      });
    };

    // SHOW THE BUTTON ONLY ON THE FOLLOWING SCREENS: Preview, Accept, PreviewAndAccept
    if (window.top.location.pathname === "/mturk/preview" || window.top.location.pathname === "/mturk/accept" || 
      window.top.location.pathname === "/mturk/previewandaccept" || window.top.location.pathname === "/mturk/findhits" ||
      window.top.location.pathname === "/mturk/viewhits") {
      
      // 1. Add shareHit button and modal to HIT pages
      if ($('td[class="capsulelink_bold"]').length > 0) {
        var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
          var el = $('div > table > tbody > tr > td > table > tbody > tr').last();
          if (typeof result.username !== "undefined") {
            $(el)
              .after(shareHitButton)
              .after(modalTpl('modal', '<h2>Share this HIT for other workers:</h2><textarea id="recommend_message" style="width: 340px; height: 100px">I enjoyed this task!</textarea><br /><input id="modal_submit" type="submit" value="ok"><input id="modal_cancel" type="submit" value="cancel">'));
          } else {
            $(el)
              .after(shareHitButton)
              .after(modalTpl('modal', '<h2>Please log in on <a href="http://alpha.openturk.com/accounts/login/">OpenTurk.com</a></h2>'));
          }
          bindModalEvents('modal');
          var requesterId = $('input[name=requesterId').val();
          var requesterName = $('input[name=prevRequester').val();

          // Add subscribe button to HIT page
          storage.get('requesters', function(items) {
            var obj = items;
            var alreadyFavd = {};
            var alreadyBlocked = {};
            if (obj.requesters) {
              for (var j = 0; j < obj.requesters.length; j++) {
                if (!obj.requesters[j].blocked) {
                  alreadyFavd[obj.requesters[j].id] = true;
                } else {
                  alreadyBlocked[obj.requesters[j].id] = true;
                }
              }
            }
            if (!(requesterId in alreadyFavd)) {
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

      // 2. Add shareHit button and modal to HIT finished screen
      $hitFinished = $('#alertboxHeader');
      if ($hitFinished.length > 0) {
        var jqxhr1 = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
          $hitFinished.parent().next()
            .append('<hr><h6>If you liked this HIT, share it on Openturk. <a href="#" class="ot-share" id="sharedonehit"><span class="ot-subscribe-text">Share HIT</span></a></h6>')
            .append(modalTpl('modalpublish', '<h2>Share this HIT for other workers:</h2><textarea id="recommend_message" style="width: 340px; height: 100px">I enjoyed this task!</textarea><br /><input id="modalpublish_submit" type="submit" value="ok"><input id="modalpublish_cancel" type="submit" value="cancel">'));
          bindModalEvents('modalpublish');
        });
      }

      // 3. Add subscribe buttons
      storage.get('requesters', function(items) {
        var obj = items;
        var alreadyFavd = {};
        var alreadyBlocked = {};
        if (obj.requesters) {
          for (var j = 0; j < obj.requesters.length; j++) {
            if (!obj.requesters[j].blocked) {
              alreadyFavd[obj.requesters[j].id] = true;
            } else {
              alreadyBlocked[obj.requesters[j].id] = true;
            }
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

          if (requesterId in alreadyBlocked) {
            insertAfterElt.parent().parent().parent().parent().parent().parent().parent().parent().parent().parent().parent().parent().parent().css('opacity', '0.3');
          } else if (!(requesterId in alreadyFavd)) {
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

      // 4. Add The recommend me button
      $('#searchbar').after('<div class="clear"><a id="recommendation-button" href="#" class="ot-schedule"><i id="recommendation-button-i" class="fa fa-heart"></i> Recommend me a HIT</a></div>');
      $('#recommendation-button').click(function(e) {
        e.preventDefault();
        $('#recommendation-button-i').addClass("fa-spinner fa-spin");
        fetchHit();
      });
    }
    var attempt = 0;
    var max_attempt = 20;

    var fetchHit = function() {
      if (attempt < max_attempt) {
        var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/schedule').done(function(result) {
          if (result) {
            var groupId = result.next;
            var url = 'https://www.mturk.com/mturk/preview?groupId=' + groupId;
            validateRecommendation(url, redirectme);
          }
        });
      } else {
        console.log('max attempts reached.' + attempt);
        $('#recommendation-button').html('0 for now (try later)');
        $('#recommendation-button-i').removeClass("fa-spinner fa-spin");
      }
    };

    var validateRecommendation = function(url, callback) {
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
        var title = $(data).find('.capsulelink_bold');
        attempt++;
        if (title.length > 0) { //then user can preview
          // Now check qualification: 
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
          chrome.runtime.sendMessage({
            checkQualification: qualifications
          }, function(response) {
              if (response.qualified === true) {
                console.log(url + " - success redirect");
                $('#recommendation-button-i').removeClass("fa-spinner fa-spin");
                callback(url);
              } else {
                console.log("[MJS] Unqualified recommendation - Retry" + url);
                fetchHit();
              } 
          });
        } else {
          console.log("[MJS] Innaccessible recommendation - Retry" + url);
          fetchHit();
        }
      });
    };
  }
});
