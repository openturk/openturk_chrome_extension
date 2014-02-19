var OT = {
	init: function() {
		OT.status.container = $('header.sub');

		OT.get_worker_id();

		$('#creds button.save').click(function(e){
			e.preventDefault();
			OT.creds.save();
		})
		$('#creds button.remove').click(function(e){
			e.preventDefault();
			OT.creds.remove();
		})
		$('#post button').click(function(e){
			e.preventDefault();
			OT.api.post();
		})
		$('header.sub a').on('click', function() {
			chrome.windows.getCurrent(null, function(window) {
				if(window.type == 'popup') {
					chrome.windows.remove(window.id);
				}
			});
		});
		$('.hint a').click(function(e){
			e.preventDefault();
			var $input = $('#tags');
			var tags = $input.val().split(',');

			if(tags.indexOf('tmp') != -1) {
				tags.splice(tags.indexOf('tmp'), 1);
			} else {
				tags.push('tmp');
			}
			var results = new Array();
			for (k in tags) if(tags[k]) results.push(tags[k])

			$input.val(results.join(','));
		});
		$('#title').focus();
	},

	creds: {
		populate: function(){
			if(localStorage.getItem('validated') == 'true') {
				$('form #username').val(localStorage.getItem('username'));
				$('form #key').val(localStorage.getItem('api_key'));
			}
		},

		remove: function(){
			localStorage.removeItem('username');
			localStorage.removeItem('api_key');
			localStorage.setItem('validated', 'false');
			$('form #username').val('');
			$('form #key').val('');
			OT.message.set('success', 'Credentials removed');
		},
		
		save: function(){
			var username = $('#username').val();
			var api_key = $('#key').val();

			var url = OT.api.base_url
			        + '?username='
			        + username
			        + '&api_key='
			        + api_key

			$.ajax({
				type: 'GET',
				url: url,
				dataType: 'jsonp',
				success: function(data){
					localStorage.setItem('username', username);
					localStorage.setItem('api_key', api_key);
					localStorage.setItem('validated', 'true');
					OT.message.set('success', 'Credentials saved');
					OT.switch_content();
				},
				error: function(xhr, status){
					localStorage.removeItem('username');
					localStorage.removeItem('api_key');
					localStorage.setItem('validated', 'false');
					OT.message.set('error', 'Bad credentials');
				}
			});
		},
	},

	message: {
		set: function(status, message) {
			var bar = OT.status.container;

			bar.removeClass('error success');
			if(status != null) {
				bar.addClass(status);
			}
			bar.html(message);
		}
	},

	switch_content: function() {
		$('#content').show();
		$('#login').hide();
		$('#load').hide();
	},
	switch_login: function() {
		$('#content').hide();
		$('#login').show();
		$('#load').hide();
	},

	get_worker_id: function() {	
		$.ajax({
        url:    'https://workersandbox.mturk.com/mturk/dashboard',
        success: function(result) {
	                var spanText = $(result).filter("table").find("span:contains('Worker ID')").text();
				    var workerIdPattern = /Worker ID: (.*)$/;
				    var workerId = spanText.match(workerIdPattern)[1];
				    OT.status.workerId = workerId;
				    localStorage.setItem('workerId', workerId);
			     	localStorage.setItem('validated', 'true');
					OT.message.set('success', 'Welcome ' + workerId);
			     	OT.switch_content();
                 },
        error:   function(xhr, status) {
					localStorage.removeItem('workerId');
					localStorage.setItem('validated', 'false');
					OT.message.set('error', 'You are not logged in Amazon Mechanical Turk');
					OT.switch_login();
				 }
        });  
	},

	status: {
		workerId:'', 
		container: {}
	}
};

// Actual extension logic
var storage = chrome.storage.local;
var myUrls = 'url';
var urls = "";
// obj[myUrls] = [{"name":"CrowdSource","id":"A2SUM2D7EOAK1T","numtask":0},{"name":"Roman","id":"A165LMPFHNTKFG","numtask":0}];
// storage.set(obj);

function initRequesters(urls) {
    urls = storage.get(myUrls, function(items) {
        urls = items.url;
        urls.forEach(function(url) {
            appendRequester(url);
        });
        return urls;
    });
    console.log(urls);
}
function save() {
    storage.set({myUrls: urls}, function() {
        alert('saved');
    });
}
function appendRequester(url) {
    var $li = $('<li><a href="https://workersandbox.mturk.com/mturk/searchbar?selectedSearchType=hitgroups&requesterId=' 
    	+ url['id']+ '&qualifiedFor=on"> <span class="url">' + url['name']+ ' = ' +url['numtask']+ '</span></a> <a href class="delete"> [delete]</a></li>');
    $('#urls').append($li);
}

function getNewTasks() {
	urls.forEach(function(url) {
        scrapForTasks(url);
    });
}

function setBadge(text) {
	chrome.browserAction.setBadgeText({text:text});
}

function updateCurrentStatus(status, message) {
	getNewTasks();
	console.log('After update: ' + urls);
	// setTimeout(function(){
	// 	setBadge();
	// }, 5000)
}

function scrapForTasks(url) {	
		$.ajax({
        url:    'https://workersandbox.mturk.com/mturk/searchbar'
                  + '?selectedSearchType=hitgroups'
                  + '&qualifiedFor=on' 
                  + '&requesterId=' + url['id'],
        success: function(result) {
	                var spanText = $(result).find("td:contains('Results')").text();
				    var resPattern = /of (.*) Results/;
				    var res = spanText.match(resPattern)[1];
				    url['numtask'] = res;
				    console.log(url['name'] + ':'  + url['numtask']);
                 },
        error:   function(xhr, status) {
					// do something
				 }
        });  
	}

$(document).ready(function(){
	OT.init();
	initRequesters();
	console.log(urls);
	getNewTasks();
});