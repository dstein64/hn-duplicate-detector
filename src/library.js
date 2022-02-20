this.isItemPage = (window) => {
    return window.location.hostname === 'news.ycombinator.com'
        && window.location.pathname === '/item';
};

// Returns the td.subtext under the main link.
this.getSubtext = (document) => {
    return document.querySelector('td.subtext');
};

// Returns the ID corresponding to the current Hacker News page.
this.getStoryId = (window) => {
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
this.getStoryUrl = (document) => {
    const titlelinks = document.getElementsByClassName('titlelink');
    if (titlelinks.length === 0) return null;
    const titlelink = titlelinks[0];
    return titlelink.href;
};

// Removes protocol portion of a URL
this.removeProtocol = (url) => {
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
this.getStories = (window, url) => {
    const removeProtocol = this.removeProtocol;
    let apiEndpoint = 'https://hn.algolia.com/api/v1/search?query=';
    apiEndpoint += encodeURIComponent(removeProtocol(url));
    apiEndpoint += '&restrictSearchableAttributes=url';
    const promise = new Promise((resolve, reject) => {
        const request = new window.XMLHttpRequest();
        request.onload = () => {
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
        request.onerror = () => {
            reject(Error('Network error.'));
        };
        request.open('GET', apiEndpoint);
        request.send();
    });
    return promise;
};

// Adds a story link to the subtitle of a Hacker News discussion page.
this.addDuplicateLink = (document, story, _class = null) => {
    const subtext = this.getSubtext(document);
    if (subtext === null) return;
    const separator = document.createTextNode(' | ');

    const dupContainer = document.createElement('SPAN');
    if (_class !== null)
        dupContainer.className = _class;

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
    dupContainer.title = title_date + '\n'
        + title_points + '\n'
        + title_comments;

    const dupLink = document.createElement('A');
    dupLink.href = 'https://news.ycombinator.com/item?id=' + story.id;
    dupLink.textContent = story.id;
    dupLink.style.color = 'ff6600';  // HN orange

    const commentCountText = document.createTextNode(' (' + story.num_comments + ')');

    dupContainer.appendChild(separator);
    dupContainer.appendChild(dupLink);
    dupContainer.appendChild(commentCountText);

    subtext.appendChild(dupContainer);
};
