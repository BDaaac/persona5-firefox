"""Build a self-contained Firefox add-on using only Python's standard library."""
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path

from runtime_files import RUNTIME_FILES

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]
unpacked = DIST / "firefox-unpacked"

# A fixed allowlist keeps backups, screenshots and agent configuration out.
files = ["manifest.json", *RUNTIME_FILES]

html = (ROOT / "index.html").read_text(encoding="utf-8")
assert not re.search(r"<script\b(?![^>]*\bsrc=)[^>]*>", html), "Inline scripts are not allowed"
assert not re.search(r"\son\w+\s*=", html), "Inline event handlers are not allowed"
assert manifest["chrome_url_overrides"]["newtab"] in files
assert manifest["chrome_settings_overrides"]["homepage"] in files
assert not manifest.get("permissions") and not manifest.get("host_permissions")
assert manifest["browser_specific_settings"]["gecko"]["data_collection_permissions"]["required"] == ["none"]
assert len(files) == len(set(files))

for name in files:
    assert (ROOT / name).is_file(), f"Missing package file: {name}"
    if name.endswith((".html", ".css")):
        source = (ROOT / name).read_text(encoding="utf-8")
        references = re.findall(r'(?:src|href)="(\./[^"?#]+)', source)
        references += re.findall(r"url\(['\"]?(\./[^)'\"]+)", source)
        for reference in references:
            resolved = ((ROOT / name).parent / reference).resolve().relative_to(ROOT).as_posix()
            assert resolved in files, f"Unbundled resource in {name}: {resolved}"

DIST.mkdir(exist_ok=True)
# Remove only files previously generated inside our own unpacked directory.
if unpacked.exists():
    assert unpacked.resolve() == (ROOT / "dist" / "firefox-unpacked").resolve()
    shutil.rmtree(unpacked)
unpacked.mkdir()
for name in files:
    target = unpacked / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / name, target)

package = DIST / f"phantom-start-{version}-unsigned.xpi"
with zipfile.ZipFile(package, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in sorted(files):
        info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, (ROOT / name).read_bytes())
with zipfile.ZipFile(package) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == set(files)
upload = package.with_name(f"phantom-start-{version}-amo-upload.zip")
shutil.copyfile(package, upload)
digest = hashlib.sha256(package.read_bytes()).hexdigest()
(DIST / "SHA256SUMS.txt").write_text(f"{digest}  {package.name}\n{digest}  {upload.name}\n", encoding="utf-8")
print(f"PASS: {len(files)} local files, all HTML/CSS references bundled, no inline scripts or broad permissions")
print(f"Unsigned add-on: {package} ({package.stat().st_size:,} bytes)")
print(f"Mozilla upload: {upload}")
print(f"Temporary test: {unpacked / 'manifest.json'}")
print(f"SHA-256: {digest}")
