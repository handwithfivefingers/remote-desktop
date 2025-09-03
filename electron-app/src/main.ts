import { app, BrowserWindow, desktopCapturer, ipcMain, Menu, screen } from "electron";
import path from "path";
import { io } from "socket.io-client";
import { InputController } from "./inputController";
const socket = io("https://d09053434fdb.ngrok-free.app/remote-ctrl");

let availableScreens: any[] = [];
let mainWindow: BrowserWindow;
let clientSelectedScreen: any;
let displays: any;

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

  ipcMain.handle("screens", () => {
    return availableScreens;
  });

  ipcMain.on("selectedScreen", (event, screenId: string) => {
    // clientSelectedScreen = selectedScreen;
    const activeScreen = availableScreens.find((screen) => screen.id === screenId);
    sendSelectedScreen(activeScreen);
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
  const ipController = new InputController();
  socket.on("selectedScreen", (selectedScreen) => {
    clientSelectedScreen = selectedScreen;
    console.log("selectedScreen", clientSelectedScreen);
  });
  socket.on("mouse_move", async ({ clientX, clientY, clientWidth, clientHeight }) => {
    const {
      displaySize: { width, height },
    } = clientSelectedScreen;
    const ratioX = width / clientWidth;
    const ratioY = height / clientHeight;
    const hostX = clientX * ratioX;
    const hostY = clientY * ratioY;
    ipController.mouseMove(hostX, hostY);
  });
  socket.on("mouse_click", ({ button }) => {
    ipController.mouseClick(button);
  });
  socket.on("key_press", ({ button }) => {
    ipController.keyPress(button);
  });
  socket.on("key_combo", ({ keys }) => {
    ipController.keyCombo(keys);
  });
  socket.on("mouse_scroll", ({ keys }) => {
    ipController.mouseScroll(keys);
  });
};

app.on("ready", () => {
  createWindow();
});
