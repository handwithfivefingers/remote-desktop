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

connections.on("connection", async (socket) => {
  console.log("connection established");
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

  //   socket.on("mouse_click", ({ button }) => {
  //     console.log("mouseClicked");
  //     ipController.mouseClick(button);
  //   });

  //   socket.on("keyPress", ({ button }) => {
  //     console.log("keyPress", button);
  //     ipController.keyPress(button);
  //   });
});
