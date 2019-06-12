(function() {
    $(document).ready(function() {
        $("#onoffswitch").on('click', function () {
            clickSwitch();
        });

        var clickSwitch = function () {
            if ($("#onoffswitch").is(':checked')) {
                setTimeout(function(){OmegaPopup.applyProfile('启用');},300);
            } else {
                setTimeout(function(){OmegaPopup.applyProfile("direct");},300);
            }
        };
    });
}).call(this);