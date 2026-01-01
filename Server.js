const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const users = {}; // Храним ники пользователей

io.on('connection', (socket) => {
    console.log('Пользователь подключился');

    // При подключении просим ник
    socket.emit('request nickname');

    socket.on('set nickname', (nickname) => {
        if (!nickname || nickname.trim() === '') nickname = 'Аноним';
        socket.nickname = nickname.trim();
        users[socket.id] = socket.nickname;
        io.emit('user joined', socket.nickname);
        io.emit('update users', Object.values(users));
    });

    socket.on('chat message', (msg) => {
        if (socket.nickname) {
            io.emit('chat message', {
                nick: socket.nickname,
                text: msg
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.nickname) {
            delete users[socket.id];
            io.emit('user left', socket.nickname);
            io.emit('update users', Object.values(users));
        }
        console.log('Пользователь отключился');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
