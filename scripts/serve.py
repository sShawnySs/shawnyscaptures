"""Serve the project folder for the drafts, telling the browser never to keep old copies.

    python3 scripts/serve.py            # http://localhost:4341/drafts/v2/index.html
    python3 scripts/serve.py 4350       # another port

Python's own `python3 -m http.server` lets the browser reuse cached files, so an edit to a script or to
data/site.json can stay invisible until a hard refresh. This is the same server with `Cache-Control: no-store`.
"""
import http.server, os, sys

class NoStore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4341
    print(f'Serving http://localhost:{port}/drafts/v2/index.html (no caching)')
    http.server.ThreadingHTTPServer(('', port), NoStore).serve_forever()
