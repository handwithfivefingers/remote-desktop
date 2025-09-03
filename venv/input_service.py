from flask import Flask
from flask_socketio import SocketIO
from pynput.mouse import Controller as MouseController, Button
from pynput.keyboard import Controller as KeyboardController, Key
import logging
import pynput




# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize controllers
mouse = MouseController()
keyboard = KeyboardController()

# Optional: Import libraries for actual system control
try:
    import pyautogui
    PYAUTOGUI_AVAILABLE = True
    # Disable pyautogui failsafe for demonstration
    pyautogui.FAILSAFE = False
except ImportError:
    PYAUTOGUI_AVAILABLE = False
    print("PyAutoGUI not installed. Install with: pip install pyautogui")

try:
    
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False
    print("Pynput not installed. Install with: pip install pynput")


class InputHandler:
    """Handles incoming input events and optionally executes them"""
    
    def __init__(self, execute_inputs=False):
        self.execute_inputs = execute_inputs
        self.event_count = 0
        self.mouse_position = (0, 0)
        self.pressed_keys = set()
        self.mouse_controller = mouse
        self.keyboard_controller = keyboard
        
    def handle_event(self,event_data):
        """Process an input event"""
        event_type = event_data.get('type')
        timestamp = event_data.get('timestamp', 0)
        
        logger.info(f"Event: {event_type}")
        
        try:
            if event_type == 'mousemove':
                self._handle_mousemove(event_data)
            elif event_type == 'mousedown':
                self._handle_mousedown(event_data)
            elif event_type == 'mouseup':
                self._handle_mouseup(event_data)
            elif event_type == 'wheel':
                self._handle_wheel(event_data)
            elif event_type == 'keydown':
                self._handle_keydown(event_data)
            elif event_type == 'keyup':
                self._handle_keyup(event_data)
            else:
                logger.warning(f"Unknown event type: {event_type}")
                
        except Exception as e:
            logger.error(f"Error handling {event_type} event: {e}")
    
    def _handle_mousemove(self, event_data):
        """Handle mouse movement"""
        x = event_data.get('x', 0)
        y = event_data.get('y', 0)
        movement_x = event_data.get('movementX', 0)
        movement_y = event_data.get('movementY', 0)
        
        # Update tracked position
        if movement_x != 0 or movement_y != 0:
            # Use relative movement (from pointer lock)
            new_x = self.mouse_position[0] + movement_x
            new_y = self.mouse_position[1] + movement_y
        else:
            # Use absolute position
            new_x, new_y = x, y
            
        self.mouse_position = (new_x, new_y)
        
        print(f"Mouse: ({new_x}, {new_y}) [Δ{movement_x}, Δ{movement_y}]")
        
        # Execute if enabled
        if self.execute_inputs and self.mouse_controller:
            try:
                if movement_x != 0 or movement_y != 0:
                    # Use relative movement
                    self.move_mouse(movement_x, movement_y)
                else:
                    # Use absolute positioning
                    self.mouse_controller.position = (new_x, new_y)
            except Exception as e:
                logger.error(f"Failed to move mouse: {e}")
    
    def _handle_mousedown(self, event_data):
        """Handle mouse button press"""
        button = event_data.get('button', 0)
        x = event_data.get('x', 0)
        y = event_data.get('y', 0)
        
        button_names = {0: 'Left', 1: 'Middle', 2: 'Right'}
        button_name = button_names.get(button, f'Button{button}')
        
        print(f"Mouse Down: {button_name} at ({x}, {y})")
        
        # Execute if enabled
        if self.execute_inputs and self.mouse_controller:
            try:
                pynput_buttons = {
                    0: pynput.mouse.Button.left,
                    1: pynput.mouse.Button.middle,
                    2: pynput.mouse.Button.right
                }
                pynput_button = pynput_buttons.get(button, pynput.mouse.Button.left)
                self.mouse_controller.press(pynput_button)
            except Exception as e:
                logger.error(f"Failed to press mouse button: {e}")
    
    def _handle_mouseup(self, event_data):
        """Handle mouse button release"""
        button = event_data.get('button', 0)
        x = event_data.get('x', 0)
        y = event_data.get('y', 0)
        
        button_names = {0: 'Left', 1: 'Middle', 2: 'Right'}
        button_name = button_names.get(button, f'Button{button}')
        
        print(f"Mouse Up: {button_name} at ({x}, {y})")
        
        # Execute if enabled
        if self.execute_inputs and self.mouse_controller:
            try:
                pynput_buttons = {
                    0: pynput.mouse.Button.left,
                    1: pynput.mouse.Button.middle,
                    2: pynput.mouse.Button.right
                }
                pynput_button = pynput_buttons.get(button, pynput.mouse.Button.left)
                self.mouse_controller.release(pynput_button)
            except Exception as e:
                logger.error(f"Failed to release mouse button: {e}")
    
    def _handle_wheel(self, event_data):
        """Handle mouse wheel"""
        delta_x = event_data.get('deltaX', 0)
        delta_y = event_data.get('deltaY', 0)
        
        print(f"Mouse Wheel: X={delta_x}, Y={delta_y}")
        
        # Execute if enabled
        if self.execute_inputs and self.mouse_controller:
            try:
                # Convert web wheel delta to scroll units
                scroll_x = -delta_x / 100
                scroll_y = -delta_y / 100
                self.mouse_controller.scroll(scroll_x, scroll_y)
            except Exception as e:
                logger.error(f"Failed to scroll: {e}")
    
    def _handle_keydown(self, event_data):
        """Handle key press"""
        key = event_data.get('key', '')
        code = event_data.get('code', '')
        ctrl_key = event_data.get('ctrlKey', False)
        shift_key = event_data.get('shiftKey', False)
        alt_key = event_data.get('altKey', False)
        meta_key = event_data.get('metaKey', False)
        
        self.pressed_keys.add(key)
        
        modifiers = []
        if ctrl_key: modifiers.append('Ctrl')
        if shift_key: modifiers.append('Shift')
        if alt_key: modifiers.append('Alt')
        if meta_key: modifiers.append('Meta')
        
        modifier_str = '+'.join(modifiers)
        full_key = f"{modifier_str}+{key}" if modifiers else key
        
        print(f"Key Down: {full_key} (code: {code})")
        
        # Execute if enabled
        if self.execute_inputs and self.keyboard_controller:
            try:
                self._press_key(key, ctrl_key, shift_key, alt_key, meta_key)
            except Exception as e:
                logger.error(f"Failed to press key: {e}")
    
    def _handle_keyup(self, event_data):
        """Handle key release"""
        key = event_data.get('key', '')
        code = event_data.get('code', '')
        
        self.pressed_keys.discard(key)
        
        print(f"Key Up: {key} (code: {code})")
        
        # Execute if enabled
        if self.execute_inputs and self.keyboard_controller:
            try:
                self._release_key(key)
            except Exception as e:
                logger.error(f"Failed to release key: {e}")
    
    def _press_key(self, key, ctrl=False, shift=False, alt=False, meta=False):
        """Convert web key to pynput key and press it"""
        if not self.keyboard_controller:
            return
            
        # Map common keys
        key_mapping = {
            ' ': pynput.keyboard.Key.space,
            'Enter': pynput.keyboard.Key.enter,
            'Escape': pynput.keyboard.Key.esc,
            'Backspace': pynput.keyboard.Key.backspace,
            'Tab': pynput.keyboard.Key.tab,
            'Delete': pynput.keyboard.Key.delete,
            'ArrowUp': pynput.keyboard.Key.up,
            'ArrowDown': pynput.keyboard.Key.down,
            'ArrowLeft': pynput.keyboard.Key.left,
            'ArrowRight': pynput.keyboard.Key.right,
            'Home': pynput.keyboard.Key.home,
            'End': pynput.keyboard.Key.end,
            'PageUp': pynput.keyboard.Key.page_up,
            'PageDown': pynput.keyboard.Key.page_down,
            'Control': pynput.keyboard.Key.ctrl,
            'Shift': pynput.keyboard.Key.shift,
            'Alt': pynput.keyboard.Key.alt,
            'Meta': pynput.keyboard.Key.cmd,
        }
        
        # Handle function keys
        if key.startswith('F') and len(key) <= 3:
            try:
                f_num = int(key[1:])
                if 1 <= f_num <= 12:
                    pynput_key = getattr(pynput.keyboard.Key, f'f{f_num}')
                    self.keyboard_controller.press(pynput_key)
                    return
            except (ValueError, AttributeError):
                pass
        
        # Get the pynput key
        pynput_key = key_mapping.get(key, key)
        
        # Press modifiers first
        modifiers_pressed = []
        if ctrl and key != 'Control':
            self.keyboard_controller.press(pynput.keyboard.Key.ctrl)
            modifiers_pressed.append(pynput.keyboard.Key.ctrl)
        if shift and key != 'Shift':
            self.keyboard_controller.press(pynput.keyboard.Key.shift)
            modifiers_pressed.append(pynput.keyboard.Key.shift)
        if alt and key != 'Alt':
            self.keyboard_controller.press(pynput.keyboard.Key.alt)
            modifiers_pressed.append(pynput.keyboard.Key.alt)
        if meta and key != 'Meta':
            self.keyboard_controller.press(pynput.keyboard.Key.cmd)
            modifiers_pressed.append(pynput.keyboard.Key.cmd)
        
        # Press the main key
        self.keyboard_controller.press(pynput_key)
        
        # Store for release
        if not hasattr(self, '_pressed_modifiers'):
            self._pressed_modifiers = set()
        self._pressed_modifiers.update(modifiers_pressed)
    
    def _release_key(self, key):
        """Release a key"""
        if not self.keyboard_controller:
            return
            
        key_mapping = {
            ' ': pynput.keyboard.Key.space,
            'Enter': pynput.keyboard.Key.enter,
            'Escape': pynput.keyboard.Key.esc,
            'Backspace': pynput.keyboard.Key.backspace,
            'Tab': pynput.keyboard.Key.tab,
            'Delete': pynput.keyboard.Key.delete,
            'ArrowUp': pynput.keyboard.Key.up,
            'ArrowDown': pynput.keyboard.Key.down,
            'ArrowLeft': pynput.keyboard.Key.left,
            'ArrowRight': pynput.keyboard.Key.right,
            'Home': pynput.keyboard.Key.home,
            'End': pynput.keyboard.Key.end,
            'PageUp': pynput.keyboard.Key.page_up,
            'PageDown': pynput.keyboard.Key.page_down,
            'Control': pynput.keyboard.Key.ctrl,
            'Shift': pynput.keyboard.Key.shift,
            'Alt': pynput.keyboard.Key.alt,
            'Meta': pynput.keyboard.Key.cmd,
        }
        
        # Handle function keys
        if key.startswith('F') and len(key) <= 3:
            try:
                f_num = int(key[1:])
                if 1 <= f_num <= 12:
                    pynput_key = getattr(pynput.keyboard.Key, f'f{f_num}')
                    self.keyboard_controller.release(pynput_key)
                    return
            except (ValueError, AttributeError):
                pass
        
        pynput_key = key_mapping.get(key, key)
        self.keyboard_controller.release(pynput_key)
    
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
    
    def get_stats(self):
        """Get statistics about handled events"""
        return {
            'events_processed': self.event_count,
            'mouse_position': self.mouse_position,
            'pressed_keys': list(self.pressed_keys),
            'execute_inputs': self.execute_inputs
        }


# class InputService:
#     """Handles mouse and keyboard input operations"""
    
#     @staticmethod
#     def move_mouse(x, y):
#         """Move mouse to specified coordinates"""
#         try:
#             if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
#                 raise ValueError("Coordinates must be numeric")
            
#             mouse.position = (int(x), int(y))
#             logger.info(f"Mouse moved to: ({x}, {y})")
#             return True
#         except Exception as e:
#             logger.error(f"Failed to move mouse: {e}")
#             return False
    
#     @staticmethod
#     def click_mouse(button_name):
#         """Click specified mouse button"""
#         try:
#             button_map = {
#                 "left": Button.left,
#                 "right": Button.right,
#                 "middle": Button.middle
#             }
            
#             button = button_map.get(button_name.lower())
#             if not button:
#                 raise ValueError(f"Invalid button: {button_name}")
            
#             mouse.click(button, 1)
#             logger.info(f"Clicked {button_name} mouse button")
#             return True
#         except Exception as e:
#             logger.error(f"Failed to click {button_name} button: {e}")
#             return False
    
#     @staticmethod
#     def scroll_mouse(dx=0, dy=0):
#         """Scroll mouse wheel"""
#         try:
#             if not isinstance(dx, (int, float)) or not isinstance(dy, (int, float)):
#                 raise ValueError("Scroll values must be numeric")
            
#             # Convert to integers for scroll
#             dx, dy = int(dx), int(dy)
            
#             mouse.scroll(dx, dy)
            
#             # Log scroll direction for clarity
#             if dy > 0:
#                 direction = f"up ({dy})"
#             elif dy < 0:
#                 direction = f"down ({abs(dy)})"
#             elif dx > 0:
#                 direction = f"right ({dx})"
#             elif dx < 0:
#                 direction = f"left ({abs(dx)})"
#             else:
#                 direction = "no movement"
            
#             logger.info(f"Mouse scrolled: {direction}")
#             return True
            
#         except Exception as e:
#             logger.error(f"Failed to scroll mouse dx={dx}, dy={dy}: {e}")
#             return False
        
#     @staticmethod
#     def press_key(key_input):
#         """Handle key press - supports all possible key combinations and cases"""
#         try:
#             if not key_input:
#                 raise ValueError("Key input cannot be empty")
            
#             # Normalize input - convert to lowercase for comparison
#             key_lower = key_input.lower().strip()
            
#             # Comprehensive special key mappings (covers all common cases)
#             special_keys = {
#                 # Backspace variations
#                 "backspace": Key.backspace,
#                 "back": Key.backspace,
                
#                 # Delete variations  
#                 "delete": Key.delete,
#                 "del": Key.delete,
                
#                 # Enter variations
#                 "enter": Key.enter,
#                 "return": Key.enter,
#                 "ret": Key.enter,
                
#                 # Tab variations
#                 "tab": Key.tab,
                
#                 # Space variations
#                 "space": Key.space,
#                 "spacebar": Key.space,
#                 " ": Key.space,
                
#                 # Escape variations
#                 "escape": Key.esc,
#                 "esc": Key.esc,
                
#                 # Arrow keys - all possible variations
#                 "arrowup": Key.up,
#                 "arrow_up": Key.up,
#                 "up": Key.up,
#                 "uparrow": Key.up,
                
#                 "arrowdown": Key.down,
#                 "arrow_down": Key.down,
#                 "down": Key.down,
#                 "downarrow": Key.down,
                
#                 "arrowleft": Key.left,
#                 "arrow_left": Key.left,
#                 "left": Key.left,
#                 "leftarrow": Key.left,
                
#                 "arrowright": Key.right,
#                 "arrow_right": Key.right,
#                 "right": Key.right,
#                 "rightarrow": Key.right,
                
#                 # Modifier keys
#                 "shift": Key.shift,
#                 "shiftleft": Key.shift_l,
#                 "shift_left": Key.shift_l,
#                 "shiftright": Key.shift_r,
#                 "shift_right": Key.shift_r,
                
#                 "ctrl": Key.ctrl,
#                 "control": Key.ctrl,
#                 "ctrlleft": Key.ctrl_l,
#                 "ctrl_left": Key.ctrl_l,
#                 "ctrlright": Key.ctrl_r,
#                 "ctrl_right": Key.ctrl_r,
                
#                 "alt": Key.alt,
#                 "altleft": Key.alt_l,
#                 "alt_left": Key.alt_l,
#                 "altright": Key.alt_r,
#                 "alt_right": Key.alt_r,
#                 "altgr": Key.alt_gr,
                
#                 "cmd": Key.cmd,
#                 "command": Key.cmd,
#                 "meta": Key.cmd,
#                 "windows": Key.cmd,
#                 "win": Key.cmd,
#                 "super": Key.cmd,
                
#                 # Lock keys
#                 "capslock": Key.caps_lock,
#                 "caps_lock": Key.caps_lock,
#                 "caps": Key.caps_lock,
#                 "numlock": Key.num_lock,
#                 "num_lock": Key.num_lock,
#                 "scrolllock": Key.scroll_lock,
#                 "scroll_lock": Key.scroll_lock,
                
#                 # Navigation keys
#                 "home": Key.home,
#                 "end": Key.end,
#                 "pageup": Key.page_up,
#                 "page_up": Key.page_up,
#                 "pgup": Key.page_up,
#                 "pagedown": Key.page_down,
#                 "page_down": Key.page_down,
#                 "pgdn": Key.page_down,
                
#                 # Function keys
#                 "f1": Key.f1, "f2": Key.f2, "f3": Key.f3, "f4": Key.f4,
#                 "f5": Key.f5, "f6": Key.f6, "f7": Key.f7, "f8": Key.f8,
#                 "f9": Key.f9, "f10": Key.f10, "f11": Key.f11, "f12": Key.f12,
#                 "f13": Key.f13, "f14": Key.f14, "f15": Key.f15, "f16": Key.f16,
#                 "f17": Key.f17, "f18": Key.f18, "f19": Key.f19, "f20": Key.f20,
                
#                 # Insert/Print Screen
#                 "insert": Key.insert,
#                 "ins": Key.insert,
#                 "printscreen": Key.print_screen,
#                 "print_screen": Key.print_screen,
#                 "prtsc": Key.print_screen,
                
#                 # Menu key
#                 "menu": Key.menu,
#                 "context": Key.menu,
#                 "contextmenu": Key.menu,
                
#                 # Pause/Break
#                 "pause": Key.pause,
#                 "break": Key.pause,
#             }
            
#             # Check special keys first
#             if key_lower in special_keys:
#                 keyboard.tap(special_keys[key_lower])
#                 logger.info(f"Special key pressed: {key_input}")
#                 return True
            
#             # Handle key codes (e.g., "Key.backspace", "Key.enter")
#             if key_input.startswith("Key."):
#                 key_attr = key_input[4:].lower()
#                 if hasattr(Key, key_attr):
#                     keyboard.tap(getattr(Key, key_attr))
#                     logger.info(f"Key attribute pressed: {key_input}")
#                     return True
            
#             # Handle single characters or short strings
#             if len(key_input) <= 3:
#                 keyboard.type(key_input)
#                 logger.info(f"Character(s) typed: {key_input}")
#                 return True
            
#             # For longer strings, type them as text
#             keyboard.type(key_input)
#             logger.info(f"Text typed: {key_input}")
#             return True
            
#         except Exception as e:
#             logger.error(f"Failed to press key '{key_input}': {e}")
#             return False

# --- WebSocket Event Handlers ---
@socketio.on("connect")
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected")

@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected")

# @socketio.on("mouseMove")
# def handle_mouse_move(data):
#     """Handle mouse movement events"""
#     if not isinstance(data, dict):
#         logger.warning("Invalid mouse move data format")
#         return
    
#     x = data.get("x")
#     y = data.get("y")
    
#     if x is None or y is None:
#         logger.warning("Missing x or y coordinates in mouse move data")
#         return
    
#     success = InputService.move_mouse(x, y)
#     if not success:
#         socketio.emit("error", {"message": "Failed to move mouse"})

# @socketio.on("mouseClick")
# def handle_mouse_click(data):
#     """Handle mouse click events"""
#     if not isinstance(data, dict):
#         logger.warning("Invalid mouse click data format")
#         return
    
#     button = data.get("button", "left")
#     success = InputService.click_mouse(button)
    
#     if not success:
#         socketio.emit("error", {"message": f"Failed to click {button} button"})

# @socketio.on("mouseScroll")
# def handle_mouse_scroll(data):
#     """Handle mouse scroll events"""
#     if not isinstance(data, dict):
#         logger.warning("Invalid mouse scroll data format")
#         socketio.emit("error", {"message": "Invalid data format"})
#         return
    
#     # Support different input formats
#     dx = data.get("dx", data.get("deltaX", 0))
#     dy = data.get("dy", data.get("deltaY", 0))
    
#     # Also support direction + amount format
#     direction = data.get("direction")
#     amount = data.get("amount", 1)
    
#     if direction:
#         direction_map = {
#             "up": (0, amount),
#             "down": (0, -amount),
#             "left": (-amount, 0), 
#             "right": (amount, 0)
#         }
        
#         if direction.lower() in direction_map:
#             dx, dy = direction_map[direction.lower()]
#         else:
#             logger.warning(f"Invalid scroll direction: {direction}")
#             socketio.emit("error", {"message": f"Invalid scroll direction: {direction}"})
#             return
    
#     success = InputService.scroll_mouse(dx, dy)
#     if not success:
#         socketio.emit("error", {"message": f"Failed to scroll mouse dx={dx}, dy={dy}"})

# @socketio.on("keyPress")
# def handle_key_press(data):
#     """Handle keyboard events"""
#     if not isinstance(data, dict):
#         logger.warning("Invalid key press data format")
#         socketio.emit("error", {"message": "Invalid data format"})
#         return
    
#     key = data.get("key")
#     if not key:
#         logger.warning("No key specified in key press data")
#         socketio.emit("error", {"message": "No key specified"})
#         return
    
#     success = InputService.press_key(key)
#     if not success:
#         socketio.emit("error", {"message": f"Failed to press key: {key}"})

# @socketio.on("keyCombo")
# def handle_key_combination(data):
#     """Handle key combinations like Ctrl+C, Alt+Tab, etc."""
#     if not isinstance(data, dict):
#         logger.warning("Invalid key combo data format")
#         socketio.emit("error", {"message": "Invalid data format"})
#         return
    
#     keys = data.get("keys", [])
#     if not keys or not isinstance(keys, list):
#         logger.warning("Invalid keys array in combo data")
#         socketio.emit("error", {"message": "Invalid keys array"})
#         return
    
#     try:
#         # Convert string keys to Key objects
#         key_objects = []
#         for key_str in keys:
#             key_lower = key_str.lower().strip()
            
#             # Map common modifier names
#             modifier_map = {
#                 "ctrl": Key.ctrl, "control": Key.ctrl,
#                 "alt": Key.alt,
#                 "shift": Key.shift,
#                 "cmd": Key.cmd, "command": Key.cmd, "meta": Key.cmd,
#                 "win": Key.cmd, "windows": Key.cmd
#             }
            
#             if key_lower in modifier_map:
#                 key_objects.append(modifier_map[key_lower])
#             elif hasattr(Key, key_lower):
#                 key_objects.append(getattr(Key, key_lower))
#             elif len(key_str) == 1:
#                 key_objects.append(key_str.lower())
#             else:
#                 raise ValueError(f"Unknown key: {key_str}")
        
#         # Press all keys simultaneously
#         with keyboard.pressed(*key_objects):
#             pass  # Keys are pressed and released automatically
        
#         logger.info(f"Key combination pressed: {'+'.join(keys)}")
        
#     except Exception as e:
#         logger.error(f"Failed to press key combination {keys}: {e}")
#         socketio.emit("error", {"message": f"Failed to press key combination: {'+'.join(keys)}"})

# @socketio.on("type")
# def handle_type_text(data):
#     """Handle text typing events"""
#     if not isinstance(data, dict):
#         logger.warning("Invalid type data format")
#         socketio.emit("error", {"message": "Invalid data format"})
#         return
    
#     text = data.get("text")
#     if text is None:  # Allow empty strings
#         logger.warning("No text specified in type data")
#         socketio.emit("error", {"message": "No text specified"})
#         return
    
#     try:
#         keyboard.type(str(text))
#         logger.info(f"Text typed: '{text}' ({len(text)} characters)")
#     except Exception as e:
#         logger.error(f"Failed to type text '{text}': {e}")
#         socketio.emit("error", {"message": f"Failed to type text: {text}"})

@socketio.on("event")
def handle_event(event_data):
    input_handler = InputHandler()
    event_type = event_data.get('type')
    try:
       input_handler.handle_event(event_data)
       logger.info(f"Event handled: {event_data}")
    except Exception as e:
        logger.error(f"Error handling {event_type} event: {e}")


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