// src/components/Video/VideoCall.jsx
import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

// Update SOCKET_URL to point to your deployed backend URL.
const SOCKET_URL = "https://chatvideo-1.onrender.com";

function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null); // PeerConnection stored in a ref

  const [localStream, setLocalStream] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.IO on component mount
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

    // When receiving an offer, ensure local media is captured then create a PeerConnection.
    newSocket.on("offer", async (offer) => {
      console.log("Received offer:", offer);
      try {
        // If no local stream is available on the answering side, request it now.
        if (!localStream) {
          console.log("Local stream not captured on answering side. Requesting media...");
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          console.log("Local stream captured on answering side:", stream);
        }
        // Create PeerConnection if not already created.
        if (!pc.current) {
          console.log("PeerConnection is null; creating new PeerConnection for answer...");
          const newPc = await createPeerConnection(newSocket);
          pc.current = newPc;
        }
        // Set remote description using the received offer.
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

    newSocket.on("ice-candidate", async (candidate) => {
      console.log("Received ICE candidate:", candidate);
      try {
        if (pc.current) {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate successfully.");
        } else {
          console.error("PeerConnection not initialized for ICE candidate.");
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
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

  // Create and set up an RTCPeerConnection
  async function createPeerConnection(socketInstance) {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const connection = new RTCPeerConnection(configuration);
    console.log("RTCPeerConnection created:", connection);
    setTimeout(() => {
      console.log("Current ICE connection state:", connection.iceConnectionState);
    }, 1000);

    // Add local tracks if available
    if (localStream) {
      console.log("Adding local tracks to the peer connection.");
      localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));
    } else {
      console.warn("No local stream available when creating PeerConnection.");
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socketInstance.emit("ice-candidate", event.candidate);
      }
    };

    connection.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", connection.iceConnectionState);
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
        console.log("Creating PeerConnection...");
        const newPc = await createPeerConnection(socket);
        pc.current = newPc;
      } else {
        console.log("PeerConnection already exists:", pc.current);
      }

      if (pc.current) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        console.log("Sending offer:", offer);
        socket.emit("offer", offer);
      } else {
        console.error("PeerConnection is still null after attempting to create it.");
      }
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }

  // End call: stop all media tracks, close PeerConnection, and disconnect socket
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
