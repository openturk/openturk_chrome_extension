$(document).ready(function(){
  //form name = hitForm
  if($('#mturk_form').length > 0)
    var form = $('#mturk_form');
  else if($('form[name=hitForm]').length > 0) {
    var form = $('form[name=hitForm]')[0];
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
      window.location.replace("http://stackoverflow.com");
    });
  });
});
