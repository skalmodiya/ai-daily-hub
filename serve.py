#!/usr/bin/env python3
"""Local dev server for AI Daily Hub — runs on http://localhost:3000"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        print(f"  {self.address_string()} → {format % args}")

    def end_headers(self):
        # Allow fetch() to work for local content.json
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    url = f"http://localhost:{port}"

    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"\n  🧠 AI Daily Hub — Local Server")
        print(f"  ─────────────────────────────")
        print(f"  URL : {url}")
        print(f"  Dir : {DIRECTORY}")
        print(f"  Stop: Ctrl+C\n")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")
