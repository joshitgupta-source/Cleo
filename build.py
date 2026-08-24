import os
import shutil
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")

INCLUDE_DIRS = ["css", "js", "icons"]
INCLUDE_FILES = ["newtab.html", "preload.js", "background.js"]

TARGETS = {
    "chrome": "manifest.chrome.json",
    "firefox": "manifest.firefox.json"
}

def create_bundle(target_name, manifest_source):
    target_dir = os.path.join(DIST_DIR, target_name)
    zip_path = os.path.join(DIST_DIR, f"cleo-{target_name}.zip")
    
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    # 1. Copy common asset directories
    for folder in INCLUDE_DIRS:
        src = os.path.join(PROJECT_ROOT, folder)
        if os.path.exists(src):
            shutil.copytree(src, os.path.join(target_dir, folder))

    # 2. Copy root files
    for file in INCLUDE_FILES:
        src = os.path.join(PROJECT_ROOT, file)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(target_dir, file))

    # 3. Copy target manifest as manifest.json
    shutil.copy2(os.path.join(PROJECT_ROOT, manifest_source), os.path.join(target_dir, "manifest.json"))

    # 4. Create upload-ready .zip
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(target_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, target_dir)
                zipf.write(abs_path, rel_path)

    print(f"✓ Built {target_name.capitalize()} release: dist/cleo-{target_name}.zip")

def main():
    os.makedirs(DIST_DIR, exist_ok=True)
    for target, manifest_file in TARGETS.items():
        create_bundle(target, manifest_file)
    print("\nAll browser builds generated successfully.")

if __name__ == "__main__":
    main()