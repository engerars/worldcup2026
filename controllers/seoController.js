const store = require('../data/store');

module.exports = (app) => {
    app.get('/sitemap.xml', async (req, res) => {
        try {
            const teams = store.getAllTeams();
            const games = store.getAllGames();
            const stadiums = store.getAllStadiums();

            const now = new Date().toISOString().split('T')[0];
            const escapeXml = (value) => String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');

            let urls = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <url>
    <loc>https://worldcup26.ir/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://worldcup26.ir/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://worldcup26.ir/"/>
  </url>

  <url>
    <loc>https://worldcup26.ir/?lang=en</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://worldcup26.ir/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://worldcup26.ir/"/>
  </url>

  <url>
    <loc>https://worldcup26.ir/#matches</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://worldcup26.ir/#groups</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://worldcup26.ir/#teams</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://worldcup26.ir/#stadiums</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

            teams.forEach((team) => {
                urls += `
  <url>
    <loc>https://worldcup26.ir/get/team/${escapeXml(team.id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
            });

            games.forEach((game) => {
                urls += `
  <url>
    <loc>https://worldcup26.ir/get/game/${escapeXml(game.id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>`;
            });

            stadiums.forEach((stadium) => {
                urls += `
  <url>
    <loc>https://worldcup26.ir/get/stadium/${escapeXml(stadium.id)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`;
            });

            urls += '\n</urlset>';

            res.header('Content-Type', 'application/xml');
            res.header('Cache-Control', 'public, max-age=3600'); // 1 hour cache
            return res.send(urls);
        } catch (err) {
            const path = require('path');
            return res.sendFile(path.join(__dirname, '../public/sitemap.xml'));
        }
    });

};
