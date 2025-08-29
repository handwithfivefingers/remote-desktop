# from flask import Flask
# from flask_socketio import SocketIO
# from pynput.mouse import Controller as MouseController, Button
# from pynput.keyboard import Controller as KeyboardController, Key

# app = Flask(__name__)
# socketio = SocketIO(app, cors_allowed_origins="*")

# mouse = MouseController()
# keyboard = KeyboardController()

# # --- WebSocket Events ---
# @socketio.on("mouseMove")
# def handle_mouse_move(data):
#     x, y = data.get("x"), data.get("y")
#     if x is not None and y is not None:
#         mouse.position = (x, y)
#         print(f"Moved mouse to: ({x}, {y})")

# @socketio.on("mouseClick")
# def handle_mouse_click(data):
#     button = data.get("button", "left")
#     if button == "left":
#         mouse.click(Button.left, 1)
#     elif button == "right":
#         mouse.click(Button.right, 1)
#     print(f"Clicked {button} mouse button")

# @socketio.on("keyPress")
# def handle_key_press(data):
#     key = data.get("key")
#     if key:
#         try:
#             # If it's a special key
#             if hasattr(Key, key):
#                 keyboard.tap(getattr(Key, key))
#             elif key == "Backspace":
#                 keyboard.tap(Key.backspace)
#             else:
#                 keyboard.type(key)
#             print(f"Pressed key: {key}")
#         except Exception as e:
#             print(f"Error pressing key {key}: {e}")

# # --- Run Server ---
# if __name__ == "__main__":
#     print("🎮 Input Service Running on ws://localhost:5001")
#     socketio.run(app, host="0.0.0.0", port=5001)



from flask import Flask
from flask_socketio import SocketIO
from pynput.mouse import Controller as MouseController, Button
from pynput.keyboard import Controller as KeyboardController, Key
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize controllers
mouse = MouseController()
keyboard = KeyboardController()

class InputService:
    """Handles mouse and keyboard input operations"""
    
    @staticmethod
    def move_mouse(x, y):
        """Move mouse to specified coordinates"""
        try:
            if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
                raise ValueError("Coordinates must be numeric")
            
            mouse.position = (int(x), int(y))
            logger.info(f"Mouse moved to: ({x}, {y})")
            return True
        except Exception as e:
            logger.error(f"Failed to move mouse: {e}")
            return False
    
    @staticmethod
    def click_mouse(button_name):
        """Click specified mouse button"""
        try:
            button_map = {
                "left": Button.left,
                "right": Button.right,
                "middle": Button.middle
            }
            
            button = button_map.get(button_name.lower())
            if not button:
                raise ValueError(f"Invalid button: {button_name}")
            
            mouse.click(button, 1)
            logger.info(f"Clicked {button_name} mouse button")
            return True
        except Exception as e:
            logger.error(f"Failed to click {button_name} button: {e}")
            return False
    
    @staticmethod
    def press_key(key_input):
        """Handle key press - supports all possible key combinations and cases"""
        try:
            if not key_input:
                raise ValueError("Key input cannot be empty")
            
            # Normalize input - convert to lowercase for comparison
            key_lower = key_input.lower().strip()
            
            # Comprehensive special key mappings (covers all common cases)
            special_keys = {
                # Backspace variations
                "backspace": Key.backspace,
                "back": Key.backspace,
                
                # Delete variations  
                "delete": Key.delete,
                "del": Key.delete,
                
                # Enter variations
                "enter": Key.enter,
                "return": Key.enter,
                "ret": Key.enter,
                
                # Tab variations
                "tab": Key.tab,
                
                # Space variations
                "space": Key.space,
                "spacebar": Key.space,
                " ": Key.space,
                
                # Escape variations
                "escape": Key.esc,
                "esc": Key.esc,
                
                # Arrow keys - all possible variations
                "arrowup": Key.up,
                "arrow_up": Key.up,
                "up": Key.up,
                "uparrow": Key.up,
                
                "arrowdown": Key.down,
                "arrow_down": Key.down,
                "down": Key.down,
                "downarrow": Key.down,
                
                "arrowleft": Key.left,
                "arrow_left": Key.left,
                "left": Key.left,
                "leftarrow": Key.left,
                
                "arrowright": Key.right,
                "arrow_right": Key.right,
                "right": Key.right,
                "rightarrow": Key.right,
                
                # Modifier keys
                "shift": Key.shift,
                "shiftleft": Key.shift_l,
                "shift_left": Key.shift_l,
                "shiftright": Key.shift_r,
                "shift_right": Key.shift_r,
                
                "ctrl": Key.ctrl,
                "control": Key.ctrl,
                "ctrlleft": Key.ctrl_l,
                "ctrl_left": Key.ctrl_l,
                "ctrlright": Key.ctrl_r,
                "ctrl_right": Key.ctrl_r,
                
                "alt": Key.alt,
                "altleft": Key.alt_l,
                "alt_left": Key.alt_l,
                "altright": Key.alt_r,
                "alt_right": Key.alt_r,
                "altgr": Key.alt_gr,
                
                "cmd": Key.cmd,
                "command": Key.cmd,
                "meta": Key.cmd,
                "windows": Key.cmd,
                "win": Key.cmd,
                "super": Key.cmd,
                
                # Lock keys
                "capslock": Key.caps_lock,
                "caps_lock": Key.caps_lock,
                "caps": Key.caps_lock,
                "numlock": Key.num_lock,
                "num_lock": Key.num_lock,
                "scrolllock": Key.scroll_lock,
                "scroll_lock": Key.scroll_lock,
                
                # Navigation keys
                "home": Key.home,
                "end": Key.end,
                "pageup": Key.page_up,
                "page_up": Key.page_up,
                "pgup": Key.page_up,
                "pagedown": Key.page_down,
                "page_down": Key.page_down,
                "pgdn": Key.page_down,
                
                # Function keys
                "f1": Key.f1, "f2": Key.f2, "f3": Key.f3, "f4": Key.f4,
                "f5": Key.f5, "f6": Key.f6, "f7": Key.f7, "f8": Key.f8,
                "f9": Key.f9, "f10": Key.f10, "f11": Key.f11, "f12": Key.f12,
                "f13": Key.f13, "f14": Key.f14, "f15": Key.f15, "f16": Key.f16,
                "f17": Key.f17, "f18": Key.f18, "f19": Key.f19, "f20": Key.f20,
                
                # Insert/Print Screen
                "insert": Key.insert,
                "ins": Key.insert,
                "printscreen": Key.print_screen,
                "print_screen": Key.print_screen,
                "prtsc": Key.print_screen,
                
                # Menu key
                "menu": Key.menu,
                "context": Key.menu,
                "contextmenu": Key.menu,
                
                # Pause/Break
                "pause": Key.pause,
                "break": Key.pause,
            }
            
            # Check special keys first
            if key_lower in special_keys:
                keyboard.tap(special_keys[key_lower])
                logger.info(f"Special key pressed: {key_input}")
                return True
            
            # Handle key codes (e.g., "Key.backspace", "Key.enter")
            if key_input.startswith("Key."):
                key_attr = key_input[4:].lower()
                if hasattr(Key, key_attr):
                    keyboard.tap(getattr(Key, key_attr))
                    logger.info(f"Key attribute pressed: {key_input}")
                    return True
            
            # Handle single characters or short strings
            if len(key_input) <= 3:
                keyboard.type(key_input)
                logger.info(f"Character(s) typed: {key_input}")
                return True
            
            # For longer strings, type them as text
            keyboard.type(key_input)
            logger.info(f"Text typed: {key_input}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to press key '{key_input}': {e}")
            return False

# --- WebSocket Event Handlers ---
@socketio.on("connect")
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected")

@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected")

@socketio.on("mouseMove")
def handle_mouse_move(data):
    """Handle mouse movement events"""
    if not isinstance(data, dict):
        logger.warning("Invalid mouse move data format")
        return
    
    x = data.get("x")
    y = data.get("y")
    
    if x is None or y is None:
        logger.warning("Missing x or y coordinates in mouse move data")
        return
    
    success = InputService.move_mouse(x, y)
    if not success:
        socketio.emit("error", {"message": "Failed to move mouse"})

@socketio.on("mouseClick")
def handle_mouse_click(data):
    """Handle mouse click events"""
    if not isinstance(data, dict):
        logger.warning("Invalid mouse click data format")
        return
    
    button = data.get("button", "left")
    success = InputService.click_mouse(button)
    
    if not success:
        socketio.emit("error", {"message": f"Failed to click {button} button"})

@socketio.on("keyPress")
def handle_key_press(data):
    """Handle keyboard events"""
    if not isinstance(data, dict):
        logger.warning("Invalid key press data format")
        socketio.emit("error", {"message": "Invalid data format"})
        return
    
    key = data.get("key")
    if not key:
        logger.warning("No key specified in key press data")
        socketio.emit("error", {"message": "No key specified"})
        return
    
    success = InputService.press_key(key)
    if not success:
        socketio.emit("error", {"message": f"Failed to press key: {key}"})

@socketio.on("keyCombo")
def handle_key_combination(data):
    """Handle key combinations like Ctrl+C, Alt+Tab, etc."""
    if not isinstance(data, dict):
        logger.warning("Invalid key combo data format")
        socketio.emit("error", {"message": "Invalid data format"})
        return
    
    keys = data.get("keys", [])
    if not keys or not isinstance(keys, list):
        logger.warning("Invalid keys array in combo data")
        socketio.emit("error", {"message": "Invalid keys array"})
        return
    
    try:
        # Convert string keys to Key objects
        key_objects = []
        for key_str in keys:
            key_lower = key_str.lower().strip()
            
            # Map common modifier names
            modifier_map = {
                "ctrl": Key.ctrl, "control": Key.ctrl,
                "alt": Key.alt,
                "shift": Key.shift,
                "cmd": Key.cmd, "command": Key.cmd, "meta": Key.cmd,
                "win": Key.cmd, "windows": Key.cmd
            }
            
            if key_lower in modifier_map:
                key_objects.append(modifier_map[key_lower])
            elif hasattr(Key, key_lower):
                key_objects.append(getattr(Key, key_lower))
            elif len(key_str) == 1:
                key_objects.append(key_str.lower())
            else:
                raise ValueError(f"Unknown key: {key_str}")
        
        # Press all keys simultaneously
        with keyboard.pressed(*key_objects):
            pass  # Keys are pressed and released automatically
        
        logger.info(f"Key combination pressed: {'+'.join(keys)}")
        
    except Exception as e:
        logger.error(f"Failed to press key combination {keys}: {e}")
        socketio.emit("error", {"message": f"Failed to press key combination: {'+'.join(keys)}"})

@socketio.on("type")
def handle_type_text(data):
    """Handle text typing events"""
    if not isinstance(data, dict):
        logger.warning("Invalid type data format")
        socketio.emit("error", {"message": "Invalid data format"})
        return
    
    text = data.get("text")
    if text is None:  # Allow empty strings
        logger.warning("No text specified in type data")
        socketio.emit("error", {"message": "No text specified"})
        return
    
    try:
        keyboard.type(str(text))
        logger.info(f"Text typed: '{text}' ({len(text)} characters)")
    except Exception as e:
        logger.error(f"Failed to type text '{text}': {e}")
        socketio.emit("error", {"message": f"Failed to type text: {text}"})

# --- Error Handlers ---
@socketio.on_error_default
def default_error_handler(e):
    """Handle WebSocket errors"""
    logger.error(f"WebSocket error: {e}")

# --- Health Check Route ---
@app.route("/health")
def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "service": "input-service"}, 200

@app.route("/keys")
def list_supported_keys():
    """Return all supported key mappings for debugging"""
    special_keys = {
        # Backspace variations
        "backspace": "Key.backspace",
        "back": "Key.backspace",
        
        # Delete variations  
        "delete": "Key.delete",
        "del": "Key.delete",
        
        # Enter variations
        "enter": "Key.enter",
        "return": "Key.enter",
        "ret": "Key.enter",
        
        # Tab variations
        "tab": "Key.tab",
        
        # Space variations
        "space": "Key.space",
        "spacebar": "Key.space",
        
        # Escape variations
        "escape": "Key.esc",
        "esc": "Key.esc",
        
        # Arrow keys - all possible variations
        "arrowup": "Key.up", "arrow_up": "Key.up", "up": "Key.up", "uparrow": "Key.up",
        "arrowdown": "Key.down", "arrow_down": "Key.down", "down": "Key.down", "downarrow": "Key.down",
        "arrowleft": "Key.left", "arrow_left": "Key.left", "left": "Key.left", "leftarrow": "Key.left",
        "arrowright": "Key.right", "arrow_right": "Key.right", "right": "Key.right", "rightarrow": "Key.right",
        
        # Modifier keys
        "shift": "Key.shift", "shiftleft": "Key.shift_l", "shiftright": "Key.shift_r",
        "ctrl": "Key.ctrl", "control": "Key.ctrl", "ctrlleft": "Key.ctrl_l", "ctrlright": "Key.ctrl_r",
        "alt": "Key.alt", "altleft": "Key.alt_l", "altright": "Key.alt_r", "altgr": "Key.alt_gr",
        "cmd": "Key.cmd", "command": "Key.cmd", "meta": "Key.cmd", "windows": "Key.cmd", "win": "Key.cmd",
        
        # Lock keys
        "capslock": "Key.caps_lock", "caps_lock": "Key.caps_lock", "caps": "Key.caps_lock",
        "numlock": "Key.num_lock", "num_lock": "Key.num_lock",
        "scrolllock": "Key.scroll_lock", "scroll_lock": "Key.scroll_lock",
        
        # Navigation keys
        "home": "Key.home", "end": "Key.end",
        "pageup": "Key.page_up", "page_up": "Key.page_up", "pgup": "Key.page_up",
        "pagedown": "Key.page_down", "page_down": "Key.page_down", "pgdn": "Key.page_down",
        
        # Function keys
        "f1": "Key.f1", "f2": "Key.f2", "f3": "Key.f3", "f4": "Key.f4",
        "f5": "Key.f5", "f6": "Key.f6", "f7": "Key.f7", "f8": "Key.f8",
        "f9": "Key.f9", "f10": "Key.f10", "f11": "Key.f11", "f12": "Key.f12",
        "f13": "Key.f13", "f14": "Key.f14", "f15": "Key.f15", "f16": "Key.f16",
        "f17": "Key.f17", "f18": "Key.f18", "f19": "Key.f19", "f20": "Key.f20",
        
        # Insert/Print Screen
        "insert": "Key.insert", "ins": "Key.insert",
        "printscreen": "Key.print_screen", "print_screen": "Key.print_screen", "prtsc": "Key.print_screen",
        
        # Menu key
        "menu": "Key.menu", "context": "Key.menu", "contextmenu": "Key.menu",
        
        # Pause/Break
        "pause": "Key.pause", "break": "Key.pause",
    }
    
    return {
        "supported_keys": special_keys,
        "note": "All keys are case-insensitive. Single characters and text strings are also supported.",
        "examples": {
            "arrow_keys": ["Up", "down", "LEFT", "right", "ArrowUp", "arrow_down"],
            "modifiers": ["ctrl", "shift", "alt", "cmd"],
            "combinations": "Use keyCombo event with keys array: ['ctrl', 'c']",
            "text": "Any single character or string will be typed normally"
        }
    }, 200

# --- Main Server ---
if __name__ == "__main__":
    try:
        logger.info("🎮 Input Service starting...")
        logger.info("📡 WebSocket server: ws://localhost:5001")
        logger.info("🔗 Health check: http://localhost:5001/health")
        
        socketio.run(
            app, 
            host="0.0.0.0", 
            port=5001,
            debug=False,  # Set to True for development
            allow_unsafe_werkzeug=True  # For development only
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
    except KeyboardInterrupt:
        logger.info("Server stopped by user")