import { useEffect, useState } from "react";

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket("wss://54.91.184.82:3005");
        ws.onopen = () => {
            safeSend(ws, { type: "sender" });
        };
        setSocket(ws);
    }, []);

    const safeSend = (ws: WebSocket, data: any) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        } else {
            setTimeout(() => safeSend(ws, data), 100);
        }
    };

    const initiateConn = async () => {
        if (!socket) {
            alert("Socket not available");
            return;
        }

        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                safeSend(socket, {
                    type: "iceCandidate",
                    candidate: event.candidate,
                });
            }
        };

        peer.onnegotiationneeded = async () => {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            safeSend(socket, {
                type: "createOffer",
                sdp: peer.localDescription,
            });
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createAnswer") {
                await peer.setRemoteDescription(message.sdp);
            } else if (message.type === "iceCandidate") {
                await peer.addIceCandidate(message.candidate);
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        document.body.appendChild(video);

        stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
        });
    };

    return (
        <div>
            <h2>Sender</h2>
            <button onClick={initiateConn}>Send Video</button>
        </div>
    );
};
