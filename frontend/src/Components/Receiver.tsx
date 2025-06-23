import { useEffect } from "react";

export const Receiver = () => {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3005");

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "receiver" }));
    };

    startReceiving(socket);
  }, []);

  const startReceiving = (socket: WebSocket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    const mediaStream = new MediaStream();
    video.srcObject = mediaStream;
    document.body.appendChild(video);

    pc.ontrack = (event) => {
      mediaStream.addTrack(event.track);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({
          type: "iceCandidate",
          candidate: event.candidate
        }));
      }
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createOffer") {
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(JSON.stringify({
          type: "createAnswer",
          sdp: pc.localDescription
        }));
      } else if (message.type === "iceCandidate") {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    };
  };

  return <div><h1>Receiver</h1></div>;
};
