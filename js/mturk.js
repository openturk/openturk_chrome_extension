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
        }, function(response) {
          // console.log('bg received: ' + response.group_id);
        });
        // console.log('group_id sent to bg: ' + group_id);
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
          // console.log("really no group_id found...");
        } else {
          // console.log("got group_id from bg: " + group_id);
        }
        callback(group_id);
      });
    }

    function set_autoaccept(autoaccept) {
      if ($('input[name=autoAcceptEnabled]').length > 0) {
        chrome.runtime.sendMessage({
          autoaccept: autoaccept
        });
        console.log('sent autoaccept ' + autoaccept);
      }
    }

    function get_autoaccept(callback) {
      chrome.runtime.sendMessage({
        autoaccept_get: true
      }, function(response) {
        autoaccept = response.autoaccept;
        console.log('got autoaccept ' + autoaccept);
        callback(autoaccept);
      });
    }

    function post_and_redirect(form) {
      request = $.ajax({
        url: form.attr('action'),
        type: "POST",
        data: form.serialize()
      }).done(function() {
        var jqxhr = $.getJSON(openturk_endpoint).done(function(data) {
          log(false, false);
          var redirect_url = data.url[0];
          //window.top.location.href = redirect_url;
        });
      });
    }

    function log(hit_skipped, batch_skipped) {
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
          }).done(function() {
            console.log('Logged ' + worker_id + ' ' + group_id);
          })
          /*.always(function(data) {
          console.log(data);
        })*/
          ;
        });
      });
    }

    //Always check auto accept next HIT
    $('input[name=autoAcceptEnabled]').prop('checked', true);
    set_autoaccept(true);
    $('input[name=autoAcceptEnabled]').click(function(event) {
      set_autoaccept($('input[name=autoAcceptEnabled]').is(':checked'));
    });

    get_autoaccept(function(autoaccept) {
      if ($('#mturk_form').length > 0) {
        $('#mturk_form').submit(function(e) {
          if (autoaccept) {
            e.preventDefault();
            $($(this).find('input[type=submit]')[0]).prop('disabled', true);
            post_and_redirect($(this));
          }
        });
      } else if ($('form[name=hitForm]').length > 0) {
        form = $('form[name=hitForm]')[0];
        $('input[name="/submit"]').click(function(e) {
          if (autoaccept) {
            e.preventDefault();
            $(this).prop('disabled', true);
            post_and_redirect($(form));
          }
        });
      }
    });

    $("input[type='text']").keydown(function() {});
  }).call(this);
});
