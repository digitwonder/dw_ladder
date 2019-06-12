(function() {
  window.UglifyJS_NoUnsafeEval = true;

  localStorage['log'] = '';

  localStorage['logLastError'] = '';

  window.OmegaContextMenuQuickSwitchHandler = function() {
    return null;
  };

  if (chrome.contextMenus != null) {
    if (chrome.i18n.getUILanguage != null) {
      chrome.contextMenus.create({
        id: 'enableQuickSwitch',
        title: chrome.i18n.getMessage('contextMenu_enableQuickSwitch'),
        type: 'checkbox',
        checked: false,
        contexts: ["browser_action"],
        onclick: function(info) {
          return window.OmegaContextMenuQuickSwitchHandler(info);
        }
      });
    }
  }

}).call(this);
