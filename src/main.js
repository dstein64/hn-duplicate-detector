const main = function(options) {
    if (!isItemPage(window)) return;
    const id = getStoryId(window);
    if (!id) return;
    const url = getStoryUrl(document);
    if (!url) return;
    if (url === document.location.href) return;
    const _class = '_hn-duplicate-detector_a76f7b9e-469f-4369-82fb-b99ecda7919a';
    for (const e of [...document.getElementsByClassName(_class)]) {
        e.parentElement.removeChild(e);
    }
    getStories(window, url).then(function(stories) {
        // remove current page from stories
        stories = stories.filter(function(story) {return story.id !== id});
        // remove stories with zero comments
        if (options.omitZeroComments) {
            stories = stories.filter(function(story) {return story.num_comments > 0});
        }
        // sort stories by date (newest first)
        stories.sort(function(a, b){return b.date - a.date});
        for (const story of stories) {
            addDuplicateLink(document, story, _class);
        }
    }, function(error) {
        console.log(error);
    });
};

chrome.storage.local.get(['options'], function(result) {
    if (!result.options) return;
    main(result.options);
});
