$(document).ready(function() {
  (function() {

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
    function get_url_params() {
      var params = [],
        hash;
      var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
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
        group_id = response.group_id;
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

    //Add like and dislike buttons
    var caps = $('.capsule_field_title');
    for (var i = 0; i < caps.length; i++) {
      $(caps[i]).find("a:contains('Requester:')").after('<button>dislike</button>').after('<button>like</button>');
    }
    //Add I'm feeling lucky button
    $('input[value="/searchbar"]').after('<br><button id="lucky">I\'m feeling lucky</button>');
    $('#lucky').click(function(e) {
      e.preventDefault();
      redirect();
    });

  }).call(this);
});
