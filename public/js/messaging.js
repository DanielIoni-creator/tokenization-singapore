// Client-Side Socket.io & Messaging Handler
let socket;
let currentRecipientId = null;

function initMessaging(token) {
  socket = io({
    auth: { token }
  });

  socket.on("connect", () => {
    console.log("Connected to Real-Time Messaging Server");
  });

  socket.on("new-message", (message) => {
    if (message.sender === currentRecipientId) {
      appendMessage(message, 'received');
      socket.emit("mark-read", { senderId: currentRecipientId });
    } else {
      updateUnreadBadge();
    }
  });

  socket.on("user-typing", (data) => {
    if (data.senderId === currentRecipientId) {
      showTypingIndicator();
    }
  });
}

function sendMessage(content, recipientId, orderId = null) {
  if (!socket || !content) return;
  socket.emit("send-message", { recipientId, content, orderId });
}

function appendMessage(msg, type) {
  const container = document.getElementById("chat-messages");
  if (!container) return;
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = msg.content;
  container.appendChild(div);
}
