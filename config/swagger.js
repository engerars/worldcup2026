const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FIFA World Cup 2026 API',
      version: '1.0.5',
      description: 'File-backed read API for FIFA World Cup 2026 — teams, matches, group standings, stadiums, and squads. No authentication required.',
      license: { name: 'ISC', url: 'https://opensource.org/licenses/ISC' }
    },
    servers: [
      { url: 'http://localhost:3050', description: 'Local development' },
      { url: 'https://worldcup26.ir', description: 'Production' }
    ],
    tags: [
      { name: 'Teams', description: '48 participating teams' },
      { name: 'Matches', description: 'Schedule and live scores' },
      { name: 'Groups', description: 'Group stage standings' },
      { name: 'Squads', description: 'Official 26-player squads' },
      { name: 'Stadiums', description: 'Host venues' },
      { name: 'System', description: 'Health and live snapshot' }
    ],
    components: {
      schemas: {
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            name_en: { type: 'string', example: 'Mexico' },
            name_fa: { type: 'string' },
            fifa_code: { type: 'string', example: 'MEX' },
            iso2: { type: 'string', example: 'MX' },
            groups: { type: 'string', example: 'A' },
            flag: { type: 'string', format: 'uri' }
          }
        },
        Game: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            home_team_id: { type: 'string' },
            away_team_id: { type: 'string' },
            home_score: { type: 'string' },
            away_score: { type: 'string' },
            home_scorers: { type: 'string', nullable: true },
            away_scorers: { type: 'string', nullable: true },
            group: { type: 'string', example: 'A' },
            matchday: { type: 'string' },
            local_date: { type: 'string' },
            stadium_id: { type: 'string' },
            finished: { type: 'string', example: 'TRUE' },
            time_elapsed: { type: 'string', example: 'finished' },
            type: { type: 'string', example: 'group' },
            home_team_name_en: { type: 'string' },
            away_team_name_en: { type: 'string' }
          }
        },
        GroupStandingRow: {
          type: 'object',
          properties: {
            team_id: { type: 'string' },
            mp: { type: 'string' },
            w: { type: 'string' },
            d: { type: 'string' },
            l: { type: 'string' },
            gf: { type: 'string' },
            ga: { type: 'string' },
            gd: { type: 'string' },
            pts: { type: 'string' }
          }
        },
        GroupStandings: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'A' },
            teams: { type: 'array', items: { $ref: '#/components/schemas/GroupStandingRow' } }
          }
        },
        SquadPlayer: {
          type: 'object',
          properties: {
            number: { type: 'integer' },
            name: { type: 'string' },
            position: { type: 'string', enum: ['GK', 'DEF', 'MID', 'FWD'] },
            club: { type: 'string' }
          }
        },
        Squad: {
          type: 'object',
          properties: {
            team_id: { type: 'string' },
            staff: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            },
            players: { type: 'array', items: { $ref: '#/components/schemas/SquadPlayer' } }
          }
        },
        Stadium: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name_en: { type: 'string' },
            city_en: { type: 'string' },
            country_en: { type: 'string' },
            capacity: { type: 'integer' },
            region: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    },
    paths: {
      '/get/teams': {
        get: {
          tags: ['Teams'],
          summary: 'List all teams',
          parameters: [
            { name: 'group', in: 'query', schema: { type: 'string', example: 'A' }, required: false }
          ],
          responses: {
            200: {
              description: 'Team list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { teams: { type: 'array', items: { $ref: '#/components/schemas/Team' } } }
                  }
                }
              }
            }
          }
        }
      },
      '/get/team/{idTeam}': {
        get: {
          tags: ['Teams'],
          summary: 'Get team with squad',
          parameters: [{ name: 'idTeam', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Team and squad' }, 404: { description: 'Not found' } }
        }
      },
      '/get/games': {
        get: {
          tags: ['Matches'],
          summary: 'List all matches',
          responses: {
            200: {
              description: 'Match list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { games: { type: 'array', items: { $ref: '#/components/schemas/Game' } } }
                  }
                }
              }
            }
          }
        }
      },
      '/get/groups': {
        get: {
          tags: ['Groups'],
          summary: 'Group standings (sorted A–L)',
          responses: {
            200: {
              description: 'Standings',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { groups: { type: 'array', items: { $ref: '#/components/schemas/GroupStandings' } } }
                  }
                }
              }
            }
          }
        }
      },
      '/get/squads': {
        get: {
          tags: ['Squads'],
          summary: 'All team squads',
          responses: { 200: { description: 'Squads keyed by team id' } }
        }
      },
      '/get/stadiums': {
        get: {
          tags: ['Stadiums'],
          summary: 'List stadiums',
          responses: { 200: { description: 'Stadium list' } }
        }
      },
      '/get/live': {
        get: {
          tags: ['System'],
          summary: 'Live games and groups snapshot',
          responses: { 200: { description: 'Current scores and standings' } }
        }
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: { 200: { description: 'Service status' } }
        }
      }
    }
  },
  apis: []
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
