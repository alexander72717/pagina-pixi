BOARD_PROFILES = {
    "esp32-s3-zero": {
        "label": "ESP32-S3 Zero",
        "fqbn": "esp32:esp32:esp32s3",
        "led": {
            "type": "rgb",
            "pin": 21,
            "order": "RGB",
        },
        "robot": {
            "rgb_led_pins": {
                "red": 2,
                "green": 1,
                "blue": 7,
            },
            "button_pin": 5,
            "motors": {
                "left_forward": 3,
                "left_backward": 4,
                "right_forward": 6,
                "right_backward": 10,
            },
            "i2c": {
                "sda": 8,
                "scl": 9,
            },
            "oled": {
                "address": "0x3C",
                "width": 128,
                "height": 64,
                "reset": -1,
            },
        },
    },
    "esp32-c3-super-mini": {
        "label": "ESP32-C3 Super Mini",
        "fqbn": "esp32:esp32:esp32c3",
        "led": {
            "type": "digital",
            "pin": 8,
            "active_high": True,
        },
        "robot": {
            "button_pin": -1,
            "motors": {
                "left_forward": -1,
                "left_backward": -1,
                "right_forward": -1,
                "right_backward": -1,
            },
        },
    },
}


def get_board_profile(board_id: str):
    return BOARD_PROFILES.get(board_id, BOARD_PROFILES["esp32-s3-zero"])
