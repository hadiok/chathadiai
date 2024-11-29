const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const webPush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
let onon=0;
let judul = "Grub Chat umum";
let chatHistory=[];
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});


// Konfigurasi VAPID Keys
const vapidKeys = {
    publicKey: "BGy2PpXPUHDjPMpBLOOJksScJlMQlor1hcg2ZReucgNVdSSGD36FKOk9WrrK1YJf__iWOTEZOGsmT6wF-AFoj6c", // Masukkan VAPID Public Key Anda
    privateKey: "tZW0dXXeUXoSJF7NWssyqpVqB8Sq8y_dL_79Hj14DvM", // Masukkan VAPID Private Key Anda
};

webPush.setVapidDetails(
    "mailto:your-email@example.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Middleware
app.use(cors());
app.use(bodyParser.json());

let subscriptions = [];

// API untuk menyimpan subscription
app.post("/subscribe", (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({ message: "Subscription received" });
});

// API untuk mengirim notifikasi
app.post("/notify", (req, res) => {
    const { title, message } = req.body;

    subscriptions.forEach((subscription) => {
        webPush
            .sendNotification(
                subscription,
                JSON.stringify({
                    title: title,
                    body: message,
                    icon: "https://omhadi.site/logo.png",
                })
            )
            .catch((error) => console.error("Error sending notification", error));
    });

    res.status(200).json({ message: "Notifications sent" });
});








io.on('connection', (socket) => {
    console.log('A user connected');
    onon++;

    socket.emit('load_chat', chatHistory);
    io.emit('online', onon);
    socket.emit('judulterganti', judul);
    console.log('judul ' + judul + ' diterapkan');

    // Ganti judul chat
    socket.on('gantijudul', (jd) => {
        judul = jd;
        socket.emit('judulterganti', jd);
    });










    // Tangkap push
    socket.on('tangkappush', (data) => {
        console.log(data.pusi);
    });

    // Kirim pesan
    socket.on('send_message', (data) => {
        chatHistory.push(data);
            subscriptions.forEach((subscription) => {
                webPush
                    .sendNotification(
                        subscription,
                        JSON.stringify({
                            title: data.sender,
                            body: data.message,
                            icon: "https://omhadi.site/logo.png",
                        })
                    )
                    .catch((error) => console.error("Error sending notification", error));
                    console.log("Notifikasi dikirim");
            });
        io.emit('receive_message', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
        onon--;
        io.emit('online', onon);
        console.log('User disconnected');
    });

    // Hapus pesan
    socket.on('deletepesan', (id, me) => {
        const index = chatHistory.findIndex((msg) => msg.id === id);
        if (index !== -1) {
            chatHistory.splice(index, 1);
            io.emit('pesan_terhapus', id, me);
        }
    });
});

// Menjalankan server
server.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
});
