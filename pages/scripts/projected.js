// Earning Projection Function
// This script is based off the work by mmmturkeybacon and ported to jQuery
// mmmturkeybacon version: http://userscripts.org/scripts/show/309745

var STATUSDETAIL_DELAY = 500;
var MPRE_DELAY = 2000;
var STD_DAILY = parseInt(localStorage.getItem("Target"), 10);
var DASHBOARD_URL = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/dashboard';
var STATUSDETAIL_BASE_URL = '/mturk/statusdetail?encodedDate=';
var STATUSDETAIL_FULL_URL = 'https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + '/mturk/statusdetail?encodedDate=';
var page_num = 1;
var date_header = '';
var page_total = 0;
var subtotal = 0;

function getProjection() {
  var num = localStorage["Target"];
  $("#target-projection").html("$" + num / 100);
  $.get(DASHBOARD_URL, function(data) {
    var $src = $(data);
    var day_name = $src.find("a[href^='" + STATUSDETAIL_BASE_URL + "']:first").text();
    if (day_name == 'Today') {
      var last_date_worked = $src.find("a[href^='" + STATUSDETAIL_BASE_URL + "']:first").attr('href').replace(STATUSDETAIL_BASE_URL, '');
      var date_URLs = STATUSDETAIL_FULL_URL + last_date_worked + '&sortType=All&pageNumber=' + page_num;
      statusdetail_loop(date_URLs);
    } else {
      $('#projection').html('$0.00');
      localStorage.TGP = 0;
    }
  });
}

function scrape($src) {
  var $reward = $src.find("td[class='statusdetailAmountColumnValue']");
  var $approval = $src.find("td[class='statusdetailStatusColumnValue']");
  page_total = 0;

  for (var j = 0; j < $reward.length; j++) {
    // I"m worried if I use parseFloat errors will accumulate because floats are inexact
    var reward = parseInt($reward.eq(j).text().replace(/[^0-9]/g, ''), 10);
    var approval = $approval.eq(j).text();

    if (approval != 'Rejected') {
      page_total += reward;
    }
  }
}

function statusdetail_loop(next_URL) {
  if (next_URL.length !== 0) {
    $.get(next_URL, function(data) {
      var $src = $(data);
      var maxpagerate = $src.find("td[class='error_title']:contains('You have exceeded the maximum allowed page request rate for this website.')");
      if (maxpagerate.length === 0) {
        subtotal += page_total;
        date_header = $src.find("td[class='white_text_14_bold']:contains('HITs You Worked On For')").clone().children().remove().end().text().trim();
        page_num++;
        scrape($src);

        $next_URL = $src.find("a[href^='/mturk/statusdetail']:contains('Next')");
        next_URL = ($next_URL.length !== 0) ? ('https://' + ((localStorage['Sandbox'] === "true") ? "workersandbox.mturk.com" : "www.mturk.com") + $next_URL.attr('href')) : '';

        setTimeout(function() {
          statusdetail_loop(next_URL);
        }, STATUSDETAIL_DELAY);
      } else {
        setTimeout(function() {
          statusdetail_loop(next_URL);
        }, MPRE_DELAY);
      }
    });
  } else {
    $('#projection').html('$' + ((subtotal + page_total) / 100).toFixed(2));
    localStorage.TGP = ((subtotal + page_total) * 100) / STD_DAILY;
    if ((subtotal + page_total) >= STD_DAILY) {
      $('#projection').removeClass("red");
      $('#projection').addClass("green");
    }
  }
}