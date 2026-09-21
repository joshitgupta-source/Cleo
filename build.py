import json
import os
import shutil
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
BASE_MANIFEST_PATH = os.path.join(PROJECT_ROOT, "manifest.json")

# Folders and standalone files to bundle into releases
INCLUDE_DIRS = ["css", "js", "icons", "libs"]
INCLUDE_FILES = ["newtab.html", "preload.js", "background.js"]

TARGETS = {
    "chrome": "manifest.chrome.json",
    "firefox": "manifest.firefox.json"
}


def sync_and_get_version():
    """Reads the master version from manifest.json and syncs it to target manifests."""
    if not os.path.exists(BASE_MANIFEST_PATH):
        raise FileNotFoundError(f"Base manifest not found at: {BASE_MANIFEST_PATH}")

    with open(BASE_MANIFEST_PATH, "r", encoding="utf-8") as f:
        base_data = json.load(f)

    version = base_data.get("version", "1.0.0")

    # Propagate the version to browser-specific manifest source files
    for target_name, manifest_rel_path in TARGETS.items():
        target_path = os.path.join(PROJECT_ROOT, manifest_rel_path)
        if os.path.exists(target_path):
            with open(target_path, "r", encoding="utf-8") as f:
                target_data = json.load(f)

            if target_data.get("version") != version:
                target_data["version"] = version
                with open(target_path, "w", encoding="utf-8") as f:
                    json.dump(target_data, f, indent=2)
                    f.write("\n")
                print(f"  ↳ Updated {manifest_rel_path} version to {version}")

    return version


def create_bundle(target_name, manifest_source, version):
    """Creates a versioned release folder and zip archive."""
    bundle_name = f"cleo-{target_name}-v{version}"
    target_dir = os.path.join(DIST_DIR, bundle_name)
    zip_path = os.path.join(DIST_DIR, f"{bundle_name}.zip")

    # Clear previous builds of this version if present
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    # Copy resource folders
    for folder in INCLUDE_DIRS:
        src = os.path.join(PROJECT_ROOT, folder)
        if os.path.exists(src):
            shutil.copytree(
                src,
                os.path.join(target_dir, folder),
                ignore=shutil.ignore_patterns(".DS_Store", "Thumbs.db", "*.pyc")
            )

    # Copy top-level files
    for file in INCLUDE_FILES:
        src = os.path.join(PROJECT_ROOT, file)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(target_dir, file))

    # Copy the target manifest as the production 'manifest.json'
    manifest_src = os.path.join(PROJECT_ROOT, manifest_source)
    shutil.copy2(manifest_src, os.path.join(target_dir, "manifest.json"))

    # Compress into a zip archive
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(target_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, target_dir)
                zipf.write(abs_path, rel_path)

    print(f"✓ Built {target_name.capitalize()} release: dist/{bundle_name}.zip")


def main():
    os.makedirs(DIST_DIR, exist_ok=True)

    print("Checking and syncing extension version...")
    version = sync_and_get_version()
    print(f"Current version: v{version}\n")

    for target, manifest_file in TARGETS.items():
        create_bundle(target, manifest_file, version)

    print("\nAll browser builds generated successfully.")


if __name__ == "__main__":
    main()