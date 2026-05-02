"""Generate solid-color placeholder PNG posters for Phase 1.

stdlib만 사용. 320x240 단색 PNG 6장을 public/posters/ 에 출력.
실제 사진풍 포스터로 교체될 때까지 사용.
"""
import os
import struct
import zlib

W, H = 320, 240
WORKS = [
    ("work01", (216, 86, 86)),
    ("work02", (242, 178, 92)),
    ("work03", (228, 217, 102)),
    ("work04", (122, 191, 130)),
    ("work05", (102, 161, 217)),
    ("work06", (171, 122, 217)),
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "posters")


def png_chunk(tag, data):
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def make_solid_png(path, w, h, rgb):
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8bit RGB
    row = b"\x00" + bytes(rgb) * w  # filter byte 0 + pixel data
    raw = row * h
    idat = zlib.compress(raw, 9)
    with open(path, "wb") as f:
        f.write(sig)
        f.write(png_chunk(b"IHDR", ihdr))
        f.write(png_chunk(b"IDAT", idat))
        f.write(png_chunk(b"IEND", b""))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, color in WORKS:
        out = os.path.join(OUT_DIR, f"{name}-photo.png")
        make_solid_png(out, W, H, color)
        print(f"wrote {out}")


if __name__ == "__main__":
    main()
