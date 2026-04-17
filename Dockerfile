FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates git build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt

RUN pip install --no-cache-dir -r /app/backend/requirements.txt

RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/usr/local/bin sh

RUN arduino-cli config init --dest-file /etc/arduino-cli.yaml --overwrite \
    && arduino-cli --config-file /etc/arduino-cli.yaml config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json \
    && arduino-cli --config-file /etc/arduino-cli.yaml core update-index \
    && arduino-cli --config-file /etc/arduino-cli.yaml core install esp32:esp32

ENV ARDUINO_CONFIG_FILE=/etc/arduino-cli.yaml

COPY . /app

CMD ["/bin/sh", "-c", "gunicorn --chdir backend -b 0.0.0.0:${PORT:-10000} app:app"]
