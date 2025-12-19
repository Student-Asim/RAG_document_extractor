// src/ChatHistory.js
import React from 'react';

const ChatHistory = ({ chatHistory }) => {
  return (
    <div>
      <h2>Chat History</h2>
      {chatHistory.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        chatHistory.map((msg, index) => (
          <div key={index}>
            <span>{msg.timestamp.toLocaleString()}: </span>
            {msg.text}
          </div>
        ))
      )}
    </div>
  );
};

export default ChatHistory;
