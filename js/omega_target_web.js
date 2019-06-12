(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty;

  angular.module('omegaTarget', []).factory('omegaTarget', function($q) {
    var callBackground, callBackgroundNoReply, connectBackground, decodeError, isChromeUrl, omegaTarget, optionsChangeCallback, prefix, requestInfoCallback, urlParser;
    decodeError = function(obj) {
      var err;
      if (obj._error === 'error') {
        err = new Error(obj.message);
        err.name = obj.name;
        err.stack = obj.stack;
        err.original = obj.original;
        return err;
      } else {
        return obj;
      }
    };
    callBackgroundNoReply = function() {
      var args, method;
      method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return chrome.runtime.sendMessage({
        method: method,
        args: args,
        noReply: true
      });
    };
    callBackground = function() {
      var args, d, method;
      method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      d = $q['defer']();
      chrome.runtime.sendMessage({
        method: method,
        args: args
      }, function(response) {
        if (chrome.runtime.lastError != null) {
          d.reject(chrome.runtime.lastError);
          return;
        }
        if (response.error) {
          return d.reject(decodeError(response.error));
        } else {
          return d.resolve(response.result);
        }
      });
      return d.promise;
    };
    connectBackground = function(name, message, callback) {
      var onDisconnect, port;
      port = chrome.runtime.connect({
        name: name
      });
      onDisconnect = function() {
        port.onDisconnect.removeListener(onDisconnect);
        return port.onMessage.removeListener(callback);
      };
      port.onDisconnect.addListener(onDisconnect);
      port.postMessage(message);
      port.onMessage.addListener(callback);
    };
    isChromeUrl = function(url) {
      return url.substr(0, 6) === 'chrome' || url.substr(0, 4) === 'moz-' || url.substr(0, 6) === 'about:';
    };
    optionsChangeCallback = [];
    requestInfoCallback = null;
    prefix = 'omega.local.';
    urlParser = document.createElement('a');
    omegaTarget = {
      options: null,
      state: function(name, value) {
        var getValue;
        if (arguments.length === 1) {
          getValue = function(key) {
            try {
              return JSON.parse(localStorage[prefix + key]);
            } catch (_error) {}
          };
          if (Array.isArray(name)) {
            return $q.when(name.map(getValue));
          } else {
            value = getValue(name);
          }
        } else {
          localStorage[prefix + name] = JSON.stringify(value);
        }
        return $q.when(value);
      },
      lastUrl: function(url) {
        var name;
        name = 'web.last_url';
        if (url) {
          omegaTarget.state(name, url);
          return url;
        } else {
          try {
            return JSON.parse(localStorage[prefix + name]);
          } catch (_error) {}
        }
      },
      addOptionsChangeCallback: function(callback) {
        return optionsChangeCallback.push(callback);
      },
      refresh: function(args) {
        return callBackground('getAll').then(function(opt) {
          var callback, _i, _len;
          omegaTarget.options = opt;
          for (_i = 0, _len = optionsChangeCallback.length; _i < _len; _i++) {
            callback = optionsChangeCallback[_i];
            callback(omegaTarget.options);
          }
          return args;
        });

      },
      renameProfile: function(fromName, toName) {
        return callBackground('renameProfile', fromName, toName).then(omegaTarget.refresh);
      },
      replaceRef: function(fromName, toName) {
        return callBackground('replaceRef', fromName, toName).then(omegaTarget.refresh);
      },
      optionsPatch: function(patch) {
        return callBackground('patch', patch).then(omegaTarget.refresh);
      },
      resetOptions: function(opt) {
        return callBackground('reset', opt).then(omegaTarget.refresh);
      },
      updateProfile: function(name, opt_bypass_cache) {
        return callBackground('updateProfile', name, opt_bypass_cache).then(function(results) {
          var key, value;
          for (key in results) {
            if (!__hasProp.call(results, key)) continue;
            value = results[key];
            results[key] = decodeError(value);
          }
          return results;
        }).then(omegaTarget.refresh);
      },
      getMessage: chrome.i18n.getMessage.bind(chrome.i18n),
      openOptions: function(hash) {
        var d, options_url;
        d = $q['defer']();
        options_url = chrome.extension.getURL('options.html');
        chrome.tabs.query({
          url: options_url
        }, function(tabs) {
          var props, url, _ref;
          url = hash ? (urlParser.href = ((_ref = tabs[0]) != null ? _ref.url : void 0) || options_url, urlParser.hash = hash, urlParser.href) : options_url;
          if (tabs.length > 0) {
            props = {
              active: true
            };
            if (hash) {
              props.url = url;
            }
            chrome.tabs.update(tabs[0].id, props);
          } else {
            chrome.tabs.create({
              url: url
            });
          }
          return d.resolve();
        });
        return d.promise;
      },
      applyProfile: function(name) {
        return callBackground('applyProfile', name);
      },
      applyProfileNoReply: function(name) {
        return callBackgroundNoReply('applyProfile', name);
      },
      addTempRule: function(domain, profileName) {
        return callBackground('addTempRule', domain, profileName);
      },
      addCondition: function(condition, profileName) {
        return callBackground('addCondition', condition, profileName);
      },
      addProfile: function(profile) {
        return callBackground('addProfile', profile).then(omegaTarget.refresh);
      },
      setDefaultProfile: function(profileName, defaultProfileName) {
        return callBackground('setDefaultProfile', profileName, defaultProfileName);
      },
      getActivePageInfo: function() {
        var clearBadge, d;
        clearBadge = true;
        d = $q['defer']();
        chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        }, function(tabs) {
          var args, _ref;
          if (!((_ref = tabs[0]) != null ? _ref.url : void 0)) {
            d.resolve(null);
            return;
          }
          args = {
            tabId: tabs[0].id,
            url: tabs[0].url
          };
          if (tabs[0].id && requestInfoCallback) {
            connectBackground('tabRequestInfo', args, requestInfoCallback);
          }
          return d.resolve(callBackground('getPageInfo', args));
        });
        return d.promise.then(function(info) {
          if (info != null ? info.url : void 0) {
            return info;
          } else {
            return null;
          }
        });
      },
      refreshActivePage: function() {
        var d;
        d = $q['defer']();
        chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        }, function(tabs) {
          if (tabs[0].url && !isChromeUrl(tabs[0].url)) {
            chrome.tabs.reload(tabs[0].id, {
              bypassCache: true
            });
          }
          return d.resolve();
        });
        return d.promise;
      },
      openManage: function() {
        return chrome.tabs.create({
          url: 'chrome://extensions/?id=' + chrome.runtime.id
        });
      },
      openShortcutConfig: function() {
        return chrome.tabs.create({
          url: 'chrome://extensions/configureCommands'
        });
      },
      setOptionsSync: function(enabled, args) {
        return callBackground('setOptionsSync', enabled, args);
      },
      resetOptionsSync: function(enabled, args) {
        return callBackground('resetOptionsSync');
      },
      setRequestInfoCallback: function(callback) {
        return requestInfoCallback = callback;
      }
    };
    return omegaTarget;
  });

}).call(this);
