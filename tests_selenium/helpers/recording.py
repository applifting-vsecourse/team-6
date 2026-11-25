"""Records what a test's Chrome renders, via the DevTools screencast, into an MP4.

Turn it on with RECORD=1. Each browser a test uses is saved as
tests_selenium/artifacts/videos/<test>-<fixture>.mp4. The screencast runs on its own
DevTools websocket in a background thread, so it never interleaves with WebDriver commands,
and Chrome only sends a frame when the page changes, so recording is cheap.
Needs ffmpeg on PATH.
"""

import base64
import json
import os
import shutil
import subprocess
import tempfile
import threading
import urllib.request

import websocket

VIDEOS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts", "videos")


def enabled():
    return os.environ.get("RECORD") == "1" and shutil.which("ffmpeg") is not None


class Screencast:
    def __init__(self, driver, name):
        self.name = name
        self.frames_dir = tempfile.mkdtemp(prefix="kv-screencast-")
        self.frames = []  # (path, timestamp in seconds)
        self._stop = threading.Event()
        address = driver.capabilities["goog:chromeOptions"]["debuggerAddress"]
        with urllib.request.urlopen(f"http://{address}/json", timeout=5) as resp:
            targets = json.load(resp)
        page = next(t for t in targets if t["type"] == "page")
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True, timeout=1)
        self._next_id = 1
        self._send("Page.startScreencast", {"format": "jpeg", "quality": 80, "everyNthFrame": 1})
        self.thread = threading.Thread(target=self._pump, daemon=True)
        self.thread.start()

    def _send(self, method, params=None):
        self._next_id += 1
        self.ws.send(json.dumps({"id": self._next_id, "method": method, "params": params or {}}))

    def _pump(self):
        while not self._stop.is_set():
            try:
                message = json.loads(self.ws.recv())
            except websocket.WebSocketTimeoutException:
                continue
            except Exception:
                return  # the browser went away
            if message.get("method") != "Page.screencastFrame":
                continue
            params = message["params"]
            path = os.path.join(self.frames_dir, f"{len(self.frames):06d}.jpg")
            with open(path, "wb") as f:
                f.write(base64.b64decode(params["data"]))
            self.frames.append((path, params["metadata"]["timestamp"]))
            try:
                self._send("Page.screencastFrameAck", {"sessionId": params["sessionId"]})
            except Exception:
                return

    def stop(self):
        """Stops recording and writes the MP4. Returns its path, or None if nothing was captured."""
        try:
            self._send("Page.stopScreencast")
        except Exception:
            pass
        self._stop.set()
        self.thread.join(timeout=3)
        try:
            self.ws.close()
        except Exception:
            pass
        if len(self.frames) < 2:
            shutil.rmtree(self.frames_dir, ignore_errors=True)
            return None
        os.makedirs(VIDEOS_DIR, exist_ok=True)
        out = os.path.abspath(os.path.join(VIDEOS_DIR, f"{self.name}.mp4"))
        frames_to_mp4(self.frames, out)
        shutil.rmtree(self.frames_dir, ignore_errors=True)
        return out


def jpeg_size(path):
    """(width, height) of a JPEG, read from its SOF marker."""
    with open(path, "rb") as f:
        data = f.read()
    i = 2
    while i < len(data) - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        length = int.from_bytes(data[i + 2:i + 4], "big")
        if marker in (0xC0, 0xC1, 0xC2):
            return int.from_bytes(data[i + 7:i + 9], "big"), int.from_bytes(data[i + 5:i + 7], "big")
        i += 2 + length
    raise ValueError(f"no size in {path}")


def frames_to_mp4(frames, out, last_frame_seconds=1.0, max_gap=3.0):
    """Encodes timestamped frames at their real timing (long idle gaps are capped).

    Frames can differ in size (Chrome sends a smaller one while a page is still laying out),
    so every frame is fitted onto one canvas: the most common frame size.
    """
    sizes = [jpeg_size(path) for path, _ in frames]
    width, height = max(set(sizes), key=sizes.count)
    width, height = width - width % 2, height - height % 2
    listing = os.path.join(os.path.dirname(frames[0][0]), "frames.txt")
    with open(listing, "w") as f:
        for (path, ts), (_, next_ts) in zip(frames, frames[1:] + [(None, None)]):
            duration = last_frame_seconds if next_ts is None else min(max(next_ts - ts, 0.02), max_gap)
            f.write(f"file '{path}'\nduration {duration:.3f}\n")
        f.write(f"file '{frames[-1][0]}'\n")  # the concat demuxer needs the last file twice
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listing,
            "-vf",
            f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
            f"pad={width}:{height}:(ow-iw)/2:0:color=black,fps=25",
            "-pix_fmt", "yuv420p",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", out,
        ],
        check=True,
    )
