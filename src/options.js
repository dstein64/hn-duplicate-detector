let curTimer = null;
const statusMessage = function(message, time) {
    time = (typeof time === 'undefined') ? 1500 : time;
    const element = document.getElementById('status');
    if (curTimer)
        clearTimeout(curTimer);
    element.innerText = message;
    curTimer = setTimeout(function () {
        element.innerText = '';
        curTimer = null;
    }, time);
};

const saveOptions = function() {
    const options = Object.create(null);
    options['omitZeroComments'] = document.getElementById('omitZeroComments-checkbox').checked;
    chrome.storage.local.set({options: options});
};

const loadOptions = function(options) {
    document.getElementById('omitZeroComments-checkbox').checked = options['omitZeroComments'];
    // options must be saved when loaded to keep everything in sync
    // (since there is no specific "save" button")
    // onchange/oninput won't fire when loading options with javascript,
    // so trigger saveOptions manually
    saveOptions();
};

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['options'], function(result) {
        const initOpts = result.options;
        // restore saved options
        loadOptions(initOpts);

        // load default options
        document.getElementById('defaults').addEventListener('click', function() {
            const defaults = chrome.extension.getBackgroundPage().defaultOptions();
            loadOptions(defaults);
            statusMessage('Defaults Loaded', 1200);
        });

        document.getElementById('revert').addEventListener('click', function() {
            loadOptions(initOpts);
            statusMessage('Options Reverted', 1200);
        });
    });

    // decouple label for touch devices, since clicking shows the tooltip.
    if (window.matchMedia('(pointer: coarse)').matches) {
        let toRemove = new Set(['omitZeroComments-checkbox']);
        let labels = document.getElementsByTagName('label');
        for (let i = 0; i < labels.length; ++i) {
            if (toRemove.has(labels[i].htmlFor))
                labels[i].removeAttribute('for');
        }
    }
});

// save options on any user input
(function() {
    const inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        input.addEventListener('change', saveOptions);
        input.addEventListener('input', saveOptions);
    }
})();

// version
document.getElementById('version').innerText = chrome.runtime.getManifest().version;
