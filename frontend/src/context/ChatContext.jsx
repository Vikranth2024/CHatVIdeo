// frontend/src/context/ChatContext.jsx
// frontend/src/context/ChatContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://chatvideo-1.onrender.com";
const ChatContext = createContext();

// Custom hook for easier context usage
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentSocketId, setCurrentSocketId] = useState("");

  useEffect(() => {
    // Initialize the Socket.IO client
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected! Socket ID:", newSocket.id);
      setCurrentSocketId(newSocket.id);
    });

    // Listen for incoming chat messages
    newSocket.on("chat message", (msg) => {
      console.log(`Chat message received from ${msg.sender}:`, msg.text);
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Cleanup when the component unmounts
    return () => newSocket.disconnect();
  }, []);

  // Function to send a message via the socket
  const sendMessage = (text) => {
    if (socket) {
      const messageObj = {
        text,
        timestamp: new Date().toLocaleTimeString(),
        sender: socket.id, // include the sender's socket id
      };
      socket.emit("chat message", messageObj);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, currentSocketId }}>
      {children}
    </ChatContext.Provider>
  );
};
