import { io, Socket } from "socket.io-client";

interface EventData {
  type: "mousemove" | "mousedown" | "mouseup" | "wheel" | "keydown" | "keyup";
  x?: number;
  y?: number;
  movementX?: number;
  movementY?: number;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
  clientX?: number;
  clientY?: number;
  key?: string;
  code?: string;
  keyCode?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  isDragging?: boolean;
  dragType?: string | null;
  timestamp: number;
}

class InputController {
  pressedKeys = new Set<string>();
  mousePos = { x: 0, y: 0 };
  // socket: Socket = io("http://172.16.52.150:5001");
  socket: Socket = io("https://crazy-hairs-relate.loca.lt", {
    // extraHeaders: {
    //   "Bypass-Tunnel-Reminder": "yup",
    // },
  });
  isCapturing = false;
  eventCount = 0;
  mouseDownInfo: { x: number; y: number; timestamp: number } | null = null;
  dragState: null | { isDragging: boolean } = {
    isDragging: false,
    // dragButton: -1,
    // startX: 0,
    // startY: 0,
    // currentX: 0,
    // currentY: 0,
    // dragStartTime: 0,
    // dragThreshold: 3, // pixels to move before considering it a drag
    // dragType: "unknown", // 'text', 'element', 'unknown'
  };
  constructor() {
    // this.socket = io(url);
    this.socket.connect();
    this.socket.on("connect", () => {
      console.log("connected");
    });
  }

  log = (message: string) => {
    console.log(message);
  };

  clearStats = () => {
    this.eventCount = 0;
    this.pressedKeys.clear();
    this.mousePos = { x: 0, y: 0 };
    this.updateStats();
  };

  updateStats = () => {};

  sendEvent = (eventData: EventData) => {
    if (this.socket) {
      this.socket.emit("event", eventData);
      this.eventCount = this.eventCount + 1;
      console.log("this.socket", this.socket);
      console.log("eventData", eventData);
      return true;
    }
    return false;
  };

  onMouseMove = ({
    clientX,
    clientY,
    movementX,
    movementY,
    hostX,
    hostY,
  }: {
    hostX: number;
    hostY: number;
    clientX: number;
    clientY: number;
    movementX?: number;
    movementY?: number;
  }) => {
    if (this.mouseDownInfo) {
      const deltaX = clientX - this.mouseDownInfo.x;
      const deltaY = clientY - this.mouseDownInfo.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      console.log("distances", distance);
      // this.dragState.isDragging = true;
      // this.dragState?.isDragging = true;
      if (!this.dragState) {
        this.dragState = {
          isDragging: true,
        };
      }
    }
    this.mousePos.x = hostX;
    this.mousePos.y = hostY;
    const eventData: EventData = {
      type: "mousemove",
      x: this.mousePos.x,
      y: this.mousePos.y,
      movementX: movementX || 0,
      movementY: movementY || 0,
      clientX: clientX,
      clientY: clientY,
      isDragging: this.dragState?.isDragging,
      timestamp: Date.now(),
    };
    this.sendEvent(eventData);
  };

  onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    this.mouseDownInfo = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
    };
    const eventData: EventData = {
      type: "mousedown",
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
    };
    this.sendEvent(eventData);
  };

  onMouseUp = (e: React.MouseEvent) => {
    // if (!isCapturing) return;
    e.preventDefault();
    // // End drag if in progress
    // if (dragState.isDragging && e.button === dragState.dragButton) {
    //   endDrag(e.clientX, e.clientY);
    // }
    this.mouseDownInfo = null;
    this.dragState = null;
    const eventData: EventData = {
      type: "mouseup",
      //   button: e.button,
      x: e.clientX,
      y: e.clientY,
      //   wasDragging: dragState.isDragging,
      timestamp: Date.now(),
    };
    this.sendEvent(eventData);
  };

  onMouseWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const eventData: EventData = {
      type: "wheel",
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      deltaZ: e.deltaZ,
      timestamp: Date.now(),
    };
    this.sendEvent(eventData);
  };

  onKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();
    this.pressedKeys.add(e.key);
    const eventData: EventData = {
      type: "keydown",
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      timestamp: Date.now(),
    };
    this.sendEvent(eventData);
  };

  onKeyUp = (e: KeyboardEvent) => {
    e.preventDefault();
    this.pressedKeys.add(e.key);
    const eventData: EventData = {
      type: "keyup",
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      timestamp: Date.now(),
    };
    this.sendEvent(eventData);
  };
}

export { InputController };
