"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 3005 });
let senderSocket = null;
let receiverSocket = null;
wss.on('connection', (ws) => {
    ws.on('error', console.error);
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'sender') {
            console.log("Sender connected");
            senderSocket = ws;
        }
        else if (message.type === 'receiver') {
            console.log("Receiver connected");
            receiverSocket = ws;
        }
        else if (message.type === 'createOffer') {
            if (ws !== senderSocket)
                return;
            console.log("Forwarding offer to receiver");
            receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
        }
        else if (message.type === 'createAnswer') {
            if (ws !== receiverSocket)
                return;
            console.log("Forwarding answer to sender");
            senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
        }
        else if (message.type === 'iceCandidate') {
            const target = ws === senderSocket ? receiverSocket : senderSocket;
            console.log("Forwarding ICE candidate");
            target === null || target === void 0 ? void 0 : target.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
        }
    });
});
