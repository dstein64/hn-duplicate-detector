const main = function(options) {
    const id = getStoryId(window);
    if (!id) return;
    const url = getStoryUrl(document);
    if (!url) return;
    if (url === document.location.href) return;
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
            addDuplicateLink(document, story);
        }
    }, function(error) {
        console.log(error);
    });
};

chrome.storage.local.get(['options'], function(result) {
    main(result.options);
});