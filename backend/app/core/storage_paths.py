import os
import shutil
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1]
BUNDLED_DATA_DIR = APP_ROOT / "data"
RUNTIME_DATA_DIR = (
    Path("/tmp/clinical-curator-ai-data")
    if os.getenv("VERCEL")
    else BUNDLED_DATA_DIR
)


def runtime_data_path(filename: str) -> Path:
    RUNTIME_DATA_DIR.mkdir(parents=True, exist_ok=True)
    runtime_path = RUNTIME_DATA_DIR / filename
    bundled_path = BUNDLED_DATA_DIR / filename

    if runtime_path.exists():
        return runtime_path

    if bundled_path.exists():
        shutil.copy2(bundled_path, runtime_path)

    return runtime_path
