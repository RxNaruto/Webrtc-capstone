import { useEffect, useState } from "react";

export const Sender = () => {
    const [socket, setSocket] = useState<null | WebSocket>(null);

    useEffect(() => {
        const socket = new WebSocket('wss://webrtc-cap.rithkchaudharytechnologies.xyz/ws/');
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'sender' }));
        };
        setSocket(socket);
    }, []);

    async function startSendingVideo() {
        if (!socket) return;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        pc.onnegotiationneeded = async () => {
            console.log("onnegotiation needed");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({ type: "createOffer", sdp: pc.localDescription }));
        };

        pc.onicecandidate = (event) => {
            console.log(event);
            if (event.candidate) {
                socket?.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
            }
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "createAnswer") {
                pc.setRemoteDescription(data.sdp);
            } else if (data.type === 'iceCandidate') {
                pc.addIceCandidate(data.candidate);
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Optional: Show local video preview
        const localVideo = document.createElement('video');
        localVideo.autoplay = true;
        localVideo.muted = true;
        localVideo.setAttribute('playsinline', 'true');
        localVideo.srcObject = stream;
        document.body.appendChild(localVideo);
    }

    return (
        <div onClick={startSendingVideo}>
            <button>Send Video</button>
        </div>
    );
};
