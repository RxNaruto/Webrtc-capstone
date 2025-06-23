import { useEffect, useRef, useState } from "react";

export const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pc, setPC] = useState<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://54.91.184.82:3005");
    setSocket(ws);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "sender" }));
    };
  }, []);

  const initiateConn = async () => {
    if (!socket) return alert("Socket not ready");

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    setPC(pc);

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createAnswer") {
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
      } else if (message.type === "iceCandidate") {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({
          type: "iceCandidate",
          candidate: event.candidate
        }));
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    document.body.appendChild(video);

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.send(JSON.stringify({
      type: "createOffer",
      sdp: pc.localDescription
    }));
  };

  const stopVideo = () => {
    if (!streamRef.current) return;

    // Stop all tracks
    streamRef.current.getTracks().forEach(track => {
      track.stop();
    });

    // Optional: Close the peer connection
    pc?.close();
    setPC(null);
    streamRef.current = null;

    alert("Video transmission stopped");
  };

  return (
    <div>
      <h1>Sender</h1>
      <button onClick={initiateConn}>Start Video</button>
      <button onClick={stopVideo} style={{ marginLeft: '10px' }}>Stop Video</button>
    </div>
  );
};
