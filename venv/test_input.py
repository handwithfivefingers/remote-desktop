from pynput.mouse import Controller, Button
from pynput.keyboard import Controller as KeyController

mouse = Controller()
keyboard = KeyController()

# Move mouse
mouse.position = (200, 200)

# Click
mouse.click(Button.left, 1)

# Type hello
keyboard.type("Hello from Python service!")
