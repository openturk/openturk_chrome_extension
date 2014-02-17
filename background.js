var auto_accept_enabled = false;
var group_id;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (typeof request.auto_accept_enable !== undefined) {
      auto_accept_enabled = request.auto_accept_enable;
    }
    if (request.auto_accept_enable_get) {
      sendResponse({
        auto_accept_enable: auto_accept_enabled
      });
    }

    if (typeof request.group_id !== undefined) {
      if (request.group_id !== "undefined" && typeof request.group_id !== "undefined") {
        group_id = request.group_id;
      }
    }
    if (request.group_id_get) {
      sendResponse({
        group_id: group_id
      });
    }
  }
);
