window.OmegaPopup = {};
$script('/js/omega_target_popup.js', 'om-target', function() {
  OmegaTargetPopup.getActivePageInfo(function(err, info) {
    window.OmegaPopup.pageInfo = info;
    $script.done('om-page-info');
  });
  OmegaTargetPopup.getState([
    'availableProfiles',
    'currentProfileName',
    'validResultProfiles',
    'isSystemProfile',
    'currentProfileCanAddRule',
    'proxyNotControllable',
    'externalProfile',
    'showExternalProfile',
  ], function(err, state) {
    window.OmegaPopup.state = state;
    $script.done('om-state');
  });
});
