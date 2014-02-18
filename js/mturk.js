$(document).ready(function() {
  (function() {

    var form = '';
    var openturk_endpoint = 'http://alpha.openturk.com/endpoint/redirect';


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
        });
        console.log('group_id sent to bg: ' + group_id);
      }
      return group_id;
    }
    set_group_id();

    function get_group_id() {
      chrome.runtime.sendMessage({
        group_id_get: true
      }, function(response) {
        group_id = response.group_id;
      });
      if (typeof group_id === "undefined") {
        group_id = "undefined";
        console.log("really no group_id found...");
      } else {
        console.log("got group_id from bg: " + group_id);
      }
      return group_id;
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
        group_id = get_group_id();
        data = {
          worker_id: worker_id,
          group_id: group_id,
          hit_skipped: hit_skipped,
          batch_skipped: batch_skipped
        };
        console.log(data);
        request = $.ajax({
          url: 'http://alpha.openturk.com/endpoint/log',
          type: "POST",
          data: data
        }).done(function() {
          console.log('Logged ' + worker_id + ' ' + group_id);
        }).always(function(data) {
          console.log(data);
        });
      });
    }

    //Always check auto accept next HIT
    $('input[name=autoAcceptEnabled]').prop('checked', true)
    var auto_accept_enabled = $('input[name=autoAcceptEnabled]').is(':checked');
    $('input[name=autoAcceptEnabled]').click(function(event) {
      chrome.runtime.sendMessage({
        auto_accept_enable: $('input[name=autoAcceptEnabled]').is(':checked')
      }, function(response) {
        auto_accept_enabled = response.auto_accept_enable;
      });
    });

    console.log('Scheduling enabled.');
    if ($('#mturk_form').length > 0) {
      console.log('iframe form detected');
      $('#mturk_form').submit(function(e) {
        e.preventDefault();
        $($(this).find('input[type=submit]')[0]).prop('disabled', true);
        post_and_redirect($(this));
      });
    } else if ($('form[name=hitForm]').length > 0) {
      console.log('native form detected');
      form = $('form[name=hitForm]')[0];
      $('input[name="/submit"]').click(function(e) {
        e.preventDefault();
        $(this).prop('disabled', true);
        post_and_redirect($(form));
      });
    }

    $("input[type='text']").keydown(function() {
      console.log(get_group_id());
    });

  }).call(this);
});
