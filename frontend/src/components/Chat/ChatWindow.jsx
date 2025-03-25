// frontend/src/components/Chat/ChatWindow.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';

const ChatWindow = () => {
  const { messages, sendMessage, currentSocketId } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== "") {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Chat</h2>
      <div className="border p-4 mb-4 h-64 overflow-y-scroll bg-white rounded">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <div className="text-xs text-gray-500 mb-1">
              <span>
                {msg.sender === currentSocketId ? "You" : msg.sender}
              </span>{" "}
              | <span>{msg.timestamp}</span>
            </div>
            <div className="p-2 bg-gray-100 rounded">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your message..."
          className="flex-1 p-2 border rounded-l focus:outline-none"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
