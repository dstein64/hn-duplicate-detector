// WARN: For functions that are called from the options page, proper scope is
// necessary (e.g., using a function declaration beginning with a 'function',
// or using a function expression beginning with 'var', but not a function
// expression beginning with 'let' or 'const').

function defaultOptions() {
    const options = Object.create(null);
    options['omitZeroComments'] = true;
    options['linkColor'] = '#ff6600';  // HN orange
    return options;
}

// set missing options using defaults
(function() {
    chrome.storage.local.get({options: {}}, function(result) {
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
