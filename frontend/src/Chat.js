import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

const Chat = ({ chatHistory, setChatHistory, selectedPDF }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBoxRef = useRef(null);

  // Scroll to bottom whenever chat updates
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user's message
    const newMessage = { sender: 'user', text: input };
    setChatHistory(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Fixed 422 issue: only send filename if selectedPDF exists
      const bodyPayload = selectedPDF
        ? { question: input, filename: selectedPDF }
        : { question: input };

      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      // Normalize backend answer
      let structuredAnswer = {};
      if (data.answer) {
        structuredAnswer = (typeof data.answer === 'object') ? data.answer : { Answer: data.answer };
      } else {
        structuredAnswer = { Answer: "No answer received" };
      }

      const botReply = { sender: 'bot', structured: structuredAnswer };
      setChatHistory(prev => [...prev, botReply]);

    } catch (err) {
      console.error("Error:", err);
      const botReply = { sender: 'bot', structured: { Error: "Error contacting backend" } };
      setChatHistory(prev => [...prev, botReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chat-container">
      <div className="chat-box" ref={chatBoxRef}>
        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            {msg.sender === 'user' ? (
              msg.text
            ) : (
              msg.structured ? (
                <div className="structured-response">
                  {Object.entries(msg.structured).map(([key, value]) => (
                    <div key={key} className="section">
                      <strong>{key}:</strong>
                      <div>
                        {Array.isArray(value)
                          ? value.map((v, idx) => <div key={idx}>{idx + 1}. {v}</div>)
                          : value.toString()
                        }
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                msg.text
              )
            )}
          </div>
        ))}
        {isTyping && <div className="chat-message bot">Thinking...</div>}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
