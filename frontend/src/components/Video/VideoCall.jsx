// import React, { useState, useRef, useEffect } from "react";
// import { io } from "socket.io-client";

// // Update SOCKET_URL to point to your deployed backend URL.
// const SOCKET_URL = "https://chatvideo-1.onrender.com";

// function VideoCall() {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const pc = useRef(null); // Store the RTCPeerConnection in a ref
//   const iceCandidateQueue = useRef([]); // Queue ICE candidates before PeerConnection is ready

//   const [localStream, setLocalStream] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);

//   useEffect(() => {
//     const newSocket = io(SOCKET_URL);
//     setSocket(newSocket);
//     console.log("Socket connecting to:", SOCKET_URL);

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
//           console.log("PeerConnection is null; creating new PeerConnection for answer...");
//           const newPc = await createPeerConnection(newSocket, localStream);
//           pc.current = newPc;
//         }
//         await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
//         console.log("Remote description set from offer.");
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
//         try {
//           await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
//           console.log("Remote description set from answer.");
//         } catch (error) {
//           console.error("Error setting remote description from answer:", error);
//         }
//       } else {
//         console.error("PeerConnection is not initialized.");
//       }
//     });

//     // Handle ICE candidate signaling
//     newSocket.on("ice-candidate", async (candidate) => {
//       console.log("Received ICE candidate:", candidate);
//       if (pc.current) {
//         try {
//           await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
//           console.log("Added ICE candidate successfully.");
//         } catch (error) {
//           console.error("Error adding ICE candidate:", error);
//         }
//       } else {
//         console.warn("PeerConnection not ready. Queueing ICE candidate.");
//         iceCandidateQueue.current.push(candidate); // Queue ICE candidate
//       }
//     });

//     return () => {
//       console.log("Disconnecting socket...");
//       newSocket.off("connect");
//       newSocket.off("connect_error");
//       newSocket.off("disconnect");
//       newSocket.off("offer");
//       newSocket.off("answer");
//       newSocket.off("ice-candidate");
//       newSocket.disconnect();
//     };
//   }, []); // Run once on mount

//   // Create and set up RTCPeerConnection; pass the localStream (if available)
//   async function createPeerConnection(socketInstance, stream) {
//     const configuration = {
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     };
//     const connection = new RTCPeerConnection(configuration);
//     console.log("RTCPeerConnection created:", connection);

//     // Use the passed-in stream (or fallback to state localStream) to add tracks
//     const mediaStream = stream || localStream;
//     if (mediaStream) {
//       console.log("Adding local tracks to connection.");
//       mediaStream.getTracks().forEach((track) => connection.addTrack(track, mediaStream));
//     } else {
//       console.warn("No local stream available when creating PeerConnection.");
//     }

//     connection.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Sending ICE candidate:", event.candidate);
//         socketInstance.emit("ice-candidate", event.candidate);
//       }
//     };

//     connection.ontrack = (event) => {
//       console.log("Remote track received:", event.streams[0]);
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       } else {
//         console.error("Remote video element not available.");
//       }
//     };

//     connection.oniceconnectionstatechange = () => {
//       console.log("ICE connection state changed:", connection.iceConnectionState);
//     };

//     // Process queued ICE candidates
//     while (iceCandidateQueue.current.length > 0) {
//       const candidate = iceCandidateQueue.current.shift();
//       await connection.addIceCandidate(new RTCIceCandidate(candidate));
//       console.log("Queued ICE candidate added.");
//     }

//     return connection;
//   }

//   // Start call: capture local media (if not done) and create/send offer
//   async function startCall() {
//     try {
//       let stream = localStream;
//       if (!stream) {
//         console.log("Requesting user media (video & audio)...");
//         stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         setLocalStream(stream);
//         if (localVideoRef.current) {
//           localVideoRef.current.srcObject = stream;
//         }
//         console.log("Local stream captured:", stream);
//       }

//       if (!pc.current) {
//         console.log("Creating PeerConnection...");
//         const newPc = await createPeerConnection(socket, stream);
//         pc.current = newPc;
//       } else {
//         console.log("PeerConnection already exists.");
//       }

//       if (pc.current) {
//         const offer = await pc.current.createOffer();
//         await pc.current.setLocalDescription(offer);
//         console.log("Sending offer:", offer);
//         socket.emit("offer", offer);
//       } else {
//         console.error("PeerConnection remains null after creation.");
//       }
//     } catch (error) {
//       console.error("Error starting call:", error);
//     }
//   }

//   // End call: stop all media tracks, close PeerConnection, and disconnect socket for cleanup
//   function endCall() {
//     console.log("Ending call...");
//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       setLocalStream(null);
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = null;
//       }
//       console.log("Local stream stopped and cleared.");
//     }
//     if (pc.current) {
//       pc.current.close();
//       pc.current = null;
//       console.log("PeerConnection closed.");
//     }
//     if (socket) {
//       socket.disconnect();
//       setSocket(null);
//       console.log("Socket disconnected.");
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

// Use your deployed backend URL for signaling
const SOCKET_URL = "https://chatvideo-1.onrender.com";

function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null); // Store the RTCPeerConnection

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

    // Handle an incoming offer 
    newSocket.on("offer", async (offer) => {
      console.log("Received offer:", offer);
      try {
        // If the answering side doesn't have a local stream, request it now.
        if (!localStream) {
          console.log("Local stream not available on answering side; requesting media...");
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          console.log("Local stream captured on answering side:", stream);
          // Create the PeerConnection with the new stream.
          const newPc = await createPeerConnection(newSocket, stream);
          pc.current = newPc;
        } else if (!pc.current) {
          console.log("PeerConnection is null; creating one using localStream.");
          const newPc = await createPeerConnection(newSocket, localStream);
          pc.current = newPc;
        }
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

    // Handle an incoming answer with a check for signaling state.
    newSocket.on("answer", async (answer) => {
      console.log("Received answer:", answer);
      if (!pc.current) {
        console.error("PeerConnection is not initialized.");
        return;
      }
      if (pc.current.signalingState !== "have-local-offer") {
        console.warn("Cannot set remote description from answer; signaling state is", pc.current.signalingState);
        return;
      }
      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Remote description set from answer.");
      } catch (error) {
        console.error("Error setting remote description from answer:", error);
      }
    });

    // Handle ICE candidate signaling
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
        console.error("PeerConnection is not initialized for ICE candidate.");
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

  // Function to create and set up a new RTCPeerConnection with the provided stream
  async function createPeerConnection(socketInstance, stream) {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const connection = new RTCPeerConnection(configuration);
    console.log("RTCPeerConnection created:", connection);

    connection.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", connection.iceConnectionState);
    };

    // Add local tracks to the connection if the stream is available
    if (stream) {
      console.log("Adding local tracks to peer connection.");
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));
    } else {
      console.warn("No local stream available when creating PeerConnection.");
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

  // Start call: capture local media (if not already captured) and create/send offer
  async function startCall() {
    try {
      let stream = localStream;
      if (!stream) {
        console.log("Requesting user media (video & audio)...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log("Local stream captured:", stream);
      }

      if (!pc.current) {
        console.log("Creating PeerConnection using local stream...");
        const newPc = await createPeerConnection(socket, stream);
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

  // End call: stop all media tracks and close the peer connection (do not disconnect the socket)
  function endCall() {
    console.log("Ending call...");
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      console.log("Local stream stopped and cleared.");
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
      console.log("PeerConnection closed.");
    }
    // Note: We are leaving the socket connection active to allow re-initiation of a call
    console.log("Call ended. Socket remains connected for re-calling.");
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
