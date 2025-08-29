import io from "socket.io-client";
const socket = io("http://localhost:5001");
// // Move mouse
// socket.emit("mouseMove", { x: 300, y: 400 });

// // Click
// socket.emit("mouseClick", { button: "left" });

// // Press key
// socket.emit("keyPress", { key: "a" }); // types 'a'
// socket.emit("keyPress", { key: "enter" }); // presses Enter

interface IMouseScrollOptions {
  direction: "up" | "down";
  amount: number;
}
export class InputController {
  mouseMove(x: number, y: number) {
    socket.emit("mouseMove", { x, y });
  }
  mouseClick(button: string) {
    socket.emit("mouseClick", { button });
  }
  mouseScroll(options: IMouseScrollOptions) {
    socket.emit("mouseScroll", options);
  }
  keyPress(key: string) {
    socket.emit("keyPress", { key });
  }
  keyCombo(keys: string[]) {
    socket.emit("keyCombo", { keys });
  }
  type(text: string) {
    socket.emit("type", { text });
  }
}
