// One-off: download a representative photo for each stadium from Wikipedia.
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'stadiums');
fs.mkdirSync(OUT, { recursive: true });

// stadium id -> Wikipedia article title
const TITLES = {
    1: 'Estadio Azteca',
    2: 'Estadio Akron',
    3: 'Estadio BBVA',
    4: 'AT&T Stadium',
    5: 'NRG Stadium',
    6: 'Arrowhead Stadium',
    7: 'Mercedes-Benz Stadium',
    8: 'Hard Rock Stadium',
    9: 'Gillette Stadium',
    10: 'Lincoln Financial Field',
    11: 'MetLife Stadium',
    12: 'BMO Field',
    13: 'BC Place',
    14: 'Lumen Field',
    15: "Levi's Stadium",
    16: 'SoFi Stadium'
};

const UA = { 'User-Agent': 'wc2026-app/1.0 (stadium images; contact admin)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchRetry(url, tries = 4) {
    for (let i = 0; i < tries; i++) {
        const res = await fetch(url, { headers: UA });
        if (res.status === 429) { await sleep(2500 * (i + 1)); continue; }
        return res;
    }
    return fetch(url, { headers: UA });
}

async function thumbUrl(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=900&titles=${encodeURIComponent(title)}`;
    const res = await fetchRetry(url);
    if (!res.ok) throw new Error(`api ${res.status}`);
    const j = await res.json();
    const pages = j.query && j.query.pages;
    const page = pages && Object.values(pages)[0];
    return page && page.thumbnail && page.thumbnail.source || null;
}

async function download(src, dest) {
    const res = await fetchRetry(src);
    if (!res.ok) throw new Error(`img ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return buf.length;
}

(async () => {
    for (const [id, title] of Object.entries(TITLES)) {
        try {
            const src = await thumbUrl(title);
            if (!src) { console.log(`${id} ${title}: NO IMAGE`); await sleep(1200); continue; }
            const size = await download(src, path.join(OUT, `${id}.jpg`));
            console.log(`${id} ${title}: ${(size / 1024).toFixed(0)} KB`);
        } catch (e) {
            console.log(`${id} ${title}: ERROR ${e.message}`);
        }
        await sleep(1400);
    }
    console.log('DONE');
})();
