import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3005 });

let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', (data: any) => {
    const message = JSON.parse(data);

    if (message.type === 'sender') {
      console.log("Sender connected");
      senderSocket = ws;
    } else if (message.type === 'receiver') {
      console.log("Receiver connected");
      receiverSocket = ws;
    } else if (message.type === 'createOffer') {
      if (ws !== senderSocket) return;
      console.log("Forwarding offer to receiver");
      receiverSocket?.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
    } else if (message.type === 'createAnswer') {
      if (ws !== receiverSocket) return;
      console.log("Forwarding answer to sender");
      senderSocket?.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
    } else if (message.type === 'iceCandidate') {
      const target = ws === senderSocket ? receiverSocket : senderSocket;
      console.log("Forwarding ICE candidate");
      target?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
    }
  });
});
