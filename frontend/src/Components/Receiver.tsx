import { useEffect } from "react";

export const Receiver = () => {
    useEffect(() => {
        const socket = new WebSocket('wss://webrtc-cap.rithkchaudharytechnologies.xyz/ws/');
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "receiver" }));
        };

        let pc: RTCPeerConnection | null = null;

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'createOffer') {
                pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }
                    ]
                });

                await pc.setRemoteDescription(message.sdp);

                pc.onicecandidate = (event) => {
                    console.log(event);
                    if (event.candidate) {
                        socket.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
                    }
                };

                pc.ontrack = (event) => {
                    console.log("Track received!", event);
                    const video = document.createElement('video');
                    video.autoplay = true;
                    video.setAttribute('playsinline', 'true');
                    video.srcObject = event.streams[0]; // Proper way to attach stream
                    document.body.appendChild(video);
                };

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: "createAnswer", sdp: pc.localDescription }));
            }
            else if (message.type === 'iceCandidate' && pc) {
                pc.addIceCandidate(message.candidate);
            }
        };
    }, []);

    return <div>Receiver</div>;
};
