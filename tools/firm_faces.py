"""YK 소개 구성원 사진의 얼굴 크기를 맞춘다(2026-10-29 김윤창 피드백).

원본 portraits.json 사진마다 찍힌 거리·여백이 달라 같은 칸에 넣으면 얼굴 크기가 들쭉날쭉하다.
얼굴을 찾아 3:4 칸 기준 얼굴 폭 34%, 얼굴 중심 높이 36%가 되도록 잘라 portraits_firm.json에 둔다.
칸이 원본 밖으로 나가면 가장자리 색으로 채운다. 실행: python3 tools/firm_faces.py (opencv 필요)
"""
import base64
import io
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FACE_W, FACE_Y, OUT = 0.34, 0.36, (300, 400)
PAPER = (247, 246, 242)


def main() -> None:
    src = json.loads((ROOT / "server/data/portraits.json").read_text(encoding="utf-8"))
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    out = {}
    for name, uri in src.items():
        raw = Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1])))
        # 배경이 투명한 사진은 다른 사진들의 밝은 배경색 위에 얹는다.
        if raw.mode in ("RGBA", "LA", "P"):
            base = Image.new("RGB", raw.size, PAPER)
            base.paste(raw.convert("RGBA"), mask=raw.convert("RGBA").split()[3])
            im = base
        else:
            im = raw.convert("RGB")
        w0, h0 = im.size
        gray = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY)
        faces = cascade.detectMultiScale(gray, 1.1, 5, minSize=(int(w0 * 0.12), int(w0 * 0.12)))
        if not len(faces):
            print("얼굴 못 찾음:", name)
            continue
        # 흰 배경 사진도 같은 밝은 배경색으로 맞춘다(모서리에서 비슷한 색만 채움).
        arr = np.array(im)
        for sx, sy in ((1, 1), (w0 - 2, 1)):
            if min(arr[sy, sx]) >= 240:
                mask = np.zeros((h0 + 2, w0 + 2), np.uint8)
                cv2.floodFill(arr, mask, (sx, sy), PAPER, (4, 4, 4), (4, 4, 4), flags=4 | cv2.FLOODFILL_FIXED_RANGE)
        im = Image.fromarray(arr)
        x, y, w, h = max(faces, key=lambda r: r[2] * r[3])
        cw = w / FACE_W
        ch = cw * OUT[1] / OUT[0]
        left = x + w / 2 - cw / 2
        top = y + h / 2 - ch * FACE_Y
        # 원본 밖은 좌상단 배경색으로 채운다.
        bg = im.getpixel((2, 2))
        canvas = Image.new("RGB", (round(cw), round(ch)), bg)
        canvas.paste(im, (round(-left), round(-top)))
        canvas = canvas.resize(OUT, Image.LANCZOS)
        buf = io.BytesIO()
        canvas.save(buf, "JPEG", quality=82, optimize=True)
        out[name] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    for p in ("server/data/portraits_firm.json", "app/public/data/portraits_firm.json"):
        (ROOT / p).write_text(json.dumps(out, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(out)}명 → portraits_firm.json")


if __name__ == "__main__":
    main()
