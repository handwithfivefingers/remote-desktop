from flask import Flask
from flask_socketio import SocketIO
from pynput.mouse import Controller as MouseController, Button
from pynput.keyboard import Controller as KeyboardController, Key

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

mouse = MouseController()
keyboard = KeyboardController()

# --- WebSocket Events ---
@socketio.on("mouseMove")
def handle_mouse_move(data):
    x, y = data.get("x"), data.get("y")
    if x is not None and y is not None:
        mouse.position = (x, y)
        print(f"Moved mouse to: ({x}, {y})")

@socketio.on("mouseClick")
def handle_mouse_click(data):
    button = data.get("button", "left")
    if button == "left":
        mouse.click(Button.left, 1)
    elif button == "right":
        mouse.click(Button.right, 1)
    print(f"Clicked {button} mouse button")

@socketio.on("keyPress")
def handle_key_press(data):
    key = data.get("key")
    if key:
        try:
            # If it's a special key
            if hasattr(Key, key):
                keyboard.press(getattr(Key, key))
                keyboard.release(getattr(Key, key))
            else:
                keyboard.type(key)
            print(f"Pressed key: {key}")
        except Exception as e:
            print(f"Error pressing key {key}: {e}")

# --- Run Server ---
if __name__ == "__main__":
    print("🎮 Input Service Running on ws://localhost:5001")
    socketio.run(app, host="0.0.0.0", port=5001)
