

// // src/components/Video/VideoCall.jsx
// import React, { useState, useRef, useEffect } from "react";
// import { io } from "socket.io-client";

// // Use your deployed backend URL for signaling
// const SOCKET_URL = "https://chatvideo-1.onrender.com";

// function VideoCall() {
//   // Refs for video elements and RTCPeerConnection
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const pc = useRef(null);

//   // State for local stream, socket connection, and UI flags
//   const [localStream, setLocalStream] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isAudioMuted, setIsAudioMuted] = useState(false);
//   const [isVideoDisabled, setIsVideoDisabled] = useState(false);

//   useEffect(() => {
//     const newSocket = io(SOCKET_URL);
//     setSocket(newSocket);
//     console.log("Socket connecting to:", SOCKET_URL);

//     newSocket.on("connect", () => {
//       console.log("Socket connected. ID:", newSocket.id);
//       setIsConnected(true);
//     });

//     newSocket.on("connect_error", (error) => {
//       console.error("Socket connection error:", error);
//     });

//     newSocket.on("disconnect", (reason) => {
//       console.warn("Socket disconnected. Reason:", reason);
//       setIsConnected(false);
//     });

//     // Handle offer signaling
//     newSocket.on("offer", async (offer) => {
//       console.log("Received offer:", offer);
//       try {
//         // If local stream is not available, request it
//         if (!localStream) {
//           console.log("Local stream not captured on answering side; requesting media...");
//           const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//           setLocalStream(stream);
//           if (localVideoRef.current) {
//             localVideoRef.current.srcObject = stream;
//           }
//           console.log("Local stream captured on answering side:", stream);
//           // Create PeerConnection with the captured stream
//           const newPc = await createPeerConnection(newSocket, stream);
//           pc.current = newPc;
//         } else if (!pc.current) {
//           console.log("PeerConnection is null; creating one using localStream.");
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

//     // Handle answer signaling with state check
//     newSocket.on("answer", async (answer) => {
//       console.log("Received answer:", answer);
//       if (!pc.current) {
//         console.error("PeerConnection is not initialized.");
//         return;
//       }
//       if (pc.current.signalingState !== "have-local-offer") {
//         console.warn("Cannot set remote description from answer; signaling state is", pc.current.signalingState);
//         return;
//       }
//       try {
//         await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
//         console.log("Remote description set from answer.");
//       } catch (error) {
//         console.error("Error setting remote description from answer:", error);
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
//         console.error("PeerConnection is not initialized for ICE candidate.");
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
//   }, []);

//   // Create and set up RTCPeerConnection with provided stream
//   async function createPeerConnection(socketInstance, stream) {
//     const configuration = {
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     };
//     const connection = new RTCPeerConnection(configuration);
//     console.log("RTCPeerConnection created:", connection);

//     // Log ICE connection state changes
//     connection.oniceconnectionstatechange = () => {
//       console.log("ICE connection state changed:", connection.iceConnectionState);
//     };

//     // Add local tracks if available
//     if (stream) {
//       console.log("Adding local tracks to peer connection.");
//       stream.getTracks().forEach((track) => connection.addTrack(track, stream));
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

//     return connection;
//   }

//   // Toggle audio mute/unmute
//   function toggleAudio() {
//     if (!localStream) return;
//     localStream.getAudioTracks().forEach((track) => {
//       track.enabled = !track.enabled;
//     });
//     setIsAudioMuted(!isAudioMuted);
//     console.log("Audio muted:", !isAudioMuted);
//   }

//   // Toggle video enable/disable
//   function toggleVideo() {
//     if (!localStream) return;
//     localStream.getVideoTracks().forEach((track) => {
//       track.enabled = !track.enabled;
//     });
//     setIsVideoDisabled(!isVideoDisabled);
//     console.log("Video disabled:", !isVideoDisabled);
//   }

//   // Start call: capture media and create/send an offer.
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
//         console.log("Creating PeerConnection using local stream...");
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

//   // End call: stop media and close PeerConnection, but keep socket connected.
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
//     console.log("Call ended; socket remains connected for re-calling.");
//   }

//   return (
//     <div className="relative h-screen flex flex-col bg-black">
//       {/* Remote video fills the screen */}
//       <video ref={remoteVideoRef} autoPlay className="absolute w-full h-full object-cover" />

//       {/* Local video as picture-in-picture in corner */}
//       <div className="absolute bottom-8 right-8 w-32 h-24 border border-white rounded overflow-hidden shadow-lg">
//         <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
//       </div>

//       {/* Control Bar (styled similar to Google Meet) */}
//       <div className="relative z-10 mt-auto bg-gray-900 bg-opacity-80 p-4 flex justify-center items-center space-x-6">
//         <button
//           onClick={toggleAudio}
//           className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors"
//         >
//           {isAudioMuted ? "Unmute" : "Mute"}
//         </button>
//         <button
//           onClick={toggleVideo}
//           className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors"
//         >
//           {isVideoDisabled ? "Enable Video" : "Disable Video"}
//         </button>
//         <button
//           onClick={endCall}
//           className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-full transition-colors"
//         >
//           End Call
//         </button>
//         <button
//           onClick={startCall}
//           className={`bg-green-600 hover:bg-green-500 text-white p-3 rounded-full transition-colors ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
//           disabled={!isConnected}
//         >
//           Start Call
//         </button>
//       </div>
//     </div>
//   );
// }

// export default VideoCall;


// src/components/Video/VideoCall.jsx
import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

// Set your deployed backend URL
const SOCKET_URL = "https://chatvideo-1.onrender.com";

function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);

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

    newSocket.on("offer", async (offer) => {
      console.log("Received offer:", offer);
      try {
        if (!localStream) {
          console.log("Requesting user media on answering side...");
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(stream);
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          console.log("Local stream captured:", stream);
          const newPc = await createPeerConnection(newSocket, stream);
          pc.current = newPc;
        } else if (!pc.current) {
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

    newSocket.on("answer", async (answer) => {
      console.log("Received answer:", answer);
      if (!pc.current) {
        console.error("PeerConnection is not initialized.");
        return;
      }
      if (pc.current.signalingState !== "have-local-offer") {
        console.warn("Signaling state is", pc.current.signalingState, "- cannot set remote answer.");
        return;
      }
      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Remote description set from answer.");
      } catch (error) {
        console.error("Error setting remote description from answer:", error);
      }
    });

    newSocket.on("ice-candidate", async (candidate) => {
      console.log("Received ICE candidate:", candidate);
      if (pc.current) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate.");
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      } else {
        console.error("PeerConnection not initialized for ICE candidate.");
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

  async function createPeerConnection(socketInstance, stream) {
    const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const connection = new RTCPeerConnection(configuration);
    console.log("RTCPeerConnection created:", connection);

    connection.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", connection.iceConnectionState);
    };

    if (stream) {
      console.log("Adding local tracks.");
      stream.getTracks().forEach((track) => connection.addTrack(track, stream));
    } else {
      console.warn("No stream available for adding tracks.");
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

  function toggleAudio() {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setIsAudioMuted(!isAudioMuted);
    console.log("Audio muted:", !isAudioMuted);
  }

  function toggleVideo() {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    setIsVideoDisabled(!isVideoDisabled);
    console.log("Video disabled:", !isVideoDisabled);
  }

  async function startCall() {
    try {
      let stream = localStream;
      if (!stream) {
        console.log("Requesting user media (video & audio)...");
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        console.log("Local stream captured:", stream);
      }

      if (!pc.current) {
        console.log("Creating PeerConnection...");
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
        console.error("PeerConnection remains null.");
      }
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }

  function endCall() {
    console.log("Ending call...");
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      console.log("Local stream stopped and cleared.");
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
      console.log("PeerConnection closed.");
    }
    console.log("Call ended; socket remains connected for re-calling.");
  }

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white flex flex-col justify-center items-center">
      {/* Remote video background */}
      <video ref={remoteVideoRef} autoPlay className="absolute inset-0 w-full h-full object-cover" />
      {/* Local video as picture-in-picture */}
      <div className="absolute bottom-24 right-8 w-40 h-28 border-2 border-gray-200 rounded overflow-hidden shadow-lg">
        <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
      </div>
      {/* Control bar */}
      <div className="absolute bottom-0 left-0 w-full flex justify-center pb-8">
        <div className="bg-gray-800 bg-opacity-80 rounded-full px-6 py-4 flex items-center space-x-6">
          <button onClick={toggleAudio} className="hover:text-red-500 transition-colors">
            {isAudioMuted ? <i className="fas fa-microphone-slash text-2xl" /> : <i className="fas fa-microphone text-2xl" />}
          </button>
          <button onClick={toggleVideo} className="hover:text-red-500 transition-colors">
            {isVideoDisabled ? <i className="fas fa-video-slash text-2xl" /> : <i className="fas fa-video text-2xl" />}
          </button>
          <button onClick={endCall} className="bg-red-600 hover:bg-red-500 p-3 rounded-full transition-colors">
            {/* End Call icon */}
            <i className="fas fa-phone-slash text-2xl" />
          </button>
          <button
            onClick={startCall}
            className={`bg-green-600 hover:bg-green-500 p-3 rounded-full transition-colors ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!isConnected}
          >
            <i className="fas fa-phone text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;

