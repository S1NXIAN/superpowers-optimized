#!/usr/bin/env bash
# Zeus Vision — Visual Preview Controller

set -euo pipefail

PID_FILE="/tmp/zeus-vision.pid"
PORT=3000

start() {
    if [[ -f "$PID_FILE" ]]; then
        echo "Zeus Vision is already running (PID: $(cat "$PID_FILE"))"
        return
    fi
    mkdir -p docs/zeus/previews
    node bin/visual-server.mjs > /dev/null 2>&1 &
    echo $! > "$PID_FILE"
    echo "Zeus Vision started on port $PORT"
}

stop() {
    if [[ -f "$PID_FILE" ]]; then
        PID=$(cat "$PID_FILE")
        kill "$PID" || true
        rm "$PID_FILE"
        echo "Zeus Vision stopped."
    else
        echo "Zeus Vision is not running."
    fi
}

status() {
    if [[ -f "$PID_FILE" ]]; then
        echo "Zeus Vision is running (PID: $(cat "$PID_FILE"))"
    else
        echo "Zeus Vision is stopped."
    fi
}

case "${1:-}" in
    start) start ;;
    stop) stop ;;
    status) status ;;
    *) echo "Usage: $0 {start|stop|status}" ;;
esac
