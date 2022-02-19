// Returns the td.subtext under the main link.
this.getSubtext = function() {
    return document.querySelector('td.subtext');
};

// Returns the ID corresponding to the current Hacker News page.
this.getStoryId = function() {
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
this.getStoryUrl = function() {
    const titlelinks = document.getElementsByClassName('titlelink');
    if (titlelinks.length === 0) return null;
    const titlelink = titlelinks[0];
    return titlelink.href;
};

// Removes protocol portion of a URL
this.removeProtocol = function(url) {
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
this.getStories = function(url) {
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