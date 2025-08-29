import cors from "cors";
import { app, BrowserWindow, desktopCapturer, ipcMain, Menu, screen } from "electron";
import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { InputController } from "./inputController";
const expressApp = express();
let availableScreens: any[] = [];
let mainWindow: BrowserWindow;
let clientSelectedScreen: any;
let displays: any;
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

const httpServer = http.createServer(expressApp);
httpServer.listen(4000, "0.0.0.0");
httpServer.on("error", (e) => console.log("error"));
httpServer.on("listening", () => console.log("listening....."));
const io = new Server(httpServer, {
  origin: "*",
} as any);

const connections = io.of("/remote-ctrl");

connections.on("connection", async (socket) => {
  console.log("connection established");
  const ipController = new InputController();
  socket.on("offer", (sdp) => {
    console.log("routing offer");
    // send to the electron app
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
    clientSelectedScreen = selectedScreen;

    socket.broadcast.emit("selectedScreen", clientSelectedScreen);
  });

  socket.on("mouse_move", async ({ clientX, clientY, clientWidth, clientHeight }) => {
    const {
      displaySize: { width, height },
    } = clientSelectedScreen;
    const ratioX = width / clientWidth;
    const ratioY = height / clientHeight;

    const hostX = clientX * ratioX;
    const hostY = clientY * ratioY;
    console.log("mouseMoved", hostX, hostY);
    ipController.mouseMove(hostX, hostY);
  });

  socket.on("mouse_click", ({ button }) => {
    console.log("mouseClicked");
    ipController.mouseClick(button);
  });

  socket.on("keyPress", ({ button }) => {
    console.log("keyPress", button);
    ipController.keyPress(button);
  });
});

const sendSelectedScreen = (item: any) => {
  const displaySize = displays.filter((display: any) => `${display.id}` === item.display_id)[0].size;

  mainWindow.webContents.send("SET_SOURCE_ID", {
    id: item.id,
    displaySize,
  });
};

const createTray = () => {
  const screensMenu = availableScreens.map((item) => {
    return {
      label: item.name,
      click: () => {
        sendSelectedScreen(item);
      },
    };
  });

  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [{ role: "quit" }],
    },
    {
      label: "Screens",
      submenu: screensMenu,
    },
  ]);

  Menu.setApplicationMenu(menu);
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  ipcMain.on("set-size", (event, size) => {
    const { width, height } = size;
    try {
      console.log("electron dim..", width, height);
      // mainWindow.setSize(width, height || 500, true)
      !isNaN(height) && mainWindow.setSize(width, height, false);
    } catch (e) {
      console.log(e);
    }
  });

  mainWindow.loadURL("http://localhost:3333");
  mainWindow.once("ready-to-show", () => {
    displays = screen.getAllDisplays();

    mainWindow.show();
    mainWindow.setPosition(0, 0);

    desktopCapturer
      .getSources({
        types: ["screen"],
        // types: ['window', 'screen']
      })
      .then((sources) => {
        sendSelectedScreen(sources[0]);
        availableScreens = sources;
        createTray();
      });
  });

  mainWindow.webContents.openDevTools();
};

app.on("ready", () => {
  createWindow();
});
