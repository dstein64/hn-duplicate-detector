// Returns the ID corresponding to the current Hacker News page
var getStoryId = function() {
    var qs = window.location.search.substring(1);
    var items = qs.split('&');
    for (var i = 0; i < items.length; ++i) {
        var item = items[i];
        var pair = item.split('=');
        if (pair.length != 2) continue;
        if (pair[0] == 'id') return pair[1];        
    }
    return null;
}

// Returns the story URL corresponding to the current Hacker News page
var getStoryUrl = function() {
    storylinks = document.getElementsByClassName('storylink');
    if (storylinks.length === 0) return null;
    storylink = storylinks[0];
    return storylink.href;
}

// TODO: documentation on Promise and returned list
var getStories = function(url) {
    var api_endpoint = 'https://hn.algolia.com/api/v1/search?query=';
    api_endpoint += encodeURIComponent(url);
    api_endpoint += '&restrictSearchableAttributes=url'
    var promise = new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', api_endpoint);
        request.onload = function() {
            if (request.status === 200) {
                var stories = [];
                var response = JSON.parse(request.response);
                for (var i = 0; i < response.hits.length; ++i) {
                    var hit = response.hits[i];
                    if (hit.url !== url) continue;
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
}

var addDuplicateLink = function(story) {
    var subtexts = document.getElementsByClassName('subtext');
    if (subtexts.length === 0) return;
    var subtext = subtexts[0];
    var separator = document.createTextNode(" | "); 
    subtext.appendChild(separator);
    var dup_link = document.createElement("A");
    dup_link.href = 'https://news.ycombinator.com/item?id=' + story.id;
    dup_link.textContent = story.id;
    var monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
    var date = new Date(story.date * 1000);
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    var date_formatted = monthNames[month] + ' ' + day + ', ' + year;
    //date_formatted += ', ' + date.toLocaleTimeString();
    dup_link.title = date_formatted + '\n'
                   + story.points + ' points\n' 
                   + story.num_comments + ' comments\n';
    dup_link.style.color = 'ff6600'; // HN orange
    subtext.appendChild(dup_link);
}


var main = function() {
    var id = getStoryId();
    if (!id) return;
    var url = getStoryUrl();
    if (!url) return;
    if (url === document.location.href) return;
    getStories(url).then(function(stories) {
        stories = stories.filter(function(story) {return story.id != id})
        for (var i = 0; i < stories.length; ++i) {
            var story = stories[i];
            addDuplicateLink(story);
        }
    }, function(Error) {
        console.log(Error);
    });
}

main();
