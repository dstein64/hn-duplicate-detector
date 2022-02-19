// Returns the ID corresponding to the current Hacker News page.
const getStoryId = function() {
    const qs = window.location.search.substring(1);
    const items = qs.split('&');
    for (const item of items) {
        const pair = item.split('=');
        if (pair.length !== 2) continue;
        if (pair[0] === 'id') return pair[1];
    }
    return null;
};

// Returns the story URL corresponding to the current Hacker News page.
const getStoryUrl = function() {
    const titlelinks = document.getElementsByClassName('titlelink');
    if (titlelinks.length === 0) return null;
    const titlelink = titlelinks[0];
    return titlelink.href;
};

// Removes protocol portion of a URL
const removeProtocol = function(url) {
    const parsed = new URL(url, 'https://news.ycombinator.com/item');
    // The protocol field includes colon but no slashes,
    // so add 2 to also exclude slashes.
    return parsed.href.substring(parsed.protocol.length + 2);
};

// Returns a promise that returns a list of stories if resolved and an
// error if rejected.
// A story includes id, date (integer timestamp), title, points, and
// num_comments.
// Searching and comparing URLs omits the protocol (e.g., "http").
// A motivation for this is that sites that now use the "https"
// protocol, may have been submitted earlier using the "http" protocol.
// (e.g., https://news.ycombinator.com/item?id=13918888 (submitted in 2017)
//          points to http://jlongster.com/How-I-Became-Better-Programmer
//        https://news.ycombinator.com/item?id=22678350 (submitted in 2020)
//          points to https://jlongster.com/How-I-Became-Better-Programmer
const getStories = function(url) {
    let api_endpoint = 'https://hn.algolia.com/api/v1/search?query=';
    api_endpoint += encodeURIComponent(removeProtocol(url));
    api_endpoint += '&restrictSearchableAttributes=url';
    const promise = new Promise(function(resolve, reject) {
        const request = new XMLHttpRequest();
        request.open('GET', api_endpoint);
        request.onload = function() {
            if (request.status === 200) {
                const stories = [];
                const response = JSON.parse(request.response);
                for (const hit of response.hits) {
                    if (removeProtocol(hit.url) !== removeProtocol(url))
                        continue;
                    const story = {
                        'id': hit.objectID,
                        'date': hit.created_at_i,
                        'title': hit.title,
                        'points': hit.points,
                        'num_comments': hit.num_comments
                    };
                    stories.push(story);
                }
                resolve(stories);
            } else {
                reject(Error('API error; error code:' + request.statusText));
            }
        };
        request.onerror = function() {
            reject(Error('Network error.'));
        };
        request.send();
    });
    return promise;
};

// Adds a story link to the subtitle of a Hacker News discussion page.
const addDuplicateLink = function(story) {
    const subtexts = document.getElementsByClassName('subtext');
    if (subtexts.length === 0) return;
    const subtext = subtexts[0];
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
    }, function(Error) {
        console.log(Error);
    });
};

chrome.storage.local.get(['options'], function(result) {
    main(result.options);
});
