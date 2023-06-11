const express = require("express");

const { fetcher } = require('../fetcher.js');


const app = express();
app.use(express.json());

app.post('/parse', async (req, res) => {
    const { domainName } = req.body;
    console.log(domainName);
    try {
        const links = await crawler(domainName);
        console.log(links);
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

async function crawler(domainName) {
    const links = [];
    const visited = new Set();
    const queue = [domainName];

    while (queue.length > 0) {
        const currentUrl = queue.shift();
        if (visited.has(currentUrl)) {
            continue;
        }

        visited.add(currentUrl);
        const response = await fetcher(currentUrl);
        console.log(response);
        const html = await response.text();
        console.log(html);

        const newLinks = extractLinks(html);
        links.push(...newLinks);

        for (const link of newLinks) {
            if (!visited.has(link)) {
                queue.push(link);
            }
        }
    }

    return links;
}

function extractLinks(html) {
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(html))) {
        const url = match[2];
        links.push(url);
    }

    return links;
}

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});


/*
    TODO: краулер страницы
    POST http://localhost:3000/parse
    body: { domainName: string}
    return string[]  https://ru.wikipedia.org/wiki/Wildberries
*/
