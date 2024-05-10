const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const getRecieverSocketId = (username) => {
    return userSocketMap[username];
}

const userSocketMap = {};

io.on("connection", (socket) => {
    const username = socket.handshake.query.username;

    if (username) {
        console.log(`Created socket connection for ${username}: ${socket.id}`);
        userSocketMap[username] = socket.id;

        socket.on("calling", (data) => {
            console.log(data);

            const memberIds = JSON.parse(data.memberIds);
            const memberSocketIds = memberIds.map(memberId => userSocketMap[memberId]);
            memberSocketIds.forEach(memberSocketId => {
                if (memberSocketId && memberSocketId !== socket.id) {
                    io.to(memberSocketId).emit("someone_calling", {
                        caller: username,
                        callType: data.callType,
                        isGroup: data.isGroup,
                        name: data.name,
                        image: data.image,
                        callId: data.callId
                    });
                    console.log(`Ringing call to ${memberSocketId}`);
                }
            });
        })

        socket.on("disconnect", () => {
            console.log(`${username} disconnected: ${socket.id}`);
            if (socket.id === userSocketMap[username])
                delete userSocketMap[username];
        });
    }
});

module.exports = { app, io, server, getRecieverSocketId };