// Run tests with:
//  $ node tests.js

const assert = require('assert');
const https = require('https');

const {JSDOM} = require('jsdom');

const library = require(__dirname + '/src/library.js');

const url = 'https://news.ycombinator.com/item?id=14990099';
const storyUrl = 'https://www.youtube.com/watch?v=wf-BqAjZb8M';

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
        let subtext = library.getSubtext(document);
        subtext = subtext.textContent.trim();
        subtext = subtext.replace(/\s\s+/g, ' ');
        assert.match(subtext, /^\d+ points by mmphosis on Aug 11, 2017 \| hide \| past \| favorite$/);
        assert.equal(library.getStoryId(window), '14990099');
        assert.equal(library.getStoryUrl(document), storyUrl);
        assert.equal(
            library.removeProtocol(window, storyUrl),
            storyUrl.substring('https://'.length));
        library.getStories(window, storyUrl).then(function(stories) {
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
            assert(stories[1].num_comments >= 161);
            assert.equal(stories[2].id, "14990099");
            assert.equal(stories[2].date, 1502462541);
            assert.equal(
                stories[2].title,
                "Raymond Hettinger: Best practices for beautiful intelligible code (2015) [video]");
            assert(stories[2].points >= 2);
            assert(stories[2].num_comments >= 0);
            for (const story of stories) {
                library.addDuplicateLink(document, story);
            }
            let subtext = library.getSubtext(document);
            subtext = subtext.textContent.trim();
            subtext = subtext.replace(/\s\s+/g, ' ');
            assert.match(subtext, new RegExp(
                /^\d+ points by mmphosis on Aug 11, 2017 \| hide \| past \| favorite/.source
                + / \| 9366583 \(\d+\) \| 10023818 \(\d+\) \| 14990099 \(\d+\)$/.source));
        }, function(error) {
            assert.fail(error.message);
        });
    });
}).on('error', err => {
    assert.fail(err.message);
});
