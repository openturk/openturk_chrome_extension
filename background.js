var group_id;
var autoaccept;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (typeof request.group_id !== undefined) {
      if (request.group_id !== "undefined" && typeof request.group_id !== "undefined") {
        group_id = request.group_id;
        sendResponse({
          group_id: group_id
        });
      }
    }

    if (request.group_id_get) {
      sendResponse({
        group_id: group_id
      });
    }

    if (typeof request.autoaccept !== undefined) {
      if (typeof request.autoaccept !== "undefined") {
        autoaccept = request.autoaccept;
      }
    }
    if (request.autoaccept_get) {
      sendResponse({
        autoaccept: autoaccept
      });
    }
  }
);
