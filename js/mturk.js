$(document).ready(function(){

  function getWorkerId(callback) {
    $.get('dashboard', {}, function(data) {
      console.log('data');
      var spanText = $(data).filter("table").find("span:contains('Worker ID')").text();
      var workerIdPattern = /Worker ID: (.*)$/;
      var workerId = spanText.match(workerIdPattern)[1];
      callback(workerId);
    });
  }

  var form = '';

  if($('#mturk_form').length > 0) {

    $('#mturk_form').submit(function(e) {
      e.preventDefault();

      alert('default submit prevented');

      request = $.ajax({
        url: $(this).attr('action'),
        type: "POST",
        data: $(this).serialize()
      }).done(function() {
        alert('form posted, redirecting');
        window.top.location.href = "https://www.mturk.com/mturk/preview?groupId=2KGW3K4F0OHO8JK8ZWBOAL97PHD01E";
      });

    });


  } else if($('form[name=hitForm]').length > 0) {
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
        window.top.location.href = "https://www.mturk.com/mturk/preview?groupId=2KGW3K4F0OHO8JK8ZWBOAL97PHD01E";
      });

    });


  }

});
