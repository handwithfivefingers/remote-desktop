import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
const expressApp = express();
let clientSelectedScreen;
const dirname = path.join(path.resolve(), "dist");
expressApp.use(express.static(dirname));
const ls = path.join(dirname, "index.html");

console.log("Current path", ls);
expressApp.get("/", function (req, res, next) {
  res.sendFile(ls);
  // res.status(200);
});

expressApp.set("port", 4000);
expressApp.use(
  cors({
    origin: "*",
  })
);

expressApp.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  // res.setHeader("Access-Control-Allow-Credentials", true as any);
  next();
});

const httpServer = http.createServer(expressApp, {});
httpServer.listen(4000, "0.0.0.0");
httpServer.on("error", (e) => console.log("error"));
httpServer.on("listening", () => console.log("listening....."));
const io = new Server(httpServer, {
  // origin: ["*"], // Replace with your client's local development URL,
});

const connections = io.of("/remote-ctrl");

let lastPing = null;

connections.on("connection", async (socket) => {
  console.log("connection established");

  function sendPing() {
    lastPing = Date.now();
    socket.emit("ping_check", lastPing);
  }

  setInterval(sendPing, 500);

  socket.on("offer", (sdp) => {
    console.log("routing offer");
    socket.broadcast.emit("offer", sdp);
  });

  socket.on("answer", (sdp) => {
    console.log("routing answer");
    // send to the electron app
    socket.broadcast.emit("answer", sdp);
  });

  socket.on("icecandidate", (icecandidate) => {
    socket.broadcast.emit("icecandidate", icecandidate);
  });

  socket.on("selectedScreen", (selectedScreen) => {
    console.log("selectedScreen", clientSelectedScreen);
    clientSelectedScreen = selectedScreen;
    socket.broadcast.emit("selectedScreen", clientSelectedScreen);
  });

  socket.on("mouse_move", async ({ clientX, clientY, clientWidth, clientHeight }) => {
    console.log("mouse_move", clientX, clientY, clientWidth, clientHeight);
    socket.broadcast.emit("mouse_move", { clientX, clientY, clientWidth, clientHeight });
  });
  socket.on("close", () => {
    socket.broadcast.emit("close");
  });

  socket.on("mouse_click", ({ button }) => {
    console.log("mouseClicked", button);
    socket.broadcast.emit("mouse_click", { button });
  });

  socket.on("key_press", ({ button }) => {
    console.log("key_press", button);
    socket.broadcast.emit("key_press", { button });
  });
  
  socket.on("key_combo", ({ button }) => {
    console.log("key_combo", button);
    socket.broadcast.emit("key_combo", { button });
  });
});
