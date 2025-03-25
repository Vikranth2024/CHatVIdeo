

// src/components/Video/VideoCall.jsx
import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5020";

function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [localStream, setLocalStream] = useState(null);
  const [pc, setPc] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection on component mount
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Socket event handlers for signaling
    newSocket.on("offer", async (offer) => {
      console.log("Received offer:", offer);
      if (!pc) {
        await createPeerConnection(newSocket);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit("answer", answer);
    });

    newSocket.on("answer", async (answer) => {
      console.log("Received answer:", answer);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    newSocket.on("ice-candidate", async (candidate) => {
      console.log("Received ICE candidate:", candidate);
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding candidate:", error);
      }
    });

    return () => newSocket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create and set up RTCPeerConnection (without automatically capturing media)
  async function createPeerConnection(socketInstance) {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const connection = new RTCPeerConnection(configuration);
    setPc(connection);

    // Add local tracks to connection if available
    if (localStream) {
      localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
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
      }
    };

    return connection;
  }

  // Start call: get media if not already captured, then create offer
  async function startCall() {
    try {
      // Initiate media capture only when Start Call is clicked
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
      
      // Create peer connection if it does not exist
      if (!pc) {
        await createPeerConnection(socket);
      }

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Sending offer:", offer);
      socket.emit("offer", offer);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }

  // End call: stop all media tracks and close peer connection
  function endCall() {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
    if (pc) {
      pc.close();
      setPc(null);
    }
    console.log("Call ended.");
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
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
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
 