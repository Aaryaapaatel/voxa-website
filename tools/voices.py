"""Render every demo line in scenes.js to audio/<scene>-<n>.m4a with Chatterbox Turbo
(Resemble AI, MIT licence, runs locally on Apple Silicon).

Setup (once, Python 3.11):
  uv venv --python 3.11 .venv && uv pip install chatterbox-tts soundfile
Run:
  .venv/bin/python tools/voices.py              (first run downloads the model, ~3 GB)
  .venv/bin/python tools/voices.py realty ...   (only these scene ids)

The agent uses AGENT_REF as her voice; callers use tools/refs/<caller>.wav.
Paralinguistic tags such as [sigh] or [chuckle] in a line's "say" text become real sounds.
Needs macOS afconvert for the AAC encode.
"""
import json, pathlib, re, subprocess, sys, tempfile
import librosa, numpy as np, soundfile as sf, torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

ROOT = pathlib.Path(__file__).resolve().parent.parent
REFS = ROOT / "tools" / "refs"
AGENT_REF = None  # None = Chatterbox's built-in voice; or a path to a clean 10 s clip of the voice you want


def scenes():
    src = (ROOT / "scenes.js").read_text()
    return json.loads(re.search(r"=\s*(\[.*\])\s*;", src, re.S).group(1))


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    tts = ChatterboxTurboTTS.from_pretrained(device)

    voices = {}
    def conds(ref):  # cache the conditioning for each voice
        if ref not in voices:
            if ref is not None:
                tts.prepare_conditionals(str(ref))
            voices[ref] = tts.conds  # prepare_conditionals builds a new object each time
        return voices[ref]
    conds(AGENT_REF)

    out_dir = ROOT / "audio"
    out_dir.mkdir(exist_ok=True)
    n = 0
    with tempfile.TemporaryDirectory() as tmp:
        only = set(sys.argv[1:])
        for s in scenes():
            if only and s["id"] not in only:
                continue
            for i, line in enumerate(s["lines"]):
                ref = AGENT_REF if line["who"] == "a" else REFS / f"{s['caller']}.wav"
                tts.conds = conds(ref)
                wav = tts.generate(line.get("say", line["text"]), temperature=0.8).squeeze().cpu().numpy()
                wav, _ = librosa.effects.trim(wav, top_db=40)  # drop dead air at the edges
                pad = np.zeros(int(tts.sr * 0.06), dtype=wav.dtype)
                wav = np.concatenate([pad, wav, pad])
                tmp_wav = pathlib.Path(tmp) / "line.wav"
                sf.write(tmp_wav, wav, tts.sr, subtype="PCM_16")
                cmd = ["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", str(tmp_wav), str(out_dir / f"{s['id']}-{i}.m4a")]
                for attempt in (1, 2):  # afconvert occasionally fails under memory pressure; retry once
                    r = subprocess.run(cmd, capture_output=True, text=True)
                    if r.returncode == 0:
                        break
                    print(f"afconvert failed (attempt {attempt}): {r.stderr.strip() or r.stdout.strip()}", flush=True)
                else:
                    raise SystemExit(f"could not encode {s['id']}-{i}")
                n += 1
                print(f"{s['id']}-{i} {len(wav) / tts.sr:.1f}s", flush=True)
    print(f"rendered {n} lines")


if __name__ == "__main__":
    main()
