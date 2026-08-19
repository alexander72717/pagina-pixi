FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV PORT=10000
ENV ARDUINO_CONFIG_FILE=/etc/arduino-cli.yaml

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates git python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/usr/local/bin sh

RUN arduino-cli config init --dest-file /etc/arduino-cli.yaml --overwrite \
    && arduino-cli --config-file /etc/arduino-cli.yaml config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json \
    && arduino-cli --config-file /etc/arduino-cli.yaml core update-index \
    && arduino-cli --config-file /etc/arduino-cli.yaml core install esp32:esp32 \
    && arduino-cli --config-file /etc/arduino-cli.yaml lib install ESP32Servo

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY server.js ./server.js

RUN mkdir -p /app/build_temp

EXPOSE 10000

CMD ["npm", "start"]
