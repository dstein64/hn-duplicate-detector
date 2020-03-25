// Returns the ID corresponding to the current Hacker News page.
var getStoryId = function() {
    var qs = window.location.search.substring(1);
    var items = qs.split('&');
    for (var i = 0; i < items.length; ++i) {
        var item = items[i];
        var pair = item.split('=');
        if (pair.length !== 2) continue;
        if (pair[0] === 'id') return pair[1];
    }
    return null;
};

// Returns the story URL corresponding to the current Hacker News page.
var getStoryUrl = function() {
    storylinks = document.getElementsByClassName('storylink');
    if (storylinks.length === 0) return null;
    storylink = storylinks[0];
    return storylink.href;
};

// Removes protocol portion of a URL
var removeProtocol = function(url) {
    var parsed = new URL(url, 'https://news.ycombinator.com/item');
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
var getStories = function(url) {
    var api_endpoint = 'https://hn.algolia.com/api/v1/search?query=';
    api_endpoint += encodeURIComponent(removeProtocol(url));
    api_endpoint += '&restrictSearchableAttributes=url';
    var promise = new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', api_endpoint);
        request.onload = function() {
            if (request.status === 200) {
                var stories = [];
                var response = JSON.parse(request.response);
                for (var i = 0; i < response.hits.length; ++i) {
                    var hit = response.hits[i];
                    if (removeProtocol(hit.url) !== removeProtocol(url))
                        continue;
                    var story = {
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
var addDuplicateLink = function(story) {
    var subtexts = document.getElementsByClassName('subtext');
    if (subtexts.length === 0) return;
    var subtext = subtexts[0];
    var separator = document.createTextNode(' | ');

    var dup_container = document.createElement('SPAN');

    var monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
    var date = new Date(story.date * 1000);
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    var title_date = monthNames[month] + ' ' + day + ', ' + year;
    var title_points = story.points + ' point';
    if (story.points !== 1) title_points += 's';
    var title_comments = story.num_comments + ' comment';
    if (story.num_comments !== 1) title_comments += 's';
    dup_container.title = title_date + '\n'
                        + title_points + '\n'
                        + title_comments;

    var dup_link = document.createElement('A');
    dup_link.href = 'https://news.ycombinator.com/item?id=' + story.id;
    dup_link.textContent = story.id;
    dup_link.style.color = 'ff6600'; // HN orange

    var comment_count_text = document.createTextNode(' (' + story.num_comments + ')');

    dup_container.appendChild(dup_link);
    dup_container.appendChild(comment_count_text);

    subtext.appendChild(separator);
    subtext.appendChild(dup_container);
};

var main = function() {
    var id = getStoryId();
    if (!id) return;
    var url = getStoryUrl();
    if (!url) return;
    if (url === document.location.href) return;
    getStories(url).then(function(stories) {
        // remove current page from stories
        stories = stories.filter(
            function(story) {return story.id !== id});
        // sort stories by date (newest first)
        stories.sort(function(a, b){return b.date-a.date});
        for (var i = 0; i < stories.length; ++i) {
            var story = stories[i];
            addDuplicateLink(story);
        }
    }, function(Error) {
        console.log(Error);
    });
};

main();
