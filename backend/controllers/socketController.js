/**
 * Initializes all the socket event handlers.
 * @param {SocketIO.Server} io - The Socket.IO server instance.
 */
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    // Handle chat messages
    socket.on("chat message", (msg) => {
      console.log(`Chat message received from ${socket.id}: ${msg}`);
      // Broadcast the message to all connected clients.
      io.emit("chat message", msg);
    });

    // Handle WebRTC signaling: Offer
    socket.on("offer", (offer) => {
      console.log("Offer received from " + socket.id, offer);
      // Broadcast the offer to all other clients (excluding sender)
      socket.broadcast.emit("offer", offer);
    });

    // Handle WebRTC signaling: Answer
    socket.on("answer", (answer) => {
      console.log("Answer received from " + socket.id, answer);
      // Broadcast the answer to all other clients (excluding sender)
      socket.broadcast.emit("answer", answer);
    });

    // Handle WebRTC signaling: ICE Candidate
    socket.on("ice-candidate", (candidate) => {
      console.log("ICE candidate received from " + socket.id, candidate);
      // Broadcast the candidate to all other clients (excluding sender)
      socket.broadcast.emit("ice-candidate", candidate);
    });

    // Listen for disconnections.
    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);
    });
  });
};

module.exports = initializeSocket;
