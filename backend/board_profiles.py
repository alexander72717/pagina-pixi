BOARD_PROFILES = {
    "esp32-s3-zero": {
        "label": "ESP32-S3 Zero",
        "fqbn": "esp32:esp32:esp32s3",
        "led": {
            "type": "rgb",
            "pin": 21,
            "order": "RGB",
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
    },
}


def get_board_profile(board_id: str):
    return BOARD_PROFILES.get(board_id, BOARD_PROFILES["esp32-s3-zero"])
