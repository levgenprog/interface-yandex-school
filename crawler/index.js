import express, { json } from 'express';
const { fetcher } = require('../fetcher.js');

const app = express();
app.use(json());

app.post('/parse', async (req, res) => {
    const { domainName } = req.body;

    try {
        const links = await crawlDomain(domainName);
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while crawling the domain.' });
    }
});

async function crawlDomain(domainName) {
    const visited = new Set();
    const links = [];

    const queue = [domainName];
    visited.add(domainName);

    while (queue.length > 0) {
        const url = queue.shift();
        const response = await get(url);

        if (!response.ok) {
            console.error(`Error crawling ${url}: ${response.status}`);
            continue;
        }

        const html = await response.text();
        const pageLinks = extractLinks(html);
        links.p
        ush(...pageLinks);

        for (const link of pageLinks) {
            if (!visited.has(link)) {
                visited.add(link);
                queue.push(link);
            }
        }
    }

    return links;
}

function extractLinks(html) {
    const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
    const links = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
        const url = match[2];
        if (url.startsWith('/') || url.startsWith('http')) {
            links.push(url);
        }
    }

    return links;
}

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});