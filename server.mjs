import { createServer } from 'node:http';
import { readFile, writeFile, appendFile, access } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { constants } from 'node:fs';

const PORT = 3000;
const MESSAGES_FILE = 'messages.txt';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

// Ensure messages.txt exists
async function ensureMessagesFile() {
  try {
    await access(MESSAGES_FILE, constants.F_OK);
  } catch {
    await writeFile(MESSAGES_FILE, '');
  }
}

// Parse messages from text file (format: timestamp|username|message per line)
async function getMessages() {
  await ensureMessagesFile();
  const content = await readFile(MESSAGES_FILE, 'utf-8');
  if (!content.trim()) return [];
  
  return content.trim().split('\n').map(line => {
    const [timestamp, username, message] = line.split('|');
    return { timestamp, username, message };
  });
}

// Add a message to the text file
async function addMessage(username, message) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp}|${username}|${message}\n`;
  await appendFile(MESSAGES_FILE, line);
  return { timestamp, username, message };
}

// Parse JSON body from request
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Serve static files
async function serveStatic(res, filePath) {
  try {
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

const server = createServer(async (req, res) => {
  const { method, url } = req;

  // API: GET messages
  if (method === 'GET' && url === '/api/chat') {
    try {
      const messages = await getMessages();
      sendJson(res, messages);
    } catch (err) {
      sendJson(res, { error: 'Failed to get messages' }, 500);
    }
    return;
  }

  // API: POST message
  if (method === 'POST' && url === '/api/chat') {
    try {
      const { username, message } = await parseJsonBody(req);
      if (!username || !message) {
        sendJson(res, { error: 'Username and message are required' }, 400);
        return;
      }
      const newMessage = await addMessage(username, message);
      sendJson(res, newMessage, 201);
    } catch (err) {
      sendJson(res, { error: 'Failed to post message' }, 500);
    }
    return;
  }

  // Static files
  let filePath = url === '/' ? 'index.html' : url.slice(1);
  filePath = join(process.cwd(), filePath);
  await serveStatic(res, filePath);
});

await ensureMessagesFile();

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
