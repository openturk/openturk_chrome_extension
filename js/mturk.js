$(document).ready(function(){
  //form name = hitForm
  if($('#mturk_form').length > 0) {
    var form = $('#mturk_form');
    alert('Found iframe form (#mturk_form)');
  } else if($('form[name=hitForm]').length > 0) {
    var form = $('form[name=hitForm]')[0];
    alert('Found native form (hitForm)');
  }
  form.submit(function(e) {
    e.preventDefault();

    var serializedData = $(this).serialize();
    alert('default submit prevented');
    request = $.ajax({
      url: $(this).attr('action'),
      type: "POST",
      data: serializedData
    }).done(function() {
      alert('form posted, redirecting');
      window.location.replace("https://stackoverflow.com");
    });
  });
});
