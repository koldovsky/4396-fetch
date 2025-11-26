const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatUsername = document.getElementById('chat-username');
const chatMessage = document.getElementById('chat-message');

// Format timestamp to readable time
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Render a single message
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load and display all messages
async function loadMessages() {
  try {
    const response = await fetch('/api/chat');
    const messages = await response.json();
    
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

// Send a new message
async function sendMessage(username, message) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message })
    });
    
    if (response.ok) {
      const newMsg = await response.json();
      // Remove empty state message if present
      const emptyMsg = chatMessages.querySelector('.chat__empty');
      if (emptyMsg) emptyMsg.remove();
      
      chatMessages.appendChild(renderMessage(newMsg));
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return true;
    }
  } catch (err) {
    console.error('Failed to send message:', err);
  }
  return false;
}

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = chatUsername.value.trim();
  const message = chatMessage.value.trim();
  
  if (username && message) {
    const success = await sendMessage(username, message);
    if (success) {
      chatMessage.value = '';
      chatMessage.focus();
    }
  }
});

// Load messages on init
loadMessages();

// Poll for new messages every 5 seconds
setInterval(loadMessages, 5000);
