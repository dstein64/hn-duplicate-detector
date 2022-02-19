// Adds a story link to the subtitle of a Hacker News discussion page.
const addDuplicateLink = function(story) {
    const subtext = getSubtext();
    if (subtext === null) return;
    const separator = document.createTextNode(' | ');

    const dup_container = document.createElement('SPAN');

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
    const date = new Date(story.date * 1000);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const title_date = monthNames[month] + ' ' + day + ', ' + year;
    let title_points = story.points + ' point';
    if (story.points !== 1) title_points += 's';
    let title_comments = story.num_comments + ' comment';
    if (story.num_comments !== 1) title_comments += 's';
    dup_container.title = title_date + '\n'
                        + title_points + '\n'
                        + title_comments;

    const dup_link = document.createElement('A');
    dup_link.href = 'https://news.ycombinator.com/item?id=' + story.id;
    dup_link.textContent = story.id;
    dup_link.style.color = 'ff6600'; // HN orange

    const comment_count_text = document.createTextNode(' (' + story.num_comments + ')');

    dup_container.appendChild(dup_link);
    dup_container.appendChild(comment_count_text);

    subtext.appendChild(separator);
    subtext.appendChild(dup_container);
};

const main = function(options) {
    const id = getStoryId();
    if (!id) return;
    const url = getStoryUrl();
    if (!url) return;
    if (url === document.location.href) return;
    getStories(url).then(function(stories) {
        // remove current page from stories
        stories = stories.filter(function(story) {return story.id !== id});
        // remove stories with zero comments
        if (options.omitZeroComments) {
            stories = stories.filter(function(story) {return story.num_comments > 0});
        }
        // sort stories by date (newest first)
        stories.sort(function(a, b){return b.date-a.date});
        for (const story of stories) {
            addDuplicateLink(story);
        }
    }, function(error) {
        console.log(error);
    });
};

chrome.storage.local.get(['options'], function(result) {
    main(result.options);
});
