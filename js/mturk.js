$(document).ready(function() {

  function get_worker_id(callback) {
    console.log();
    $.get('dashboard', {}, function(data) {
      var spanText = $(data).filter("table").find("span:contains('Worker ID')").text();
      var workerIdPattern = /Worker ID: (.*)$/;
      var workerId = spanText.match(workerIdPattern)[1];
      callback(workerId);
    });
  }
  get_worker_id(function(arg) {
    console.log(arg);
  });

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

  function post_and_redirect(form) {
    request = $.ajax({
      url: form.attr('action'),
      type: "POST",
      data: form.serialize()
    }).done(function() {
      alert('form posted, redirecting');
      var jqxhr = $.getJSON(openturk_endpoint).done(function(data) {
        var redirect_url = data.url[0];
        window.top.location.href = redirect_url;
      });
    });
  }

  function log() {
    get_worker_id(function(worker_id) {
      params = get_url_params();
      group_id = params['groupId'];
      request = $.ajax({
        url: 'http://alpha.openturk.com/endpoint/log',
        type: "POST",
        data: {
          worker_id: worker_id,
          group_id: group_id
        }
      }).done(function() {
        console.log('Logged ' + worker_id + ' ' + group_id);
      });
    });
  }

  var form = '';
  var openturk_endpoint = 'http://alpha.openturk.com/endpoint/redirect';

  //Always check auto accept next HIT
  $('input[name=autoAcceptEnabled]').prop('checked', true);

  if (!$('input[name=autoAcceptEnabled]').is(':checked')) {

    if ($('#mturk_form').length > 0) {
      console.log('iframe form detected');
      $('#mturk_form').submit(function(e) {
        e.preventDefault();
        alert('default submit prevented');
        post_and_redirect($(this));
      });
    } else if ($('form[name=hitForm]').length > 0) {
      console.log('native form detected');
      form = $('form[name=hitForm]')[0];
      $('input[name="/submit"]').click(function(e) {
        e.preventDefault();
        alert('default click prevented');
        post_and_redirect($(form));
      });
    }
  }
});
