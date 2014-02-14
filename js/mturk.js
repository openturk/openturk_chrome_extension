$(document).ready(function() {

  function getWorkerId(callback) {
    $.get('dashboard', {}, function(data) {
      var spanText = $(data).filter("table").find("span:contains('Worker ID')").text();
      var workerIdPattern = /Worker ID: (.*)$/;
      var workerId = spanText.match(workerIdPattern)[1];
      callback(workerId);
    });
  }
  getWorkerId(function(arg) {
    console.log(arg);
  });

  /* usage : urlParams()['groupId'] */
  function getUrlParams() {
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

  var form = '';
  var openturk_endpoint = 'http://alpha.openturk.com/endpoint/dummy';

  if ($('#mturk_form').length > 0) {

    $('#mturk_form').submit(function(e) {
      e.preventDefault();

      alert('default submit prevented');

      request = $.ajax({
        url: $(this).attr('action'),
        type: "POST",
        data: $(this).serialize()
      }).done(function() {
        alert('form posted, redirecting');
        var jqxhr = $.getJSON(openturk_endpoint).done(function(data) {
          var redirect_url = data.url[0];
          window.top.location.href = redirect_url;
        });
      });

    });


  } else if ($('form[name=hitForm]').length > 0) {
    form = $('form[name=hitForm]')[0];

    $('input[name="/submit"]').click(function(e) {
      e.preventDefault();

      alert('default click prevented');

      request = $.ajax({
        url: $(form).attr('action'),
        type: "POST",
        data: $(form).serialize()
      }).done(function() {
        alert('form posted, redirecting');
        var jqxhr = $.getJSON(openturk_endpoint).done(function(data) {
          var redirect_url = data.url[0];
          window.top.location.href = redirect_url;
        });
      });

    });


  }

});
