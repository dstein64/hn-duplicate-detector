var defaultOptions = function() {
    var options = Object.create(null);
    options['omitZeroComments'] = true;
    return options;
};

// set missing options using defaults
(function() {
    chrome.storage.local.get({options: {}}, function(result) {
        var options = result.options;
        var defaults = defaultOptions();
        var keys = Object.keys(defaults);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!(key in options)) {
                options[key] = defaults[key];
            }
        }
        chrome.storage.local.set({options: options});
    });
})();
