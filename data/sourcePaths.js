const path = require('path');

const SOURCE_DIR = path.join(__dirname, 'source');

const SOURCE_FILES = {
    teams: path.join(SOURCE_DIR, 'teams.json'),
    matches: path.join(SOURCE_DIR, 'matches.json'),
    matchtables: path.join(SOURCE_DIR, 'matchtables.json'),
    stadiums: path.join(SOURCE_DIR, 'stadiums.json'),
    squads: path.join(SOURCE_DIR, 'squads.json')
};

module.exports = { SOURCE_DIR, SOURCE_FILES };
