// DOM Elements
const chatAuth = document.getElementById('chat-auth');
const chatMain = document.getElementById('chat-main');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatMessage = document.getElementById('chat-message');
const chatCurrentUser = document.getElementById('chat-current-user');
const chatLogout = document.getElementById('chat-logout');

// Auth forms
const loginForm = document.getElementById('chat-login-form');
const registerForm = document.getElementById('chat-register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const authTabs = document.querySelectorAll('.chat__auth-tab');

// Auth state
let authToken = localStorage.getItem('chatToken');
let currentUsername = localStorage.getItem('chatUsername');

// Tab switching
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    authTabs.forEach(t => t.classList.remove('chat__auth-tab--active'));
    tab.classList.add('chat__auth-tab--active');
    
    if (tabName === 'login') {
      loginForm.classList.remove('chat__auth-form--hidden');
      registerForm.classList.add('chat__auth-form--hidden');
    } else {
      registerForm.classList.remove('chat__auth-form--hidden');
      loginForm.classList.add('chat__auth-form--hidden');
    }
  });
});

// Show/hide auth or chat based on login state
function updateAuthUI() {
  if (authToken && currentUsername) {
    chatAuth.classList.add('chat__main--hidden');
    chatMain.classList.remove('chat__main--hidden');
    chatCurrentUser.textContent = currentUsername;
    loadMessages();
  } else {
    chatAuth.classList.remove('chat__main--hidden');
    chatMain.classList.add('chat__main--hidden');
  }
}

// Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.textContent = '';
  
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      authToken = data.token;
      currentUsername = data.username;
      localStorage.setItem('chatToken', authToken);
      localStorage.setItem('chatUsername', currentUsername);
      updateAuthUI();
    } else {
      registerError.textContent = data.error || 'Registration failed';
    }
  } catch (err) {
    registerError.textContent = 'Network error';
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      authToken = data.token;
      currentUsername = data.username;
      localStorage.setItem('chatToken', authToken);
      localStorage.setItem('chatUsername', currentUsername);
      updateAuthUI();
    } else {
      loginError.textContent = data.error || 'Login failed';
    }
  } catch (err) {
    loginError.textContent = 'Network error';
  }
});

// Logout
chatLogout.addEventListener('click', () => {
  authToken = null;
  currentUsername = null;
  localStorage.removeItem('chatToken');
  localStorage.removeItem('chatUsername');
  updateAuthUI();
});

// Format timestamp
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render message
function renderMessage({ timestamp, username, message }) {
  const div = document.createElement('div');
  div.className = 'chat__message';
  div.innerHTML = `
    <span class="chat__message-username">${escapeHtml(username)}</span>
    <span class="chat__message-time">${formatTime(timestamp)}</span>
    <span class="chat__message-text">${escapeHtml(message)}</span>
  `;
  return div;
}

// Load messages
async function loadMessages() {
  if (!authToken) return;
  
  try {
    const res = await fetch('/api/chat', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (res.status === 401) {
      // Token expired or invalid
      chatLogout.click();
      return;
    }
    
    const messages = await res.json();
    chatMessages.innerHTML = '';
    
    if (messages.length === 0) {
      chatMessages.innerHTML = '<p class="chat__empty">No messages yet. Start the conversation!</p>';
    } else {
      messages.forEach(msg => chatMessages.appendChild(renderMessage(msg)));
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

// Send message
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const message = chatMessage.value.trim();
  if (!message || !authToken) return;
  
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ message })
    });
    
    if (res.status === 401) {
      chatLogout.click();
      return;
    }
    
    if (res.ok) {
      const newMsg = await res.json();
      const emptyMsg = chatMessages.querySelector('.chat__empty');
      if (emptyMsg) emptyMsg.remove();
      
      chatMessages.appendChild(renderMessage(newMsg));
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatMessage.value = '';
      chatMessage.focus();
    }
  } catch (err) {
    console.error('Failed to send message:', err);
  }
});

// Initialize
updateAuthUI();

// Poll for new messages every 5 seconds (only if logged in)
setInterval(() => {
  if (authToken) loadMessages();
}, 5000);
