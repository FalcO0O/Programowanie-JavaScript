/**
 * @file Guestbook server using Node.js and plain HTML.
 * @author Bartosz Ludwin
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { URLSearchParams } from 'url';

const HOST = 'localhost';
const PORT = 8000;
const DATA_FILE = path.resolve('data/guestbook.txt');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '', 'utf-8');
}

/**
 * Parses raw file content into structured guestbook entries.
 * @param {string} raw - Raw string data from the file.
 * @returns {Array<{name: string, message: string}>} Array of parsed entries.
 */
function parseEntries(raw) {
    return raw
      .trim()
      .split('\n\n')
      .filter(block => block.length)
      .map(block => {
        const [name, ...rest] = block.split('\n');
        return { name, message: rest.join('\n') };
      });
  }
  
  /**
   * Generates an HTML page containing the guestbook entries and form.
   * @param {Array<{name: string, message: string}>} entries - List of guestbook entries.
   * @returns {string} HTML string.
   */
  function renderPage(entries) {
    const entriesHtml = entries.map(e => `
      <div class="entry">
        <h3>${e.name}</h3>
        <p>${e.message.replace(/\n/g, '<br>')}</p>
      </div>
    `).join('\n');
  
    return `<!DOCTYPE html>
  <html lang="pl">
  <head>
    <meta charset="UTF-8">
    <title>Księga gości</title>
    <style>
      body { font-family: sans-serif; margin: 2rem; }
      .entry { margin-bottom: 1.5rem; padding-bottom: .5rem; border-bottom: 1px solid #ccc; }
      form { margin-top: 2rem; }
      label { display: block; margin-top: 1rem; }
      input[type="text"], textarea { width: 100%; padding: .5rem; }
      button { margin-top: 1rem; padding: .5rem 1rem; }
    </style>
  </head>
  <body>
    <h1>Księga gości</h1>
  
    <!-- Poprzednie wpisy -->
    ${entriesHtml || '<p>Brak wpisów.</p>'}
  
    <!-- Formularz -->
    <form method="POST" action="/submit">
      <label>
        Imię i nazwisko:<br>
        <input type="text" name="name" required>
      </label>
      <label>
        Treść wpisu:<br>
        <textarea name="message" rows="5" required></textarea>
      </label>
      <button type="submit">Wyślij</button>
    </form>
  </body>
  </html>`;
  }
  
  /**
   * HTTP server instance handling guestbook operations.
   * @param {http.IncomingMessage} req - The incoming HTTP request.
   * @param {http.ServerResponse} res - The HTTP response to send back.
   */
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      fs.readFile(DATA_FILE, 'utf-8', (err, raw) => {
        if (err) {
          res.writeHead(500);
          return res.end('Błąd serwera');
        }
        const entries = parseEntries(raw);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderPage(entries));
      });
  
    } else if (req.method === 'POST' && req.url === '/submit') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const params = new URLSearchParams(body);
        const name    = (params.get('name')    || '').trim();
        const message = (params.get('message') || '').trim();
        
        if (name && message) {
          const entryBlock = `${name}\n${message}\n\n`;
          fs.appendFile(DATA_FILE, entryBlock, 'utf-8', err => {
            if (err) console.error('Błąd zapisu:', err);
            res.writeHead(302, { Location: '/' });
            res.end();
          });
        } else {
          res.writeHead(400);
          res.end('Brakuje imienia lub treści wpisu.');
        }
      });
  
    } else {
      res.writeHead(404);
      res.end('Nie znaleziono');
    }
  });
  
  // Start server
  server.listen(PORT, HOST, () => {
    console.log(`Serwer działa: http://${HOST}:${PORT}/`);
  });