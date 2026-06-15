const express = require('express');
const router = express.Router();
const store = require('../data/store');

router.get('/groups', (req, res) => {
    try {
        return res.send({ groups: store.getAllGroups() });
    } catch (err) {
        return res.status(400).send({ error: 'Error getting all groups' });
    }
});

router.get('/group', (req, res) => {
    try {
        if (req.query.name === undefined) {
            return res.status(400).send({ error: 'Error no query declared' });
        }
        const result = store.getGroupByName(req.query.name);
        if (!result) {
            return res.status(404).send({ error: `Group not found: ${req.query.name}` });
        }
        return res.send(result);
    } catch (err) {
        return res.status(400).send({ error: `Error getting group with name: ${req.query.name}` });
    }
});

router.get('/team/:idTeam', (req, res) => {
    try {
        const team = store.getTeamById(req.params.idTeam);
        if (!team) {
            return res.status(404).send({ error: `Team not found: ${req.params.idTeam}` });
        }
        return res.send({ team });
    } catch (err) {
        return res.status(400).send({ error: `Error getting team with id:${req.params.idTeam}` });
    }
});

router.get('/team', (req, res) => {
    try {
        if (req.query.name === undefined) {
            return res.status(400).send({ error: 'Error no query declared' });
        }
        const team = store.getTeamByName(req.query.name);
        if (!team) {
            return res.status(404).send({ error: `Team not found: ${req.query.name}` });
        }
        return res.send({ team });
    } catch (err) {
        return res.status(400).send({ error: `Error getting team with name: ${req.query.name}` });
    }
});

router.get('/teams', (req, res) => {
    try {
        const teams = store.getAllTeams(req.query.group ? { group: req.query.group } : null);
        return res.status(200).json({ teams });
    } catch (err) {
        return res.status(400).json({ error: 'Error getting all teams', details: err.message });
    }
});

router.get('/games', (req, res) => {
    try {
        return res.send({ games: store.getAllGames() });
    } catch (err) {
        return res.status(400).send({ error: 'Error getting all games' });
    }
});

router.get('/game/:idGame', (req, res) => {
    try {
        const game = store.getGameById(req.params.idGame);
        if (!game) {
            return res.status(404).send({ error: `Game not found: ${req.params.idGame}` });
        }
        return res.send({ game });
    } catch (err) {
        return res.status(400).send({ error: `Error getting game with id:${req.params.idGame}` });
    }
});

router.get('/stadiums', (req, res) => {
    try {
        return res.status(200).json({ stadiums: store.getAllStadiums() });
    } catch (err) {
        return res.status(400).json({ error: 'Error getting all stadiums', details: err.message });
    }
});

router.get('/stadium/:id', (req, res) => {
    try {
        const stadium = store.getStadiumById(req.params.id);
        if (!stadium) {
            return res.status(404).json({ error: `Stadium not found with id: ${req.params.id}` });
        }
        return res.status(200).json({ stadium });
    } catch (err) {
        return res.status(400).json({ error: `Error getting stadium with id: ${req.params.id}`, details: err.message });
    }
});

router.get('/live', (req, res) => {
    try {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.json({
            updatedAt: store.getLastUpdated() || Date.now(),
            games: store.getAllGames(),
            groups: store.getAllGroups()
        });
    } catch (err) {
        return res.status(400).json({ error: 'Error getting live data', details: err.message });
    }
});

module.exports = app => app.use('/get', router);
