
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const WebSocket = require('ws');
const fs = require('fs');

// Estado de autenticação
const { state, saveState } = useSingleFileAuthState('./auth.json');

// Iniciar WebSocket servidor
const wss = new WebSocket.Server({ port: 3000 });
let lastQR = null;

wss.on('connection', ws => {
    if (lastQR) {
        ws.send(JSON.stringify({ qr: lastQR }));
    }
});

// Iniciar sessão Baileys
async function startSock() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            lastQR = qr;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ qr }));
                }
            });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startSock();
            }
        } else if (connection === 'open') {
            console.log('Conectado com sucesso!');
        }
    });

    return sock;
}

startSock();
