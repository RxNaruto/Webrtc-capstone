import { useEffect } from "react"

export const Receiver = () => {
    useEffect(() => {
        const socket = new WebSocket('wss://webrtc-cap.rithkchaudharytechnologies.xyz');
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "receiver" }));
        }
        let pc: RTCPeerConnection | null = null;
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc = new RTCPeerConnection();

                pc.setRemoteDescription(message.sdp);
                pc.onicecandidate = (event) => {
                    console.log(event);
                    if (event.candidate) {
                        socket?.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
                    }
                }
                pc.ontrack=(event)=>{
              
                  console.log("Track received!", event);
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.setAttribute('playsinline', 'true');
    video.srcObject = new MediaStream([event.track]);
    document.body.appendChild(video);
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: "createAnswer", sdp: pc.localDescription }));
            }
            else if(message.type==='iceCandidate'){
                // @ts-ignore
                pc.addIceCandidate(message.candidate);
            }
        }
    }, []);
    return <div>
         reciever
    </div>
}