$(function() {

    var editable = null;
    $("input, textarea").mousedown(function() {
        // Capture the editable element
        editable = $(this);
    });

    function getWorkerId() {
        chrome.runtime.sendMessage({
            get_worker_id: true
        }, function(response) {
            if (editable) {
                editable.val(editable.val() + response.workerId);
            }
        });
    }

    chrome.extension.onRequest.addListener(
        function(request, sender, sendResponse) {
            if (request.workerId) {
                getWorkerId();
                sendResponse({
                    "workerId": true
                });
            }
        }
    );

});
