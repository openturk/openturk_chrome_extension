$(document).ready(function() {
  (function() {

    var storage = chrome.storage.sync;
    var form = '';
    var openturk_endpoint = 'http://alpha.openturk.com/endpoint/redirect';
    var autoaccept = true;

    function get_worker_id(callback) {
      $.get('https://workersandbox.mturk.com/mturk/dashboard', {}, function(data) {
        var spanText = $(data).filter("table").find("span:contains('Worker ID')").text();
        var workerIdPattern = /Worker ID: (.*)$/;
        var workerId = spanText.match(workerIdPattern)[1];
        callback(workerId);
      });
    }

    /* usage : get_url_params()['groupId'] */
    function get_url_params(link) {
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

    function set_group_id() {
      var group_id = get_url_params()['groupId'];
      if (typeof group_id !== "undefined") {
        chrome.runtime.sendMessage({
          group_id: group_id
        }, function(response) {});
      }
      return group_id;
    }
    set_group_id();

    function get_group_id(callback) {
      chrome.runtime.sendMessage({
        group_id_get: true
      }, function(response) {
        var group_id = response.group_id;
        if (typeof group_id === "undefined") {
          group_id = "undefined";
        } else {}
        callback(group_id);
      });
    }

    function set_autoaccept(autoaccept) {
      if ($('input[name=autoAcceptEnabled]').length > 0) {
        chrome.runtime.sendMessage({
          autoaccept: autoaccept
        });
      }
    }

    function get_autoaccept(callback) {
      chrome.runtime.sendMessage({
        autoaccept_get: true
      }, function(response) {
        callback(response.autoaccept);
      });
    }

    function post_and_redirect(form) {
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
        var redirect_url = data.url[0];
        window.top.location.href = redirect_url;
      });
    }

    function log(callback, hit_skipped, batch_skipped) {
      get_worker_id(function(worker_id) {
        if (typeof worker_id === "undefined") {
          worker_id = "undefined";
        }
        get_group_id(function(group_id) {
          data = {
            worker_id: worker_id,
            group_id: group_id,
            hit_skipped: hit_skipped,
            batch_skipped: batch_skipped
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
      get_worker_id(function(worker_id) {
        if (typeof worker_id === "undefined") {
          worker_id = "undefined";
        }
        get_group_id(function(group_id) {
        var reward_text = $("table").find("td:contains('Reward')").next().text();
        var reward_pattern = /([0-9\.]*) per/;
        var reward = parseFloat(reward_text.match(reward_pattern)[1]);

        var hits_available = parseFloat($.trim($("table").find("td:contains('HITs Available')").next().text()));

        var duration = $.trim($("table").find("td:contains('Duration')").next().text());

          data = {
            worker_id: worker_id,
            group_id: group_id,
            reward: reward,
            duration: duration,
            hits_available: hits_available,
            message: $('#star_message').val()
          };
          request = $.ajax({
            url: 'http://alpha.openturk.com/endpoint/star',
            type: "POST",
            data: data
          }).always(function(data) {
            console.log(data)
            callback();
          });
        });
      });
    }

    //Always check auto accept next HIT
    $('input[name=autoAcceptEnabled]').prop('checked', true);
    set_autoaccept(true);
    $('input[name=autoAcceptEnabled]').click(function(event) {
      set_autoaccept($('input[name=autoAcceptEnabled]').is(':checked'));
    });

    if ($('#mturk_form').length > 0) {
      $('#mturk_form').on("submit", function(e, hint) {
        if (typeof hint === "undefined") {
          e.preventDefault();
          get_autoaccept(function(autoaccept) {
            if (autoaccept) {
              log(function() {
                $('#mturk_form').trigger("submit", true);
              }, false, false);
            } else {
              $($(this).find('input[type=submit]')[0]).prop('disabled', true);
              post_and_redirect($(this));
            }
          });
        }
      });
    } else if ($('form[name=hitForm]').length > 0) {
      form = $('form[name=hitForm]')[0];
      $('input[name="/submit"]').on("click", function(e, hint) {
        if (typeof hint === "undefined") {
          e.preventDefault();
          get_autoaccept(function(autoaccept) {
            if (autoaccept) {
              log(function() {
                $('input[name="/submit"]').trigger("submit", true);
              }, false, false);
            } else {
              $(this).prop('disabled', true);
              post_and_redirect($(form));
            }
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
        var requester_id = get_url_params('lala?' + requester.attr('href'))['requesterId'];
        var requester_name = requester.html();
        var insert_after = $(tr.find('td')[1]);

        if (requester_id in already) {
          // insert_after.after('<button class="btn btn-icon" data-id="' + requester_id + '" data-name="' + requester_name + '"><span class="icon-cancel"></span></button>');
        } else {
          insert_after.after('<td><button class="subscribe btn btn-icon" data-id="' + requester_id + '" data-name="' + requester_name + '"><span class="icon-star3"></span></button></td>');
        }
      }
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

    //Add I'm feeling lucky button
    $('input[value="/searchbar"]').after('<br><button id="lucky">I\'m feeling lucky</button>');
    $('#lucky').click(function(e) {
      e.preventDefault();
      redirect();
    });

    //Add the star
    get_group_id(function(group_id) {
      var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
        if (typeof result.username !== "undefined") {
          $('td[colspan=11]')
            .after('<span id="star" class="btn btn-icon icon-share"></span>')
            .after('<div id="modal" style="display:none;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;"><h2>We will post the following message on mturkforum.com</h2><textarea id="star_message" style="width: 340px; height: 100px">OpenTurk user ' + (result.username) + ' recommended the following task: ' + group_id + '</textarea><br /><input id="modal_submit" type="submit" value="ok"><input id="modal_cancel" type="submit" value="cancel"></div>');
        } else {
          $('td[colspan=11]')
            .after('<span class="btn btn-icon"><span id="star" class="icon-share"></span></span>')
            .after('<div id="modal" style="display:none;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;"><h2>Please log in on <a href="http://alpha.openturk.com/accounts/login/">OpenTurk.com</a></h2></div>');
        }
        $('#star').click(function(e) {
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

    //Add a popup
    var elem = _.createElement("div", {
      classes: ["hnspecial-infinite-search-notice"],
      content: "Please keep scrolling if you want to access the search field and the footer. <span>(click to close)</span>"
    });
    elem.addEventListener("click", function () { this.classList.add("hnspecial-infinite-search-notice-hidden"); });
    document.body.addEventListener("click", function (e) {
      if (!elem.classList.contains("hnspecial-infinite-search-notice-hidden") && e.target !== elem) {
        elem.classList.add("hnspecial-infinite-search-notice-hidden");
      }
    });
    document.body.appendChild(elem);

  }).call(this);
});
