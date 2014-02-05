$(document).ready(function(){
  var form = '';

  if($('#mturk_form').length > 0) {
    form = $('#mturk_form');
  } 
  // else if($('form[name=hitForm]').length > 0) {
  //   form = $('form[name=hitForm]')[0];
  // }

  $(form).submit(function(e) {
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

});
