"""Build only the static website files for GitHub Pages. No dependencies."""
import re
import shutil
from pathlib import Path

from runtime_files import RUNTIME_FILES

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist" / "pages-site"

assert len(RUNTIME_FILES) == len(set(RUNTIME_FILES))
for name in RUNTIME_FILES:
    source = ROOT / name
    assert source.is_file(), f"Missing runtime file: {name}"
    assert source.resolve().is_relative_to(ROOT)
    if source.suffix in (".html", ".css"):
        text = source.read_text(encoding="utf-8")
        references = re.findall(r'(?:src|href)="(\./[^"?#]+)', text)
        references += re.findall(r"url\(['\"]?(\./[^)'\"]+)", text)
        for reference in references:
            resolved = (source.parent / reference).resolve().relative_to(ROOT).as_posix()
            assert resolved in RUNTIME_FILES, f"Missing resource in {name}: {resolved}"

if OUTPUT.exists():
    assert OUTPUT.resolve() == (ROOT / "dist" / "pages-site").resolve()
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir(parents=True)
for name in RUNTIME_FILES:
    target = OUTPUT / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / name, target)
(OUTPUT / ".nojekyll").write_text("", encoding="utf-8")
assert {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob("*") if p.is_file()} == {*RUNTIME_FILES, ".nojekyll"}
print(f"PASS: {len(RUNTIME_FILES)} runtime files + .nojekyll, all HTML/CSS resources included")
print(f"GitHub Pages website: {OUTPUT}")
