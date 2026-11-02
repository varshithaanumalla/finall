import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO for real-time watch party
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Socket.IO connection handling for Watch Party
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Remember which rooms this socket is in so we can notify peers on an
  // unexpected disconnect (tab close), not just an explicit "leave-party".
  const joinedRooms = new Set();

  // Helper: send an event to a specific target socket if provided, otherwise
  // broadcast to everyone else in the room.
  const relay = (data, event, payload) => {
    if (data && data.target) {
      io.to(data.target).emit(event, payload);
    } else if (data && data.roomId) {
      socket.to(data.roomId).emit(event, payload);
    }
  };

  // Join a watch party room
  socket.on("join-party", (roomId) => {
    socket.join(roomId);
    joinedRooms.add(roomId);
    console.log(`Socket ${socket.id} joined party ${roomId}`);
    socket.to(roomId).emit("user-joined", { socketId: socket.id });
  });

  // WebRTC signaling: offer
  socket.on("offer", (data) => {
    relay(data, "offer", { offer: data.offer, sender: socket.id });
  });

  // WebRTC signaling: answer
  socket.on("answer", (data) => {
    relay(data, "answer", { answer: data.answer, sender: socket.id });
  });

  // WebRTC signaling: ICE candidate
  socket.on("ice-candidate", (data) => {
    relay(data, "ice-candidate", { candidate: data.candidate, sender: socket.id });
  });

  // Chat message in party
  socket.on("party-message", (data) => {
    socket.to(data.roomId).emit("party-message", {
      name: data.name,
      text: data.text,
      sender: socket.id,
    });
  });

  // Screen sharing signaling
  socket.on("screen-share-start", (data) => {
    socket.to(data.roomId).emit("screen-share-start", { sender: socket.id });
  });

  socket.on("screen-share-stop", (data) => {
    socket.to(data.roomId).emit("screen-share-stop", { sender: socket.id });
  });

  // Video playback sync
  socket.on("play", (data) => {
    socket.to(data.roomId).emit("play", { time: data.time, sender: socket.id });
  });

  socket.on("pause", (data) => {
    socket.to(data.roomId).emit("pause", { time: data.time, sender: socket.id });
  });

  socket.on("seek", (data) => {
    socket.to(data.roomId).emit("seek", { time: data.time, sender: socket.id });
  });

  // Leave party
  socket.on("leave-party", (roomId) => {
    socket.leave(roomId);
    joinedRooms.delete(roomId);
    socket.to(roomId).emit("user-left", { socketId: socket.id });
  });

  // Toggle mute/camera
  socket.on("toggle-mute", (data) => {
    socket.to(data.roomId).emit("toggle-mute", {
      sender: socket.id,
      muted: data.muted,
    });
  });

  socket.on("toggle-camera", (data) => {
    socket.to(data.roomId).emit("toggle-camera", {
      sender: socket.id,
      cameraOff: data.cameraOff,
    });
  });

  socket.on("disconnecting", () => {
    // Rooms are still intact in the "disconnecting" phase, so notify peers.
    joinedRooms.forEach((roomId) => {
      socket.to(roomId).emit("user-left", { socketId: socket.id });
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });

export { app, httpServer, io };
