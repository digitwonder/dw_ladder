(function() {
  var Log, OmegaTargetCurrent, Promise, actionForUrl, charCodeUnderscore, dispName, drawContext, drawError , encodeError, external, iconCache, isHidden, options, proxyImpl, refreshActivePageIfEnabled, state, storage, sync, syncStorage, tabs, timeout, unhandledPromises, unhandledPromisesId, unhandledPromisesNextId, _ref, _ref1, _writeLogToLocalStorage,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  OmegaTargetCurrent = Object.create(OmegaTargetChromium);

  Promise = OmegaTargetCurrent.Promise;

  Promise.longStackTraces();

  OmegaTargetCurrent.Log = Object.create(OmegaTargetCurrent.Log);

  Log = OmegaTargetCurrent.Log;

  _writeLogToLocalStorage = function(content) {
    var _;
    try {
      return localStorage['log'] += content;
    } catch (_error) {
      _ = _error;
      return localStorage['log'] = content;
    }
  };

  Log.log = function() {
    var args, content;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    console.log.apply(console, args);
    content = args.map(Log.str.bind(Log)).join(' ') + '\n';
    return _writeLogToLocalStorage(content);
  };

  Log.error = function() {
    var args, content;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    console.error.apply(console, args);
    content = args.map(Log.str.bind(Log)).join(' ');
    localStorage['logLastError'] = content;
    return _writeLogToLocalStorage('ERROR: ' + content + '\n');
  };

  unhandledPromises = [];

  unhandledPromisesId = [];

  unhandledPromisesNextId = 1;

  Promise.onPossiblyUnhandledRejection(function(reason, promise) {
    Log.error("[" + unhandledPromisesNextId + "] Unhandled rejection:\n", reason);
    unhandledPromises.push(promise);
    unhandledPromisesId.push(unhandledPromisesNextId);
    return unhandledPromisesNextId++;
  });

  Promise.onUnhandledRejectionHandled(function(promise) {
    var index;
    index = unhandledPromises.indexOf(promise);
    Log.log("[" + unhandledPromisesId[index] + "] Rejection handled!", promise);
    unhandledPromises.splice(index, 1);
    return unhandledPromisesId.splice(index, 1);
  });

  iconCache = {};

  drawContext = null;

  drawError = null;

  charCodeUnderscore = '_'.charCodeAt(0);

  isHidden = function(name) {
    return name.charCodeAt(0) === charCodeUnderscore && name.charCodeAt(1) === charCodeUnderscore;
  };

  dispName = function(name) {
    return chrome.i18n.getMessage('profile_' + name) || name;
  };

  actionForUrl = function(url) {
    return options.ready.then(function() {
      var request;
      request = OmegaPac.Conditions.requestFromUrl(url);
      return options.matchProfile(request);
    }).then(function(_arg) {
      var attached, condition, condition2Str, current, currentName, details, direct, icon, name, profile, profileColor, realCurrentName, result, resultColor, results, shortTitle, _i, _len, _ref, _ref1;
      profile = _arg.profile, results = _arg.results;
      current = options.currentProfile();
      currentName = dispName(current.name);
      if (current.profileType === 'VirtualProfile') {
        realCurrentName = current.defaultProfileName;
        currentName += " [" + (dispName(realCurrentName)) + "]";
        current = options.profile(realCurrentName);
      }
      details = '';
      direct = false;
      attached = false;
      condition2Str = function(condition) {
        return condition.pattern || OmegaPac.Conditions.str(condition);
      };
      for (_i = 0, _len = results.length; _i < _len; _i++) {
        result = results[_i];
        if (Array.isArray(result)) {
          if (result[1] == null) {
            attached = false;
            name = result[0];
            if (name[0] === '+') {
              name = name.substr(1);
            }
            if (isHidden(name)) {
              attached = true;
            } else if (name !== realCurrentName) {
              details += chrome.i18n.getMessage('browserAction_defaultRuleDetails');
              details += " => " + (dispName(name)) + "\n";
            }
          } else if (result[1].length === 0) {
            if (result[0] === 'DIRECT') {
              details += chrome.i18n.getMessage('browserAction_directResult');
              details += '\n';
              direct = true;
            } else {
              details += "" + result[0] + "\n";
            }
          } else if (typeof result[1] === 'string') {
            details += "" + result[1] + " => " + result[0] + "\n";
          } else {
            condition = condition2Str((_ref = result[1].condition) != null ? _ref : result[1]);
            details += "" + condition + " => ";
            if (result[0] === 'DIRECT') {
              details += chrome.i18n.getMessage('browserAction_directResult');
              details += '\n';
              direct = true;
            } else {
              details += "" + result[0] + "\n";
            }
          }
        } else if (result.profileName) {
          if (result.isTempRule) {
            details += chrome.i18n.getMessage('browserAction_tempRulePrefix');
          } else if (attached) {
            details += chrome.i18n.getMessage('browserAction_attachedPrefix');
            attached = false;
          }
          condition = (_ref1 = result.source) != null ? _ref1 : condition2Str(result.condition);
          details += "" + condition + " => " + (dispName(result.profileName)) + "\n";
        }
      }
      if (!details) {
        details = options.printProfile(current);
      }
      resultColor = profile.color;
      profileColor = current.color;
      icon = null;
      if (direct) {
        resultColor = options.profile('direct').color;
        profileColor = profile.color;
        chrome.browserAction.setIcon({path: "img/icons/dw-logo-disable-16.png"});
      } else if (profile.name === current.name && options.isCurrentProfileStatic()) {
        resultColor = profileColor = profile.color;
        if(profile.name=="direct"){
          chrome.browserAction.setIcon({path: "img/icons/dw-logo-disable-16.png"});
        }else{
          chrome.browserAction.setIcon({path: "img/icons/dw-logo-16.png"});
        }
      } else {
        resultColor = profile.color;
        profileColor = current.color;
      }
      shortTitle = 'Omega: ' + currentName;
      if (profile.name !== currentName) {
        shortTitle += ' => ' + profile.name;
      }
      return {
        title: chrome.i18n.getMessage('browserAction_titleWithResult', [currentName, dispName(profile.name), details]),
        shortTitle: shortTitle,
        resultColor: resultColor,
        profileColor: profileColor
      };
    })["catch"](function() {
      return null;
    });
  };

  storage = new OmegaTargetCurrent.Storage('local');

  state = new OmegaTargetCurrent.BrowserStorage(localStorage, 'omega.local.');

  if ((typeof chrome !== "undefined" && chrome !== null ? (_ref = chrome.storage) != null ? _ref.sync : void 0 : void 0) || (typeof browser !== "undefined" && browser !== null ? (_ref1 = browser.storage) != null ? _ref1.sync : void 0 : void 0)) {
    syncStorage = new OmegaTargetCurrent.Storage('sync');
    sync = new OmegaTargetCurrent.OptionsSync(syncStorage);
    if (localStorage['omega.local.syncOptions'] !== '"sync"') {
      sync.enabled = false;
    }
    sync.transformValue = OmegaTargetCurrent.Options.transformValueForSync;
  }

  proxyImpl = OmegaTargetCurrent.proxy.getProxyImpl(Log);

  state.set({
    proxyImplFeatures: proxyImpl.features
  });

  options = new OmegaTargetCurrent.Options(null, storage, state, Log, sync, proxyImpl);

  options.externalApi = new OmegaTargetCurrent.ExternalApi(options);

  options.externalApi.listen();

  if (chrome.runtime.id !== OmegaTargetCurrent.SwitchySharp.extId) {
    options.switchySharp = new OmegaTargetCurrent.SwitchySharp();
    options.switchySharp.monitor();
  }

  tabs = new OmegaTargetCurrent.ChromeTabs(actionForUrl);

  tabs.watch();

  options._inspect = new OmegaTargetCurrent.Inspect(function(url, tab) {
    if (url === tab.url) {
      options.clearBadge();
      tabs.processTab(tab);
      state.remove('inspectUrl');
      return;
    }
    state.set({
      inspectUrl: url
    });
    return actionForUrl(url).then(function(action) {
      var parsedUrl, title, urlDisp;
      if (!action) {
        return;
      }
      parsedUrl = OmegaTargetCurrent.Url.parse(url);
      if (parsedUrl.hostname === OmegaTargetCurrent.Url.parse(tab.url).hostname) {
        urlDisp = parsedUrl.path;
      } else {
        urlDisp = parsedUrl.hostname;
      }
      title = chrome.i18n.getMessage('browserAction_titleInspect', urlDisp) + '\n';
      title += action.title;
      chrome.browserAction.setTitle({
        title: title,
        tabId: tab.id
      });
      return tabs.setTabBadge(tab, {
        text: '#',
        color: action.resultColor
      });
    });
  });

  options.setProxyNotControllable(null);

  timeout = null;

  proxyImpl.watchProxyChange(function(details) {
    var internal, noRevert, notControllableBefore, parsed, reason;
    if (options.externalApi.disabled) {
      return;
    }
    if (!details) {
      return;
    }
    notControllableBefore = options.proxyNotControllable();
    internal = false;
    noRevert = false;
    switch (details['levelOfControl']) {
      case "controlled_by_other_extensions":
      case "not_controllable":
        reason = details['levelOfControl'] === 'not_controllable' ? 'policy' : 'app';
        options.setProxyNotControllable(reason);
        noRevert = true;
        break;
      default:
        options.setProxyNotControllable(null);
    }
    if (details['levelOfControl'] === 'controlled_by_this_extension') {
      internal = true;
      if (!notControllableBefore) {
        return;
      }
    }
    Log.log('external proxy: ', details);
    if (timeout != null) {
      clearTimeout(timeout);
    }
    parsed = null;
    timeout = setTimeout((function() {
      if (parsed) {
        return options.setExternalProfile(parsed, {
          noRevert: noRevert,
          internal: internal
        });
      }
    }), 500);
    parsed = proxyImpl.parseExternalProfile(details, options._options);
  });

  external = false;

  options.currentProfileChanged = function(reason) {
    var current, currentName, details, icon, message, realCurrentName, shortTitle, title;
    iconCache = {};
    if (reason === 'external') {
      external = true;
    } else if (reason !== 'clearBadge') {
      external = false;
    }
    current = options.currentProfile();
    currentName = '';
    if (current) {
      currentName = dispName(current.name);
      if (current.profileType === 'VirtualProfile') {
        realCurrentName = current.defaultProfileName;
        currentName += " [" + (dispName(realCurrentName)) + "]";
        current = options.profile(realCurrentName);
      }
    }
    details = options.printProfile(current);
    if (currentName) {
      title = chrome.i18n.getMessage('browserAction_titleWithResult', [currentName, '', details]);
      shortTitle = 'Omega: ' + currentName;
    } else {
      title = details;
      shortTitle = 'Omega: ' + details;
    }
    if (external && current.profileType !== 'SystemProfile') {
      message = chrome.i18n.getMessage('browserAction_titleExternalProxy');
      title = message + '\n' + title;
      shortTitle = 'Omega-Extern: ' + details;
      options.setBadge();
    }
    if (!current.name || !OmegaPac.Profiles.isInclusive(current)) {
      if(current.name=="direct"){
        chrome.browserAction.setIcon({path: "img/icons/dw-logo-disable-16.png"});
      }else{
        chrome.browserAction.setIcon({path: "img/icons/dw-logo-16.png"});
      }
    } else {
      chrome.browserAction.setIcon({path: "img/icons/dw-logo-16.png"});
    }

    return tabs.resetAll({
      title: title,
      shortTitle: shortTitle
    });
  };

  encodeError = function(obj) {
    if (obj instanceof Error) {
      return {
        _error: 'error',
        name: obj.name,
        message: obj.message,
        stack: obj.stack,
        original: obj
      };
    } else {
      return obj;
    }
  };

  refreshActivePageIfEnabled = function() {
    if (localStorage['omega.local.refreshOnProfileChange'] === 'false') {
      return;
    }
    return chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, function(tabs) {
      var url;
      url = tabs[0].url;
      if (!url) {
        return;
      }
      if (url.substr(0, 6) === 'chrome') {
        return;
      }
      if (url.substr(0, 6) === 'about:') {
        return;
      }
      if (url.substr(0, 4) === 'moz-') {
        return;
      }
      return chrome.tabs.reload(tabs[0].id, {
        bypassCache: true
      });
    });
  };

  chrome.runtime.onMessage.addListener(function(request, sender, respond) {
    if (!(request && request.method)) {
      return;
    }
    options.ready.then(function() {
      var method, promise, target;
      if (request.method === 'getState') {
        target = state;
        method = state.get;
      } else {
        target = options;
        method = target[request.method];
      }
      if (typeof method !== 'function') {
        Log.error("No such method " + request.method + "!");
        respond({
          error: {
            reason: 'noSuchMethod'
          }
        });
        return;
      }
      promise = Promise.resolve().then(function() {
        return method.apply(target, request.args);
      });
      if (request.refreshActivePage) {
        promise.then(refreshActivePageIfEnabled);
      }
      if (request.noReply) {
        return;
      }
      promise.then(function(result) {
        var key, value;
        if (request.method === 'updateProfile') {
          for (key in result) {
            if (!__hasProp.call(result, key)) continue;
            value = result[key];
            result[key] = encodeError(value);
          }
        }
        return respond({
          result: result
        });
      });
      return promise["catch"](function(error) {
        Log.error(request.method + ' ==>', error);
        return respond({
          error: encodeError(error)
        });
      });
    });
    if (!request.noReply) {
      return true;
    }
  });

}).call(this);

