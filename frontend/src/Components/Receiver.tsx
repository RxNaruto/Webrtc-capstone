import { useEffect } from "react";

export const Receiver = () => {
    useEffect(() => {
        const socket = new WebSocket("wss://54.91.184.82:3005");

        socket.onopen = () => {
            safeSend(socket, { type: "receiver" });
            startReceiving(socket);
        };
    }, []);

    const safeSend = (ws: WebSocket, data: any) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        } else {
            setTimeout(() => safeSend(ws, data), 100);
        }
    };

    const startReceiving = (socket: WebSocket) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        const video = document.createElement("video");
        video.autoplay = true;
        document.body.appendChild(video);

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                video.srcObject = event.streams[0];
            } else {
                const stream = new MediaStream([event.track]);
                video.srcObject = stream;
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                safeSend(socket, {
                    type: "iceCandidate",
                    candidate: event.candidate,
                });
            }
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createOffer") {
                await pc.setRemoteDescription(message.sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                safeSend(socket, {
                    type: "createAnswer",
                    sdp: answer,
                });
            } else if (message.type === "iceCandidate") {
                await pc.addIceCandidate(message.candidate);
            }
        };
    };

    return <div><h2>Receiver</h2></div>;
};
