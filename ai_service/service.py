"""
KALASETU Python AI Image Enhancer Service
-----------------------------------------
Internal HTTP service running on http://127.0.0.1:8001
Provides internal image processing endpoints for Node.js backend.
"""

import sys
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

# Add parent directory to sys.path so we can import image_enhancer
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
sys.path.insert(0, BASE_DIR)

from image_enhancer import analyse_and_enhance, restyle

PORT = 8001


class AIRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == '/health':
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "kalasetu-image-enhancer",
                "port": PORT
            }).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok": False, "error": f"Invalid JSON: {e}"}).encode('utf-8'))
            return

        if self.path == '/enhance':
            src = body.get('src') or body.get('image_url')
            if not src:
                self._set_headers(400)
                self.wfile.write(json.dumps({"ok": False, "error": "Missing 'src' or 'image_url' parameter"}).encode('utf-8'))
                return

            style = body.get('style')
            strength = float(body.get('strength', 0.8))
            size = int(body.get('size', 1600))

            try:
                result = analyse_and_enhance(src, style=style, strength=strength, size=size)
                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode('utf-8'))

        elif self.path == '/restyle':
            cutout_src = body.get('cutout_src') or body.get('cutout_png')
            style = body.get('style', 'soft_studio')
            size = int(body.get('size', 1600))

            if not cutout_src:
                self._set_headers(400)
                self.wfile.write(json.dumps({"ok": False, "error": "Missing 'cutout_src' parameter"}).encode('utf-8'))
                return

            try:
                result = restyle(cutout_src, style=style, size=size)
                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode('utf-8'))

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": f"Endpoint not found: {self.path}"}).encode('utf-8'))

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[AI Service] {self.address_string()} - {format % args}\n")


def run_service():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, AIRequestHandler)
    print(f"KALASETU AI Image Enhancer Service listening on http://127.0.0.1:{PORT}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down AI service.")
        httpd.server_close()


if __name__ == '__main__':
    run_service()
