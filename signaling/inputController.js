import io from "socket.io-client";
const socket = io("http://localhost:5001");
// // Move mouse
// socket.emit("mouseMove", { x: 300, y: 400 });

// // Click
// socket.emit("mouseClick", { button: "left" });

// // Press key
// socket.emit("keyPress", { key: "a" }); // types 'a'
// socket.emit("keyPress", { key: "enter" }); // presses Enter

export class InputController {
  mouseMove(x, y) {
    socket.emit("mouseMove", { x, y });
  }
  mouseClick(button) {
    socket.emit("mouseClick", { button });
  }
  mouseScroll({ direction, amount }) {
    socket.emit("mouseClick", { direction, amount });
  }
  keyPress(key) {
    socket.emit("keyPress", { key });
  }
}
