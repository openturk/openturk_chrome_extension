var CTXMenu = {

  contexts: ['editable'],

  items: {

    root: function() {
      return chrome.contextMenus.create({
        'title': 'Paste Mturk ID',
        'contexts': CTXMenu.contexts,
        'onclick': function(info, tab) {
          chrome.tabs.sendRequest(
            tab.id, {
              "workerId": true
            }
          )
        },
        'documentUrlPatterns': [
          '<all_urls>'
        ]
      });
    }

    // separator: function(parent) {
    //   return chrome.contextMenus.create({
    //     'type': 'separator',
    //     'contexts': CTXMenu.contexts,
    //     'parentId': parent
    //   });
    // },

    // manage: function(parent) {
    //   return chrome.contextMenus.create({
    //     'title': 'Settings',
    //     'contexts': CTXMenu.contexts,
    //     'parentId': parent,
    //     'onclick': function(info, tab) {
    //       window.open(chrome.extension.getURL('pages/options.html'));
    //     }
    //   });
    // },

    // addPasteID: function(parent) {
    //   return chrome.contextMenus.create({
    //     'title': "Paste Mturk ID",
    //     'contexts': CTXMenu.contexts,
    //     'parentId': parent,
    //     'onclick': function(info, tab) {
    //       chrome.tabs.sendRequest(
    //         tab.id, {
    //           "workerId": true
    //         }
    //       )
    //     }
    //   });
    // }

  },

  generate: function() {
    console.log('[CTX] Generating the context menu');
    var _this = this;

    // remove all menus and start again
    chrome.contextMenus.removeAll(function() {
      var root = _this.items.root();
      // _this.items.addPasteID(root);
      // _this.items.separator(root);
      // _this.items.manage(root)
    });
  }

};
