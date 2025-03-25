/**
 * Initializes all the socket event handlers.
 * @param {SocketIO.Server} io - The Socket.IO server instance.
 */



const initializeSocket = (io) => {
    io.on("connection", (socket) => {
      console.log("User connected: " + socket.id);
      
      // Listen for a "chat message" event from the client.
      socket.on("chat message", (msg) => {
        console.log(`Chat message received from ${socket.id}: ${msg}`);
        // Broadcast the message to all connected clients.
        io.emit("chat message", msg);
      });
  
      // Listen for disconnections.
      socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
      });
    });
  };
  
  module.exports = initializeSocket;
  