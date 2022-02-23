const defaultOptions = function() {
    const options = Object.create(null);
    options['omitZeroComments'] = true;
    return options;
};

// set missing options using defaults
(function() {
    chrome.storage.local.get(['options'], function(result) {
        const options = result.options;
        const defaults = defaultOptions();
        const keys = Object.keys(defaults);
        for (const key of keys) {
            if (!(key in options)) {
                options[key] = defaults[key];
            }
        }
        chrome.storage.local.set({options: options});
    });
})();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const method = request.method;
    if (method === 'getDefaultOptions') {
        sendResponse(defaultOptions());
    }
});
