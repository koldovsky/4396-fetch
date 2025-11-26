import { createServer } from 'node:http';
import { readFile, writeFile, appendFile, access } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { constants } from 'node:fs';
import { createHmac, randomBytes } from 'node:crypto';

const PORT = 3000;
const MESSAGES_FILE = 'messages.txt';
const USERS_FILE = 'users.json';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

// ============ Password Hashing ============
function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = createHmac('sha256', salt).update(password).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const newHash = createHmac('sha256', salt).update(password).digest('hex');
  return hash === newHash;
}

// ============ JWT Implementation ============
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString();
}

function createJWT(payload, expiresInHours = 24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (expiresInHours * 60 * 60)
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

// ============ Users Storage ============
async function ensureUsersFile() {
  try {
    await access(USERS_FILE, constants.F_OK);
  } catch {
    await writeFile(USERS_FILE, '[]');
  }
}

async function getUsers() {
  await ensureUsersFile();
  const content = await readFile(USERS_FILE, 'utf-8');
  return JSON.parse(content);
}

async function saveUsers(users) {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function findUser(username) {
  const users = await getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

async function createUser(username, password) {
  const users = await getUsers();
  const hashedPassword = hashPassword(password);
  const newUser = { username, password: hashedPassword };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

// ============ Auth Middleware ============
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function authenticateRequest(req) {
  const token = extractToken(req);
  if (!token) return null;
  return verifyJWT(token);
}

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

  // API: Register
  if (method === 'POST' && url === '/api/auth/register') {
    try {
      const { username, password } = await parseJsonBody(req);
      if (!username || !password) {
        sendJson(res, { error: 'Username and password are required' }, 400);
        return;
      }
      if (username.length < 3 || username.length > 20) {
        sendJson(res, { error: 'Username must be 3-20 characters' }, 400);
        return;
      }
      if (password.length < 4) {
        sendJson(res, { error: 'Password must be at least 4 characters' }, 400);
        return;
      }
      
      const existingUser = await findUser(username);
      if (existingUser) {
        sendJson(res, { error: 'Username already exists' }, 400);
        return;
      }
      
      await createUser(username, password);
      const token = createJWT({ username });
      sendJson(res, { username, token }, 201);
    } catch (err) {
      sendJson(res, { error: 'Registration failed' }, 500);
    }
    return;
  }

  // API: Login
  if (method === 'POST' && url === '/api/auth/login') {
    try {
      const { username, password } = await parseJsonBody(req);
      if (!username || !password) {
        sendJson(res, { error: 'Username and password are required' }, 400);
        return;
      }
      
      const user = await findUser(username);
      if (!user || !verifyPassword(password, user.password)) {
        sendJson(res, { error: 'Invalid username or password' }, 401);
        return;
      }
      
      const token = createJWT({ username: user.username });
      sendJson(res, { username: user.username, token });
    } catch (err) {
      sendJson(res, { error: 'Login failed' }, 500);
    }
    return;
  }

  // API: GET messages (protected)
  if (method === 'GET' && url === '/api/chat') {
    const user = authenticateRequest(req);
    if (!user) {
      sendJson(res, { error: 'Unauthorized' }, 401);
      return;
    }
    
    try {
      const messages = await getMessages();
      sendJson(res, messages);
    } catch (err) {
      sendJson(res, { error: 'Failed to get messages' }, 500);
    }
    return;
  }

  // API: POST message (protected)
  if (method === 'POST' && url === '/api/chat') {
    const user = authenticateRequest(req);
    if (!user) {
      sendJson(res, { error: 'Unauthorized' }, 401);
      return;
    }
    
    try {
      const { message } = await parseJsonBody(req);
      if (!message) {
        sendJson(res, { error: 'Message is required' }, 400);
        return;
      }
      const newMessage = await addMessage(user.username, message);
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
