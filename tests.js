// Run tests with:
//  $ node tests.js

const assert = require('assert');
const https = require('https');

const {JSDOM} = require('jsdom');

const library = require(__dirname + '/src/library.js');

let https_agent = undefined;
const https_proxy = process.env.https_proxy;
if (https_proxy !== undefined) {
    const {HttpsProxyAgent} = require('https-proxy-agent');
    https_agent = new HttpsProxyAgent(https_proxy);
}
const options = {
    agent: https_agent,
};

const url = 'https://news.ycombinator.com/item?id=36646163';
const storyUrl = 'https://tixy.land/';

// Given a subtext element, return the normalized text.
const normalize = (subtext) => {
    let result = subtext.textContent.trim();
    result = result.replace(/\s\s+/g, ' ');
    return result;
};

https.get(url, options, resp => {
    let data = '';
    resp.on('data', chunk => {
        data += chunk;
    });
    resp.on('end', () => {
        assert.equal(resp.statusCode, 200, data);
        const dom = new JSDOM(data, {
            url: url
        });
        const window = dom.window;
        const document = window.document;
        assert(library.isItemPage(window));
        assert(!library.isItemPage(
            new JSDOM('', {url: 'https://news.ycombinator.com/'}).window));
        assert(!library.isItemPage(
            new JSDOM('', {url: 'https://news.ycombinator.com/front'}).window));
        const subtext = normalize(library.getSubtext(document));
        assert.match(subtext, /^\d+ points by murkle on July 8, 2023 \| hide \| past \| favorite \| \d+\scomments$/);
        assert.equal(library.getStoryId(window), '36646163');
        assert.equal(library.getStoryUrl(document), storyUrl);
        assert.equal(
            library.removeProtocol(storyUrl),
            storyUrl.substring('https://'.length));
        // Create a new window for requests to hn.algolia.com. As of October 2023,
        // using the news.ycombinator.com window results in a CORS error. There was
        // a new version of HN search released around that time:
        //   https://news.ycombinator.com/item?id=37821821
        // Perhaps the Access-Control-Allow-Origin header, or something else related,
        // was changed.
        const algolia_window = new JSDOM('', {url: 'https://hn.algolia.com/'}).window;
        library.getStories(algolia_window, storyUrl).then(function(stories) {
            // sort stories by date (oldest first)
            stories.sort(function(a, b){return a.date - b.date});
            assert(stories.length >= 4);

            assert.equal(stories[0].id, '24974534');
            assert.equal(stories[0].date, 1604358367);
            assert.equal(stories[0].title, 'Minimal 16x16 Dots Coding Environment');
            assert(stories[0].points >= 186);
            assert(stories[0].num_comments >= 37);

            assert.equal(stories[1].id, '36646163');
            assert.equal(stories[1].date, 1688834899);
            assert.equal(stories[1].title, 'Tixy.land');
            assert(stories[1].points >= 3);
            assert(stories[1].num_comments >= 2);

            assert.equal(stories[2].id, '39261430');
            assert.equal(stories[2].date, 1707142621);
            assert.equal(stories[2].title, 'Tixy – Creative Code Golfing');
            assert(stories[2].points >= 1);
            assert(stories[2].num_comments >= 0);

            assert.equal(stories[3].id, '43942881');
            assert.equal(stories[3].date, 1746845798);
            assert.equal(stories[3].title, 'A simple 16x16 dot animation from simple math rules');
            assert(stories[3].points >= 478);
            assert(stories[3].num_comments >= 91);

            const _class = '_hn-duplicate-detector_';
            for (const story of stories) {
                library.addDuplicateLink(document, story, _class);
            }
            let subtext = normalize(library.getSubtext(document));
            assert.match(subtext, new RegExp(
                /^\d+ points by murkle on July 8, 2023 \| hide \| past \| favorite \| \d+\scomments/.source
                + / \| 24974534 \(\d+\)/.source
                + / \| 36646163 \(\d+\)/.source
                + / \| 39261430 \(\d+\)/.source
                + / \| 43942881 \(\d+\)$/.source));
            for (const e of [...document.getElementsByClassName(_class)]) {
                e.parentElement.removeChild(e);
            }
            subtext = normalize(library.getSubtext(document));
            assert.match(
                subtext,
                /^\d+ points by murkle on July 8, 2023 \| hide \| past \| favorite \| \d+\scomments$/);
        }, function(error) {
            assert.fail(error.message);
        });
    });
}).on('error', err => {
    assert.fail(err.message);
});
