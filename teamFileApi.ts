/**
 * Vite plugin: serves team JSON files from data/teams/ as a REST API.
 * - GET  /api/teams        → list team files
 * - GET  /api/teams/:name   → load a team
 * - POST /api/teams         → create/update a team (name in body)
 * - DELETE /api/teams/:name → delete a team file
 */
import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data/teams');

export function teamFileApi(): Plugin {
  return {
    name: 'team-file-api',
    configureServer(server) {
      // Ensure data dir exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // List teams
      server.middlewares.use('/api/teams', (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const name = url.pathname.replace('/api/teams', '').replace(/^\//, '').replace(/\.json$/, '');

        if (!name) {
          // GET /api/teams — list all .json files
          if (req.method === 'GET') {
            const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
            const names = files.map(f => f.replace('.json', ''));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(names));
            return;
          }

          // POST /api/teams — create/update team
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const { name: teamName, employees, shifts } = JSON.parse(body);
                if (!teamName) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'name required' }));
                  return;
                }
                const filePath = path.join(DATA_DIR, `${teamName}.json`);
                fs.writeFileSync(filePath, JSON.stringify({ employees, shifts }, null, 2));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }

          next();
          return;
        }

        const filePath = path.join(DATA_DIR, `${name}.json`);

        // GET /api/teams/:name — load team
        if (req.method === 'GET') {
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ name, employees: data.employees || [], shifts: data.shifts || [] }));
          } else {
            // Try built-in template
            const tmplPath = path.resolve(`src/data/teams/${name}.json`);
            if (fs.existsSync(tmplPath)) {
              const content = fs.readFileSync(tmplPath, 'utf-8');
              const data = JSON.parse(content);
              res.setHeader('Content-Type', 'application/json');
              // Built-in templates use "teamName", normalize
              res.end(JSON.stringify({ name, employees: data.employees || [], shifts: [] }));
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ name, employees: [], shifts: [] }));
            }
          }
          return;
        }

        // DELETE /api/teams/:name — delete team
        if (req.method === 'DELETE') {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        next();
      });
    },
  };
}
