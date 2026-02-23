import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";

dotenv.config();

const PORT = process.env.PORT;
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from server");
});
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(cookieParser());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
console.log("Serving uploads from:", path.join(process.cwd(), "uploads"));

//admin
app.use("/api/admin", adminRouter);
//student
// app.use("/api/student",adminRouter)
//auth
app.use("/api/auth", authRouter);

//creating http server
const httpServer = http.createServer(app);

//Attach soket io

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

//soket events

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_conversation", ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  socket.on("message_saved", ({ conversationId, message }) => {
    io.to(String(conversationId)).emit("new_message", message);
  });


  socket.on("send_message", (payload) => {
    // payload = { conversationId, text, senderId }
    const { conversationId } = payload || {};
    if (!conversationId) return;

    // broadcast to room (both users)
    io.to(conversationId).emit("new_message", payload);
 });
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

connectDB().then(() => {
  httpServer.listen(PORT || 5100, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
});

export { io };