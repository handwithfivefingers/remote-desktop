import io from "socket.io-client";
import { InputController } from "./inputController";

const ipController = new InputController();
export class ScreenController {
  // mouseMove({
  //   clientX,
  //   clientY,
  //   clientWidth,
  //   clientHeight,
  //   clientSelectedScreen,
  // }: {
  //   clientX: number;
  //   clientY: number;
  //   clientHeight: number;
  //   clientWidth: number;
  //   clientSelectedScreen: any;
  // }) {
  //   const {
  //     displaySize: { width, height },
  //   } = clientSelectedScreen;
  //   const ratioX = width / clientWidth;
  //   const ratioY = height / clientHeight;
  //   const hostX = clientX * ratioX;
  //   const hostY = clientY * ratioY;
  //   console.log("mouseMoved", hostX, hostY);
  //   InputController.mouseMove(hostX, hostY);
  //   socket.emit("mouse_move", {
  //     clientX,
  //     clientY,
  //     clientWidth,
  //     clientHeight,
  //   });
  // }
}
