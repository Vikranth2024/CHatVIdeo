

// // src/components/Video/VideoCall.jsx
// import React, { useState, useRef, useEffect } from "react";
// import { io } from "socket.io-client";

// // Use environment variable for SOCKET_URL
// const SOCKET_URL = "https://chatvideo-1.onrender.com";

// function VideoCall() {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const pc = useRef(null); // Use `useRef` to store the PeerConnection

//   const [localStream, setLocalStream] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);

//   useEffect(() => {
//     const newSocket = io(SOCKET_URL);
//     setSocket(newSocket);

//     // Handle successful connection
//     newSocket.on("connect", () => {
//       console.log("Socket connected. ID:", newSocket.id);
//       setIsConnected(true);
//     });

//     // Handle connection errors
//     newSocket.on("connect_error", (error) => {
//       console.error("Socket connection error:", error);
//     });

//     // Handle disconnection
//     newSocket.on("disconnect", (reason) => {
//       console.warn("Socket disconnected. Reason:", reason);
//       setIsConnected(false);
//     });

//     // Handle offer signaling
//     newSocket.on("offer", async (offer) => {
//       console.log("Received offer:", offer);
//       try {
//         if (!pc.current) {
//           console.log("Creating PeerConnection for answer...");
//           const newPc = await createPeerConnection(newSocket);
//           pc.current = newPc;
//         }
//         await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
//         const answer = await pc.current.createAnswer();
//         await pc.current.setLocalDescription(answer);
//         console.log("Sending answer:", answer);
//         newSocket.emit("answer", answer);
//       } catch (error) {
//         console.error("Error handling offer:", error);
//       }
//     });

//     // Handle answer signaling
//     newSocket.on("answer", async (answer) => {
//       console.log("Received answer:", answer);
//       if (pc.current) {
//         await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
//       } else {
//         console.error("PeerConnection is not initialized.");
//       }
//     });

//     // Handle ICE candidate signaling
//     newSocket.on("ice-candidate", async (candidate) => {
//       console.log("Received ICE candidate:", candidate);
//       if (pc.current) {
//         await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
//       } else {
//         console.error("PeerConnection is not initialized.");
//       }
//     });

//     // Cleanup when component unmounts
//     return () => {
//       if (newSocket) {
//         newSocket.off("connect");
//         newSocket.off("connect_error");
//         newSocket.off("disconnect");
//         newSocket.off("offer");
//         newSocket.off("answer");
//         newSocket.off("ice-candidate");
//         newSocket.disconnect();
//       }
//     };
//   }, []); // Empty dependency array, runs once when component mounts

//   // Create and set up RTCPeerConnection
//   async function createPeerConnection(socketInstance) {
//     const configuration = {
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     };
//     const connection = new RTCPeerConnection(configuration);

//     if (localStream) {
//       localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
//     }

//     connection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socketInstance.emit("ice-candidate", event.candidate);
//       }
//     };

//     connection.ontrack = (event) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     return connection;
//   }

//   // Start call: get media if not already captured, then create offer
//   async function startCall() {
//     try {
//       if (!localStream) {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         setLocalStream(stream);
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//         }
//       }

//       if (!pc.current) {
//         const newPc = await createPeerConnection(socket);
//         pc.current = newPc;
//       }

//       const offer = await pc.current.createOffer();
//       await pc.current.setLocalDescription(offer);
//       socket.emit("offer", offer);
//     } catch (error) {
//       console.error("Error starting call:", error);
//     }
//   }

//   // End call: stop all media tracks and close peer connection
//   function endCall() {
//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       setLocalStream(null);
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = null;
//       }
//     }
//     if (pc.current) {
//       pc.current.close();
//       pc.current = null;
//     }
//     if (socket) {
//       socket.disconnect();
//       setSocket(null);
//     }
//     console.log("Call ended and resources cleaned up.");
//   }

//   return (
//     <div className="p-4">
//       <h2 className="text-2xl font-bold mb-4">Video Call</h2>

//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="flex-1">
//           <h3 className="text-xl mb-2">Local Video</h3>
//           <video ref={localVideoRef} autoPlay muted className="w-full bg-black rounded shadow" />
//         </div>
//         <div className="flex-1">
//           <h3 className="text-xl mb-2">Remote Video</h3>
//           <video ref={remoteVideoRef} autoPlay className="w-full bg-black rounded shadow" />
//         </div>
//       </div>

//       <div className="mt-4 flex space-x-4">
//         <button
//           onClick={startCall}
//           className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
//           disabled={!isConnected}
//         >
//           Start Call
//         </button>
//         <button
//           onClick={endCall}
//           className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
//         >
//           End Call
//         </button>
//       </div>
//     </div>
//   );
// }

// export default VideoCall;


// src/components/Video/VideoCall.jsx
import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

// Update SOCKET_URL to your deployed backend URL.
const SOCKET_URL = "https://chatvideo-1.onrender.com";

function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null); // Use ref for the peer connection

  const [localStream, setLocalStream] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    console.log("Socket connecting to:", SOCKET_URL);

    newSocket.on("connect", () => {
      console.log("Socket connected. ID:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    // Handle receiving an offer
    newSocket.on("offer", async (offer) => {
      console.log("Received offer:", offer);
      try {
        if (!pc.current) {
          console.log("PeerConnection not initialized; creating one for answering.");
          const newPc = await createPeerConnection(newSocket);
          pc.current = newPc;
        }
        // Set remote description from the offer
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("Remote description set from offer.");
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        console.log("Sending answer:", answer);
        newSocket.emit("answer", answer);
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    // Handle receiving an answer
    newSocket.on("answer", async (answer) => {
      console.log("Received answer:", answer);
      if (pc.current) {
        try {
          await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("Remote description set from answer.");
        } catch (error) {
          console.error("Error setting remote description from answer:", error);
        }
      } else {
        console.error("PeerConnection is not initialized.");
      }
    });

    // Handle receiving ICE candidates
    newSocket.on("ice-candidate", async (candidate) => {
      console.log("Received ICE candidate:", candidate);
      if (pc.current) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate successfully.");
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      } else {
        console.error("PeerConnection is not initialized.");
      }
    });

    return () => {
      console.log("Disconnecting socket...");
      newSocket.off("connect");
      newSocket.off("connect_error");
      newSocket.off("disconnect");
      newSocket.off("offer");
      newSocket.off("answer");
      newSocket.off("ice-candidate");
      newSocket.disconnect();
    };
  }, []);

  // Create and set up RTCPeerConnection
  async function createPeerConnection(socketInstance) {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const connection = new RTCPeerConnection(configuration);

    console.log("RTCPeerConnection created:", connection);

    // Log ICE connection state changes
    connection.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", connection.iceConnectionState);
    };

    // Add local tracks if available
    if (localStream) {
      console.log("Adding local tracks to connection.");
      localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
    } else {
      console.warn("Local stream not available when creating PeerConnection.");
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socketInstance.emit("ice-candidate", event.candidate);
      }
    };

    connection.ontrack = (event) => {
      console.log("Remote track received:", event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      } else {
        console.error("Remote video element not available.");
      }
    };

    return connection;
  }

  // Start call: capture local media and create/send offer
  async function startCall() {
    try {
      // If no local stream, get media from user
      if (!localStream) {
        console.log("Requesting user media (video & audio)...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log("Local stream captured:", stream);
      }

      // Ensure PeerConnection is created
      if (!pc.current) {
        console.log("Creating PeerConnection...");
        const newPc = await createPeerConnection(socket);
        pc.current = newPc;
      } else {
        console.log("PeerConnection already exists.");
      }

      if (pc.current) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        socket.emit("offer", offer);
      } else {
        console.error("PeerConnection remains null after creation.");
      }
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }

  // End call: stop media tracks, close PeerConnection, and disconnect socket (for cleanup)
  function endCall() {
    console.log("Ending call...");
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      console.log("Local stream stopped.");
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
      console.log("PeerConnection closed.");
    }
    if (socket) {
      socket.disconnect();
      setSocket(null);
      console.log("Socket disconnected.");
    }
    console.log("Call ended and resources cleaned up.");
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Video Call</h2>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <h3 className="text-xl mb-2">Local Video</h3>
          <video ref={localVideoRef} autoPlay muted className="w-full bg-black rounded shadow" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl mb-2">Remote Video</h3>
          <video ref={remoteVideoRef} autoPlay className="w-full bg-black rounded shadow" />
        </div>
      </div>

      <div className="mt-4 flex space-x-4">
        <button
          onClick={startCall}
          className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isConnected}
        >
          Start Call
        </button>
        <button
          onClick={endCall}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          End Call
        </button>
      </div>
    </div>
  );
}

export default VideoCall;
