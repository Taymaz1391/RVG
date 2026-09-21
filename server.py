#!/usr/bin/env python3
"""
TOM AI - Preview & Production Server
Serves TOM AI static assets, handles CORS and proper MIME types for e2b preview and GitHub Pages testing.
"""

import http.server
import socketserver
import os
import sys

PORT = int(os.environ.get("PORT", 8000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class TOMHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable restrictive frame options for Arena live preview
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def guess_type(self, path):
        # Ensure correct MIME types for modern ES modules and SVG
        if path.endswith(".js"):
            return "application/javascript"
        elif path.endswith(".css"):
            return "text/css"
        elif path.endswith(".svg"):
            return "image/svg+xml"
        elif path.endswith(".json"):
            return "application/json"
        elif path.endswith(".webmanifest") or path.endswith(".manifest"):
            return "application/manifest+json"
        return super().guess_type(path)

    def log_message(self, format, *args):
        # Clean logging format
        sys.stderr.write(f"[TOM-Server] {self.address_string()} - {format % args}\n")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run():
    os.chdir(DIRECTORY)
    with ReusableTCPServer(("0.0.0.0", PORT), TOMHTTPRequestHandler) as httpd:
        print(f"[TOM-Server] Serving TOM AI on http://0.0.0.0:{PORT}")
        print(f"[TOM-Server] Live preview ready for Arena proxy and browser.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[TOM-Server] Shutting down.")

if __name__ == "__main__":
    run()
