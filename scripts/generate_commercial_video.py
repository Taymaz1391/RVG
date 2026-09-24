#!/usr/bin/env python3
"""
TOM AI - Official Commercial & Branding Video Generator
Generates a 20-second cinematic 720p HD promo advertisement with electronic synth soundtrack.
Outputs:
- assets/tom-brand-commercial.mp4
- downloads/TOM-AI-Commercial-Ad.mp4
"""

import os
import sys
import math
import subprocess
import numpy as np
import wave
from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(REPO_ROOT, "assets")
DOWNLOADS_DIR = os.path.join(REPO_ROOT, "downloads")
os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

WIDTH, HEIGHT = 1280, 720
FPS = 30
DURATION = 20.0
TOTAL_FRAMES = int(FPS * DURATION)

FONT_TITLE = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 46)
FONT_SUB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
FONT_BADGE = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
FONT_MONO = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 22)
FONT_BIG = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 68)

def generate_soundtrack(wav_path):
    print("[*] Synthesizing cinematic electronic music score...")
    sr = 44100
    t = np.linspace(0, DURATION, int(sr * DURATION), endpoint=False)
    audio = np.zeros_like(t)

    # 1. Deep sub-bass pulse (55Hz / A1)
    sub_bass = 0.35 * np.sin(2 * np.pi * 55 * t) * (1.0 + 0.25 * np.sin(2 * np.pi * 2 * t))
    # Add warm second harmonic
    sub_bass += 0.15 * np.sin(2 * np.pi * 110 * t)

    # 2. Ambient synth pad chords (A minor progression: Am, F, C, G)
    chord_freqs = [
        (0.0, 5.0, [220.0, 261.63, 329.63]),      # Am
        (5.0, 10.0, [174.61, 220.0, 261.63]),     # F
        (10.0, 15.0, [261.63, 329.63, 392.0]),    # C
        (15.0, 20.0, [196.0, 246.94, 293.66, 392.0]) # G & climax
    ]
    pad = np.zeros_like(t)
    for t_start, t_end, freqs in chord_freqs:
        mask = (t >= t_start) & (t < t_end)
        local_t = t[mask] - t_start
        seg_dur = t_end - t_start
        # Envelope: rise, sustain, decay
        env = np.sin(np.pi * (t[mask] - t_start) / seg_dur) ** 0.5
        for f in freqs:
            pad[mask] += 0.08 * env * np.sin(2 * np.pi * f * local_t)
            pad[mask] += 0.04 * env * np.sin(2 * np.pi * f * 2.01 * local_t) # shimmer

    # 3. Arpeggiated high cyber notes (16th note pattern)
    arp = np.zeros_like(t)
    notes = [440.0, 523.25, 659.25, 783.99, 880.0, 659.25, 523.25, 440.0]
    note_dur = 0.25
    for i, t_val in enumerate(np.arange(0, DURATION, note_dur)):
        if t_val >= 2.0: # start arps after 2s
            n_idx = int((t_val / note_dur)) % len(notes)
            f_note = notes[n_idx]
            mask = (t >= t_val) & (t < t_val + note_dur)
            lt = t[mask] - t_val
            env = np.exp(-12 * lt)
            arp[mask] += 0.12 * env * np.sin(2 * np.pi * f_note * lt)

    # 4. Risers / swooshes at scene transitions (t=3.8s, 7.8s, 11.8s, 15.8s)
    transitions = [3.8, 7.8, 11.8, 15.8]
    riser = np.zeros_like(t)
    for trans in transitions:
        mask = (t >= trans) & (t < trans + 0.6)
        lt = (t[mask] - trans) / 0.6
        f_sweep = 300 + 1200 * (lt ** 2)
        env = lt ** 1.5
        riser[mask] += 0.15 * env * np.sin(2 * np.pi * f_sweep * (t[mask] - trans))

    # Combine audio
    master = sub_bass + pad + arp + riser
    # Fade out last 1.5s
    fade_start = DURATION - 1.5
    fade_mask = t >= fade_start
    master[fade_mask] *= np.cos(0.5 * np.pi * (t[fade_mask] - fade_start) / 1.5)

    # Normalize
    max_val = np.max(np.abs(master))
    if max_val > 0:
        master = (master / max_val) * 0.90

    int_data = (master * 32767).astype(np.int16)
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(int_data.tobytes())
    print(f"    -> Audio saved: {wav_path}")

def draw_neural_particles(draw, frame_idx, count=36):
    np.random.seed(42)
    pts = []
    for i in range(count):
        base_x = (np.random.rand() * WIDTH)
        base_y = (np.random.rand() * HEIGHT)
        speed = 0.5 + np.random.rand() * 1.5
        phase = np.random.rand() * 2 * math.pi
        x = (base_x + math.sin(frame_idx * 0.03 * speed + phase) * 40) % WIDTH
        y = (base_y + math.cos(frame_idx * 0.02 * speed + phase) * 30) % HEIGHT
        pts.append((x, y))

    # Draw lines between close particles
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            dist = math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])
            if dist < 160:
                alpha = int((1.0 - dist / 160.0) * 80)
                draw.line([pts[i], pts[j]], fill=(16, 185, 129, alpha), width=1)

    for pt in pts:
        draw.ellipse([pt[0] - 2, pt[1] - 2, pt[0] + 2, pt[1] + 2], fill=(56, 189, 248, 160))

def render_frame(frame_idx):
    sec = frame_idx / FPS
    img = Image.new("RGBA", (WIDTH, HEIGHT), (11, 15, 25, 255))
    draw = ImageDraw.Draw(img)

    # Ambient neural background
    draw_neural_particles(draw, frame_idx)

    # Vignette & glowing gradient ring
    cx, cy = WIDTH // 2, HEIGHT // 2

    # Scene 1: 0.0s - 4.0s (The Question)
    if sec < 4.0:
        fade = min(1.0, sec / 0.8) if sec < 3.2 else max(0.0, (4.0 - sec) / 0.8)
        alpha = int(fade * 255)
        pulse = 1.0 + 0.08 * math.sin(sec * 4.0)
        r = int(120 * pulse)
        draw.ellipse([cx - r, cy - 80 - r, cx + r, cy - 80 + r], outline=(16, 185, 129, int(alpha * 0.6)), width=4)
        draw.ellipse([cx - r//2, cy - 80 - r//2, cx + r//2, cy - 80 + r//2], fill=(16, 163, 127, int(alpha * 0.25)))

        t1 = "WHAT IF ARTIFICIAL INTELLIGENCE"
        t2 = "HAD ZERO EXTERNAL BOUNDARIES?"
        t3 = "No external APIs • No server trackers • 100% on-device autonomous neural core"

        bbox1 = draw.textbbox((0, 0), t1, font=FONT_TITLE)
        draw.text((cx - (bbox1[2] - bbox1[0]) // 2, cy + 90), t1, font=FONT_TITLE, fill=(255, 255, 255, alpha))

        bbox2 = draw.textbbox((0, 0), t2, font=FONT_TITLE)
        draw.text((cx - (bbox2[2] - bbox2[0]) // 2, cy + 150), t2, font=FONT_TITLE, fill=(16, 185, 129, alpha))

        bbox3 = draw.textbbox((0, 0), t3, font=FONT_SUB)
        draw.text((cx - (bbox3[2] - bbox3[0]) // 2, cy + 220), t3, font=FONT_SUB, fill=(148, 163, 184, alpha))

    # Scene 2: 4.0s - 8.0s (The Reveal - TOM AI)
    elif sec < 8.0:
        local_sec = sec - 4.0
        fade = min(1.0, local_sec / 0.8) if local_sec < 3.2 else max(0.0, (4.0 - local_sec) / 0.8)
        alpha = int(fade * 255)

        # Expanding concentric rings
        for i in range(3):
            ring_r = int((70 + i * 45) * (1.0 + 0.05 * math.sin(local_sec * 5 + i)))
            draw.ellipse([cx - ring_r, cy - 100 - ring_r, cx + ring_r, cy - 100 + ring_r],
                         outline=(56, 189, 248, int(alpha * (0.6 - i * 0.15))), width=2 + i)

        # Logo Core
        draw.ellipse([cx - 48, cy - 148, cx + 48, cy - 52], fill=(16, 185, 129, alpha))
        draw.text((cx - 24, cy - 128), "🧠", font=FONT_TITLE, fill=(255, 255, 255, alpha))

        name = "TOM AI (v4.5 ULTRA)"
        sub = "Frontier Intelligence Built From Scratch (0 to 100)"
        badges = ["✓ Multi-Head Attention", "✓ Chain-of-Thought (o1)", "✓ Zero-API Privacy", "✓ Sub-ms Local Latency"]

        bb_n = draw.textbbox((0, 0), name, font=FONT_BIG)
        draw.text((cx - (bb_n[2] - bb_n[0]) // 2, cy + 30), name, font=FONT_BIG, fill=(255, 255, 255, alpha))

        bb_s = draw.textbbox((0, 0), sub, font=FONT_SUB)
        draw.text((cx - (bb_s[2] - bb_s[0]) // 2, cy + 120), sub, font=FONT_SUB, fill=(56, 189, 248, alpha))

        # Badges row
        total_w = len(badges) * 260
        start_x = cx - total_w // 2 + 30
        for idx, badge in enumerate(badges):
            bx = start_x + idx * 260
            by = cy + 190
            draw.rounded_rectangle([bx, by, bx + 230, by + 40], radius=10,
                                   fill=(15, 23, 42, int(alpha * 0.9)),
                                   outline=(16, 185, 129, int(alpha * 0.7)), width=1)
            draw.text((bx + 16, by + 10), badge, font=FONT_BADGE, fill=(241, 245, 249, alpha))

    # Scene 3: 8.0s - 12.0s (Canvas & Code Artifacts)
    elif sec < 12.0:
        local_sec = sec - 8.0
        fade = min(1.0, local_sec / 0.8) if local_sec < 3.2 else max(0.0, (4.0 - local_sec) / 0.8)
        alpha = int(fade * 255)

        t1 = "SPLIT-SCREEN CANVAS & ARTIFACTS"
        t2 = "Live Sandboxed Web App & Code Execution"
        bb1 = draw.textbbox((0, 0), t1, font=FONT_TITLE)
        draw.text((cx - (bb1[2] - bb1[0]) // 2, 80), t1, font=FONT_TITLE, fill=(255, 255, 255, alpha))
        bb2 = draw.textbbox((0, 0), t2, font=FONT_SUB)
        draw.text((cx - (bb2[2] - bb2[0]) // 2, 140), t2, font=FONT_SUB, fill=(56, 189, 248, alpha))

        # Code window box
        wx, wy, ww, wh = cx - 440, 210, 880, 420
        draw.rounded_rectangle([wx, wy, wx + ww, wy + wh], radius=14,
                               fill=(15, 23, 42, int(alpha * 0.95)),
                               outline=(51, 65, 85, int(alpha * 0.9)), width=2)
        # Window dots
        draw.ellipse([wx + 20, wy + 16, wx + 32, wy + 28], fill=(239, 68, 68, alpha))
        draw.ellipse([wx + 42, wy + 16, wx + 54, wy + 28], fill=(234, 179, 8, alpha))
        draw.ellipse([wx + 64, wy + 16, wx + 76, wy + 28], fill=(34, 197, 94, alpha))
        draw.text((wx + 96, wy + 14), "tom-artifacts-sandbox.js — Live Runner", font=FONT_BADGE, fill=(148, 163, 184, alpha))

        code_lines = [
            "// Autonomous Frontier Reasoning Loop",
            "const tom = new TomNeuralCore({ attentionHeads: 8, zeroApi: true });",
            "const solution = await tom.reasonStepByStep({",
            "  prompt: 'Build high-performance 3D canvas and neural reasoning',",
            "  mode: 'Chain-of-Thought (o1)',",
            "  offlineOnDevice: true",
            "});",
            ">> Artifact Rendered in Sandboxed Iframe (100% Client-Side)"
        ]
        char_count = int(local_sec * 60)
        total_printed = 0
        for l_idx, line in enumerate(code_lines):
            line_y = wy + 65 + l_idx * 40
            if total_printed < char_count:
                part = line[:max(0, char_count - total_printed)]
                color = (34, 197, 94, alpha) if line.startswith(">>") else (
                    (148, 163, 184, alpha) if line.startswith("//") else (226, 232, 240, alpha)
                )
                draw.text((wx + 30, line_y), part, font=FONT_MONO, fill=color)
            total_printed += len(line)

    # Scene 4: 12.0s - 16.0s (Advanced Voice Mode & Training Studio)
    elif sec < 16.0:
        local_sec = sec - 12.0
        fade = min(1.0, local_sec / 0.8) if local_sec < 3.2 else max(0.0, (4.0 - local_sec) / 0.8)
        alpha = int(fade * 255)

        t1 = "ADVANCED VOICE MODE & NEURAL STUDIO"
        t2 = "Interactive Glowing 3D Orb • Real-Time Backpropagation Training"
        bb1 = draw.textbbox((0, 0), t1, font=FONT_TITLE)
        draw.text((cx - (bb1[2] - bb1[0]) // 2, 80), t1, font=FONT_TITLE, fill=(255, 255, 255, alpha))
        bb2 = draw.textbbox((0, 0), t2, font=FONT_SUB)
        draw.text((cx - (bb2[2] - bb2[0]) // 2, 140), t2, font=FONT_SUB, fill=(16, 185, 129, alpha))

        # Animated Fluid Orb in center
        orb_y = cy + 40
        orb_r = int(90 + 20 * math.sin(local_sec * 6))
        for layer in range(6, 0, -1):
            r_l = orb_r + layer * 18
            g_alpha = int(alpha * (0.12 / layer))
            draw.ellipse([cx - r_l, orb_y - r_l, cx + r_l, orb_y + r_l],
                         fill=(16, 185, 129, g_alpha))

        draw.ellipse([cx - orb_r, orb_y - orb_r, cx + orb_r, orb_y + orb_r],
                     fill=(15, 23, 42, alpha), outline=(56, 189, 248, alpha), width=3)

        # Soundwave bars left and right
        for b in range(12):
            h_bar = max(6, int(abs(30 + 45 * math.sin(local_sec * 8 + b * 0.6))))
            bx_left = cx - 180 - b * 18
            bx_right = cx + 180 + b * 18
            draw.rounded_rectangle([bx_left, orb_y - h_bar, bx_left + 8, orb_y + h_bar], radius=4,
                                   fill=(16, 185, 129, int(alpha * 0.8)))
            draw.rounded_rectangle([bx_right, orb_y - h_bar, bx_right + 8, orb_y + h_bar], radius=4,
                                   fill=(56, 189, 248, int(alpha * 0.8)))

        lbl = "🎙️ Real-time Hands-free Conversational Dialogue"
        bbl = draw.textbbox((0, 0), lbl, font=FONT_SUB)
        draw.text((cx - (bbl[2] - bbl[0]) // 2, cy + 220), lbl, font=FONT_SUB, fill=(241, 245, 249, alpha))

    # Scene 5: 16.0s - 20.0s (Call To Action & Downloads)
    else:
        local_sec = sec - 16.0
        fade = min(1.0, local_sec / 0.8)
        alpha = int(fade * 255)

        t1 = "EXPERIENCE THE FUTURE TODAY"
        bb1 = draw.textbbox((0, 0), t1, font=FONT_TITLE)
        draw.text((cx - (bb1[2] - bb1[0]) // 2, 70), t1, font=FONT_TITLE, fill=(16, 185, 129, alpha))

        name = "TOM AI (v4.5 ULTRA)"
        bb_n = draw.textbbox((0, 0), name, font=FONT_BIG)
        draw.text((cx - (bb_n[2] - bb_n[0]) // 2, 130), name, font=FONT_BIG, fill=(255, 255, 255, alpha))

        # Two big download cards: Android & Windows
        c_w, c_h = 440, 230
        c1_x = cx - c_w - 20
        c2_x = cx + 20
        card_y = 230

        # Android Card
        draw.rounded_rectangle([c1_x, card_y, c1_x + c_w, card_y + c_h], radius=16,
                               fill=(15, 23, 42, int(alpha * 0.95)),
                               outline=(34, 197, 94, int(alpha * 0.8)), width=2)
        draw.text((c1_x + 30, card_y + 25), "📱 Android APK Package", font=FONT_TITLE, fill=(34, 197, 94, alpha))
        draw.text((c1_x + 30, card_y + 90), "• Signed APK: TOM-AI-v4.5.apk", font=FONT_SUB, fill=(226, 232, 240, alpha))
        draw.text((c1_x + 30, card_y + 130), "• Android 7.0+ • 100% Offline AI", font=FONT_SUB, fill=(148, 163, 184, alpha))
        draw.rounded_rectangle([c1_x + 30, card_y + 170, c1_x + c_w - 30, card_y + 210], radius=8,
                               fill=(16, 163, 127, alpha))
        draw.text((c1_x + 100, card_y + 178), "📥 Download APK (~89 KB)", font=FONT_BADGE, fill=(255, 255, 255, alpha))

        # Windows Card
        draw.rounded_rectangle([c2_x, card_y, c2_x + c_w, card_y + c_h], radius=16,
                               fill=(15, 23, 42, int(alpha * 0.95)),
                               outline=(56, 189, 248, int(alpha * 0.8)), width=2)
        draw.text((c2_x + 30, card_y + 25), "💻 Windows Native 64-bit", font=FONT_TITLE, fill=(56, 189, 248, alpha))
        draw.text((c2_x + 30, card_y + 90), "• Launcher: TOM-AI-Setup.exe", font=FONT_SUB, fill=(226, 232, 240, alpha))
        draw.text((c2_x + 30, card_y + 130), "• Windows 10/11 • 1-Click Setup", font=FONT_SUB, fill=(148, 163, 184, alpha))
        draw.rounded_rectangle([c2_x + 30, card_y + 170, c2_x + c_w - 30, card_y + 210], radius=8,
                               fill=(14, 165, 233, alpha))
        draw.text((c2_x + 100, card_y + 178), "📥 Download EXE (2.5 KB)", font=FONT_BADGE, fill=(255, 255, 255, alpha))

        # Bottom URL
        url_text = "🌐 Hosted on GitHub Pages: https://Taymaz1391.github.io/RVG/"
        bbu = draw.textbbox((0, 0), url_text, font=FONT_SUB)
        draw.text((cx - (bbu[2] - bbu[0]) // 2, 500), url_text, font=FONT_SUB, fill=(241, 245, 249, alpha))

        slogan = "TOM AI — The Autonomous Frontier of Intelligence • ساخته شده از ۰ بدون API"
        bbs = draw.textbbox((0, 0), slogan, font=FONT_BADGE)
        draw.text((cx - (bbs[2] - bbs[0]) // 2, 550), slogan, font=FONT_BADGE, fill=(148, 163, 184, alpha))

    return img.convert("RGB")

def build_commercial():
    wav_path = "/tmp/tom_commercial_audio.wav"
    generate_soundtrack(wav_path)

    out_mp4 = os.path.join(ASSETS_DIR, "tom-brand-commercial.mp4")
    out_download = os.path.join(DOWNLOADS_DIR, "TOM-AI-Commercial-Ad.mp4")

    print(f"[*] Rendering {TOTAL_FRAMES} frames ({DURATION}s @ {FPS}fps) to FFmpeg...")

    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-i", wav_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        out_mp4
    ]

    pipe = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

    for i in range(TOTAL_FRAMES):
        frame = render_frame(i)
        pipe.stdin.write(frame.tobytes())
        if (i + 1) % 150 == 0:
            print(f"    -> Progress: {i + 1}/{TOTAL_FRAMES} frames rendered ({(i + 1)/TOTAL_FRAMES * 100:.0f}%)")

    pipe.stdin.close()
    pipe.wait()

    if pipe.returncode != 0:
        print("[!] FFmpeg error:", pipe.stderr.read().decode())
        sys.exit(1)

    import shutil
    shutil.copyfile(out_mp4, out_download)

    print(f"[OK] Commercial Video generated successfully:")
    print(f"     -> {out_mp4} ({os.path.getsize(out_mp4)} bytes)")
    print(f"     -> {out_download} ({os.path.getsize(out_download)} bytes)")

if __name__ == "__main__":
    build_commercial()
