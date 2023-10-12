// Run tests with:
//  $ node tests.js

const assert = require('assert');
const https = require('https');

const {JSDOM} = require('jsdom');

const library = require(__dirname + '/src/library.js');

const url = 'https://news.ycombinator.com/item?id=14990099';
const storyUrl = 'https://www.youtube.com/watch?v=wf-BqAjZb8M';

// Given a subtext element, return the normalized text.
const normalize = (subtext) => {
    let result = subtext.textContent.trim();
    result = result.replace(/\s\s+/g, ' ');
    return result;
};

https.get(url, resp => {
    let data = '';
    resp.on('data', chunk => {
        data += chunk;
    });
    resp.on('end', () => {
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
        assert.match(subtext, /^\d+ points by mmphosis on Aug 11, 2017 \| hide \| past \| favorite$/);
        assert.equal(library.getStoryId(window), '14990099');
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
            assert(stories.length >= 3);
            assert.equal(stories[0].id, "9366583");
            assert.equal(stories[0].date, 1428915160);
            assert.equal(stories[0].title, "Raymond Hettinger – Beyond PEP 8 – PyCon 2015");
            assert(stories[0].points >= 3);
            assert(stories[0].num_comments >= 2);
            assert.equal(stories[1].id, "10023818");
            assert.equal(stories[1].date, 1438969545);
            assert.equal(
                stories[1].title,
                "Beyond PEP 8 – Best practices for beautiful intelligible code [video]");
            assert(stories[1].points >= 262);
            assert(stories[1].num_comments >= 160);
            assert.equal(stories[2].id, "14990099");
            assert.equal(stories[2].date, 1502462541);
            assert.equal(
                stories[2].title,
                "Raymond Hettinger: Best practices for beautiful intelligible code (2015) [video]");
            assert(stories[2].points >= 2);
            assert(stories[2].num_comments >= 0);
            const _class = '_hn-duplicate-detector_';
            for (const story of stories) {
                library.addDuplicateLink(document, story, _class);
            }
            let subtext = normalize(library.getSubtext(document));
            assert.match(subtext, new RegExp(
                /^\d+ points by mmphosis on Aug 11, 2017 \| hide \| past \| favorite/.source
                + / \| 9366583 \(\d+\)/.source
                + / \| 10023818 \(\d+\)/.source
                + / \| 14990099 \(\d+\)/.source
                + / \| 32069668 \(\d+\)$/.source));
            for (const e of [...document.getElementsByClassName(_class)]) {
                e.parentElement.removeChild(e);
            }
            subtext = normalize(library.getSubtext(document));
            assert.match(
                subtext,
                /^\d+ points by mmphosis on Aug 11, 2017 \| hide \| past \| favorite$/);
        }, function(error) {
            assert.fail(error.message);
        });
    });
}).on('error', err => {
    assert.fail(err.message);
});
