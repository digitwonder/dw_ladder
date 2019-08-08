(function () {
    var attachedPrefix, charCodeUnderscore, colors, profileColorPalette, profileColors;

    angular.module('omega').constant('builtinProfiles', OmegaPac.Profiles.builtinProfiles);

    profileColors = ['#9ce', '#9d9', '#fa8', '#fe9', '#d497ee', '#47b', '#5b5', '#d63', '#ca0'];

    colors = [].concat(profileColors);

    profileColorPalette = ((function () {
        var _results;
        _results = [];
        while (colors.length) {
            _results.push(colors.splice(0, 3));
        }
        return _results;
    })());

    angular.module('omega').constant('profileColors', profileColors);

    angular.module('omega').constant('profileColorPalette', profileColorPalette);

    attachedPrefix = '__ruleListOf_';

    angular.module('omega').constant('getAttachedName', function (name) {
        return attachedPrefix + name;
    });

    angular.module('omega').constant('getParentName', function (name) {
        if (name.indexOf(attachedPrefix) === 0) {
            return name.substr(attachedPrefix.length);
        } else {
            return void 0;
        }
    });

    charCodeUnderscore = '_'.charCodeAt(0);

    angular.module('omega').constant('charCodeUnderscore', charCodeUnderscore);

    angular.module('omega').constant('isProfileNameHidden', function (name) {
        return name.charCodeAt(0) === charCodeUnderscore;
    });

    angular.module('omega').constant('isProfileNameReserved', function (name) {
        return name.charCodeAt(0) === charCodeUnderscore && name.charCodeAt(1) === charCodeUnderscore;
    });

    angular.module('omega').factory('$exceptionHandler', function ($log) {
        return function (exception, cause) {
            if (exception.message === 'transition aborted') {
                return;
            }
            if (exception.message === 'transition superseded') {
                return;
            }
            if (exception.message === 'transition prevented') {
                return;
            }
            if (exception.message === 'transition failed') {
                return;
            }
            return $log.error(exception, cause);
        };
    });

    angular.module('omega').factory('downloadFile', function () {
        var _ref;
        if ((typeof browser !== "undefined" && browser !== null ? (_ref = browser.downloads) != null ? _ref.download : void 0 : void 0) != null) {
            return function (blob, filename) {
                var url;
                url = URL.createObjectURL(blob);
                if (filename) {
                    return browser.downloads.download({
                        url: url,
                        filename: filename
                    });
                } else {
                    return browser.downloads.download({
                        url: url
                    });
                }
            };
        } else {
            return function (blob, filename) {
                var noAutoBom;
                noAutoBom = true;
                return saveAs(blob, filename, noAutoBom);
            };
        }
    });

}).call(this);

(function () {
    var __hasProp = {}.hasOwnProperty;
    angular.module('omega').controller('MasterCtrl', function ($scope, $rootScope, $window, $q, $modal, $state, profileColors, profileIcons, omegaTarget, $timeout, $location, $filter, getAttachedName, isProfileNameReserved, isProfileNameHidden, dispNameFilter, downloadFile) {
        var checkFormValid, diff, onOptionChange, showFirstRun, showFirstRunOnce, tr, type, _ref, _ref1, _ref2;
        var defaultPac;
        if (((typeof browser !== "undefined" && browser !== null ? (_ref = browser.proxy) != null ? _ref.register : void 0 : void 0) != null) || ((typeof browser !== "undefined" && browser !== null ? (_ref1 = browser.proxy) != null ? _ref1.registerProxyScript : void 0 : void 0) != null)) {
            $scope.isExperimental = true;
            $scope.pacProfilesUnsupported = true;
        }
        tr = $filter('tr');
        $rootScope.options = null;

        $scope.model = '';
        $.getJSON("default_pac.json",function(data){
            defaultPac=data.defaultPac;
        });
        setTimeout(()=>{
            if($rootScope.options['+启用']){
                $scope.model = $rootScope.options['+启用'].pacUrl;
            }else{
                $scope = defaultPac;
            }
        },100);
        //添加选项更改回调--return inputValue
        omegaTarget.addOptionsChangeCallback(function (newOptions) {
            $rootScope.options = angular.copy(newOptions);
            $rootScope.optionsOld = angular.copy(newOptions);
            omegaTarget.state('syncOptions').then(function (syncOptions) {
                return $scope.syncOptions = syncOptions;
            });
            return $timeout(function () {
                $rootScope.optionsDirty = false;
                return showFirstRun();
            });
        });

        //还原选项function
        $rootScope.revertOptions = function () {
            return $window.location.reload();
        };

        //导出脚本function
        $rootScope.exportScript = function (name) {
            var getProfileName;
            getProfileName = name ? $q.when(name) : omegaTarget.state('currentProfileName');
            return getProfileName.then(function (profileName) {
                var ast, blob, fileName, missingProfile, pac, profile, profileNotFound, _ref2;
                if (!profileName) {
                    return;
                }
                profile = $rootScope.profileByName(profileName);
                if ((_ref2 = profile.profileType) === 'DirectProfile' || _ref2 === 'SystemProfile') {
                    return;
                }
                missingProfile = null;
                profileNotFound = function (name) {
                    missingProfile = name;
                    return 'dumb';
                };
                ast = OmegaPac.PacGenerator.script($rootScope.options, profileName, {
                    profileNotFound: profileNotFound
                });
                pac = ast.print_to_string({
                    beautify: true,
                    comments: true
                });
                pac = OmegaPac.PacGenerator.ascii(pac);
                blob = new Blob([pac], {
                    type: "text/plain;charset=utf-8"
                });
                fileName = profileName.replace(/\W+/g, '_');
                downloadFile(blob, "OmegaProfile_" + fileName + ".pac");
                if (missingProfile) {
                    return $timeout(function () {
                        return $rootScope.showAlert({
                            type: 'error',
                            message: tr('options_profileNotFound', [missingProfile])
                        });
                    });
                }
            });
        };
        diff = jsondiffpatch.create({
            objectHash: function (obj) {
                return JSON.stringify(obj);
            },
            textDiff: {
                minLength: 1 / 0
            }
        });

        //展示弹窗function
        $rootScope.showAlert = function (alert) {
            return $timeout(function () {
                $scope.alert = alert;
                $scope.alertShown = true;
                $scope.alertShownAt = Date.now();
                $timeout($rootScope.hideAlert, 3000);
            });
        };

        //隐藏弹窗
        $rootScope.hideAlert = function () {
            return $timeout(function () {
                if (Date.now() - $scope.alertShownAt >= 1000) {
                    return $scope.alertShown = false;
                }
            });
        };

        //检查表的可用性 function
        checkFormValid = function () {
            var fields;
            fields = angular.element('.ng-invalid');
            if (fields.length > 0) {
                fields[0].focus();
                $rootScope.showAlert({
                    type: 'error',
                    i18n: 'options_formInvalid'
                });
                return false;
            }
            return true;
        };
        $rootScope.applyOptions = function () {
            var patch, plainOptions;
            if (!checkFormValid()) {
                return;
            }
            if ($rootScope.$broadcast('omegaApplyOptions').defaultPrevented) {
                return;
            }
            plainOptions = angular.fromJson(angular.toJson($rootScope.options));
            patch = diff.diff($rootScope.optionsOld, plainOptions);
            return omegaTarget.optionsPatch(patch).then(function () {
                return $rootScope.showAlert({
                    type: 'success',
                    i18n: 'options_saveSuccess'
                });
            });
        };

        //重置选项 function
        $rootScope.resetOptions = function (options) {
            return omegaTarget.resetOptions(options).then(function () {
                return $rootScope.showAlert({
                    type: 'success',
                    i18n: 'options_resetSuccess'
                });
            })["catch"](function (err) {
                $rootScope.showAlert({
                    type: 'error',
                    message: err
                });
                return $q.reject(err);
            });
        };
        $rootScope.profileByName = function (name) {
            return OmegaPac.Profiles.byName(name, $rootScope.options);
        };
        $rootScope.systemProfile = $rootScope.profileByName('system');
        $rootScope.externalProfile = {
            color: '#49afcd',
            name: tr('popup_externalProfile'),
            profileType: 'FixedProfile',
            fallbackProxy: {
                host: "127.0.0.1",
                port: 42,
                scheme: "http"
            }
        };
        $rootScope.applyOptionsConfirm = function () {
            if (!checkFormValid()) {
                return $q.reject('form_invalid');
            }
            if (!$rootScope.optionsDirty) {
                return $q.when(true);
            }
            return $rootScope.applyOptions();
        };
        $rootScope.enterUpdate=function(e){
            let ev = e||window.event;
            if(ev.keyCode==13){
                // $rootScope.updateProfile("启用");
                // $rootScope.updateProfile(undefined) //依旧不对--尝试写一个模拟点击事件
                $('#pac-button-button').focus();
                $('#pac-button-button').click()


            }
        }
        $rootScope.modify = function () {
            if (document.getElementById("main").style.display == "block") {
                document.getElementById("main").style.display = "none";
                document.getElementById("setting").style.cssText = "background-color:#FFFFFF;color:#49c5b6;";
                document.getElementById("own-switch").style.cssText = "padding-bottom:0";
            } else {
                document.getElementById("main").style.display = "block";
                document.getElementById("setting").style.cssText = "background-color:rgb(248,249,250);color:#000;height:2.2rem";
                document.getElementById("own-switch").style.cssText = "padding-bottom:0.5rem";
            }
        };
        $rootScope.newProfile = function () {
            var scope;
            scope = $rootScope.$new('isolate');
            scope.options = $rootScope.options;
            scope.isProfileNameReserved = isProfileNameReserved;
            scope.isProfileNameHidden = isProfileNameHidden;
            scope.profileByName = $rootScope.profileByName;
            scope.validateProfileName = {
                conflict: '!$value || !profileByName($value)',
                reserved: '!$value || !isProfileNameReserved($value)'
            };
            scope.profileIcons = profileIcons;
            scope.dispNameFilter = dispNameFilter;
            scope.options = $scope.options;
            scope.pacProfilesUnsupported = $scope.pacProfilesUnsupported;
            let profile = {
                name: "启用",
                profileType: 'PacProfile',
                color: '#0D5',
                pacUrl: defaultPac
            };
            var choice;
            choice = Math.floor(Math.random() * profileColors.length);
            if (profile.color == null) {
                profile.color = profileColors[choice];
            }
            profile = OmegaPac.Profiles.create(profile);
            OmegaPac.Profiles.updateRevision(profile);
            $rootScope.options[OmegaPac.Profiles.nameAsKey(profile)] = profile;
            $rootScope.updateProfile(profile.name);
            $rootScope.applyOptions();
            return ({
                name: profile.name
            });
        };
        $scope.updatingProfile = {};
        $rootScope.updateProfile = function (name) {
            console.log(name)
            var regex = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;
            if (regex.test($scope.model)) {
                document.getElementById("update-message").style.display = "none";
                document.getElementById("loadingSpinner").style.display = "block";
                if ($rootScope.optionsOld['+启用']) {
                    var oldPacUrl = $rootScope.optionsOld['+启用'].pacUrl;
                }
                return $rootScope.applyOptionsConfirm().then(function () {
                    return omegaTarget.updateProfile(name, 'bypass_cache').then(function (results) {
                        var error, profileName, result, singleErr, success;
                        success = 0;
                        error = 0;
                        for (profileName in results) {
                            if (!__hasProp.call(results, profileName)) continue;
                            result = results[profileName];
                            if (result instanceof Error) {
                                error++;
                            } else {
                                success++;
                            }
                        }
                        if (error === 0) {
                            document.getElementById("loadingSpinner").style.display = "none";
                            document.querySelector('#update-message').textContent = "更新成功";
                            document.querySelector('#update-message').title = "";
                            document.querySelector('#update-message').style = "color:#0C0;font-size:0.5rem";
                            return $rootScope.showAlert({
                                type: 'success',
                                i18n: 'options_profileDownloadSuccess'
                            });
                        } else {
                            if (error === 1) {
                                singleErr = results[OmegaPac.Profiles.nameAsKey("启用")];
                                if (singleErr) {
                                    return $q.reject(singleErr);
                                }
                            }
                            return $q.reject(results);
                        }
                    })["catch"](function (err) {
                        var message, _ref2, _ref3, _ref4;
                        message = tr('options_profileDownloadError_' + err.name, [(_ref2 = (_ref3 = err.statusCode) != null ? _ref3 : (_ref4 = err.original) != null ? _ref4.statusCode : void 0) != null ? _ref2 : '']);
                        if (message) {
                            document.getElementById("loadingSpinner").style.display = "none";
                            document.querySelector('#update-message').textContent = "更新失败";
                            document.querySelector('#update-message').style = "color:#F00;font-size:1rem;";
                            document.querySelector('#update-message').title = message;
                            $rootScope.options['+启用'].pacUrl = oldPacUrl;
                            return $rootScope.applyOptions();
                        } else {
                            return $rootScope.showAlert({
                                type: 'error',
                                i18n: 'options_profileDownloadError'
                            });
                        }
                    })["finally"](function () {
                        //$scope.model = "";
                        $rootScope.profileByName("启用").pacUrl = $scope.model;
                        if (name != null) {
                            return $scope.updatingProfile[name] = false;
                        } else {
                            return $scope.updatingProfile = {};
                        }
                    });
                });
            } else if($scope.model == undefined){
                document.getElementById("update-message").style.display = "none";
            }else {
                $scope.model = "";
                document.querySelector('#update-message').textContent = "更新失败";
                document.querySelector('#update-message').style = "color:#F00;font-size:1rem;";
                document.querySelector('#update-message').title = "PAC脚本地址格式不正确";
            }
        };
        onOptionChange = function (options, oldOptions) {
            if (options === oldOptions || (oldOptions == null)) {
                return;
            }
            return $rootScope.optionsDirty = true;
        };
        $rootScope.$watch('options', onOptionChange, true);
        $rootScope.$on('$stateChangeStart', function (event, _, __, fromState) {
            if (!checkFormValid()) {
                return event.preventDefault();
            }
        });
        $rootScope.$on('$stateChangeSuccess', function () {
            return omegaTarget.lastUrl($location.url());
        });
        $window.onbeforeunload = function () {
            if ($rootScope.optionsDirty) {
                return tr('options_optionsNotSaved');
            } else {
                return null;
            }
        };
        document.addEventListener('click', (function () {
            return $rootScope.hideAlert();
        }), false);
        $scope.profileIcons = profileIcons;
        $scope.dispNameFilter = dispNameFilter;
        _ref2 = OmegaPac.Profiles.formatByType;
        for (type in _ref2) {
            if (!__hasProp.call(_ref2, type)) continue;
            $scope.profileIcons[type] = $scope.profileIcons['RuleListProfile'];
        }
        $scope.alertIcons = {
            'success': 'glyphicon-ok',
            'warning': 'glyphicon-warning-sign',
            'error': 'glyphicon-remove',
            'danger': 'glyphicon-danger'
        };
        $scope.alertClassForType = function (type) {
            if (!type) {
                return '';
            }
            if (type === 'error') {
                type = 'danger';
            }
            return 'alert-' + type;
        };
        $scope.downloadIntervals = [15, 60, 180, 360, 720, 1440, -1];
        $scope.downloadIntervalI18n = function (interval) {
            return "options_downloadInterval_" + (interval < 0 ? "never" : interval);
        };
        $scope.openShortcutConfig = omegaTarget.openShortcutConfig.bind(omegaTarget);
        showFirstRunOnce = true;
        showFirstRun = function () {
            if (!showFirstRunOnce) {
                return;
            }
            showFirstRunOnce = false;
            return omegaTarget.state('firstRun').then(function (firstRun) {
                var profileName, scope;
                if (!firstRun) {
                    return;
                } else {
                    $rootScope.newProfile();
                }
                omegaTarget.state('firstRun', '');
                profileName = null;
                OmegaPac.Profiles.each($rootScope.options, function (key, profile) {
                    if (!profileName && profile.profileType === 'FixedProfile') {
                        return profileName = profile.name;
                    }
                });
                if (!profileName) {
                    return;
                }
                scope = $rootScope.$new('isolate');
                scope.upgrade = firstRun === 'upgrade';
            });
        };
        return omegaTarget.refresh();
    });

}).call(this);

(function () {
    angular.module('omega').directive('inputGroup', function ($timeout, $rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                scope.catchAll = new RegExp('');
                $timeout(function () {
                    return scope.controller = element.find('input').controller('ngModel');
                });
                scope.oldModel = '';
                scope.controller = scope.input;
                return element.on('change', function () {
                    if (element[0].value) {
                        $rootScope.profileByName("启用").pacUrl = element[0].value;
                        return scope.oldModel = '';
                    }
                });
            }
        };
    });

}).call(this);

(function () {
    angular.module('omega').filter('tr', function (omegaTarget) {
        return omegaTarget.getMessage;
    });

    angular.module('omega').filter('dispName', function (omegaTarget) {
        return function (name) {
            if (typeof name === 'object') {
                name = name.name;
            }
            return omegaTarget.getMessage('profile_' + name) || name;
        };
    });

}).call(this);

(function () {
    angular.module('omega').directive('ngLoading', function (Session, $compile) {
        var loadingSpinner = '<img src="https://img.icons8.com/color/48/000000/spinner-frame-7.png">';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var originalContent = element.html();
                element.html(loadingSpinner);
                scope.$watch(attrs.ngLoading, function (val) {
                    if (val) {
                        element.html(originalContent);
                        $compile(element.contents())(scope);
                    } else {
                        element.html(loadingSpinner);
                    }
                });
            }
        };
    });
}).call(this);
