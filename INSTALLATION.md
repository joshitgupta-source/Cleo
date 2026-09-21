# Installation Guide for Cleo

Pre-packaged release builds are provided in the **[Releases](../../releases)** section:
* **`cleo-chromium.zip`**: For Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi, etc.
* **`cleo-firefox.zip`**: For Mozilla Firefox, Firefox Developer Edition, and Nightly.

---

## 1. Chromium-Based Browsers (Chrome, Edge, Brave, Vivaldi)

### Step 1: Extract the Archive
1. Download **`cleo-chromium.zip`** from the latest release.
2. Extract the ZIP into a permanent folder on your computer (e.g., `Documents/Cleo` or `AppData/Local/Cleo`).  
   > **Important:** Do not delete or move this folder after installing. Chromium runs unpacked extensions directly from their source folder.

---

### Step 2: Load into Your Browser

#### Google Chrome
1. Navigate to `chrome://extensions` in your address bar.
2. Toggle **Developer mode** in the top-right corner to **ON**.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the extracted `cleo-chromium` folder (the folder containing `manifest.json`).
5. Open a new tab (`Ctrl + T` / `Cmd + T`) to launch Cleo.

#### Microsoft Edge
1. Navigate to `edge://extensions` in your address bar.
2. In the left-hand sidebar (or top-right toggle), turn on **Developer mode**.
3. Click **Load unpacked** at the top of the page.
4. Select the extracted `cleo-chromium` folder.
5. If prompted by Edge to verify the new tab override, click **Keep changes**.

#### Brave Browser
1. Navigate to `brave://extensions` in your address bar.
2. Turn on the **Developer mode** toggle in the upper-right corner.
3. Click **Load unpacked** on the top toolbar.
4. Select the extracted `cleo-chromium` folder.
5. In Brave Settings (`brave://settings/newTab`), make sure **New tab page shows** is set to **Dashboard** or extension default.

---

## 2. Mozilla Firefox

### Option A: Standard Firefox (Temporary Installation)
Standard Firefox requires web extensions to be signed by Mozilla for permanent use, but allows loading unsigned packages via developer debugging:

1. Download **`cleo-firefox.zip`** from the latest release (do not extract).
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
3. Under the **Temporary Extensions** header, click **Load Temporary Add-on...**.
4. Select the downloaded **`cleo-firefox.zip`** file directly.
5. Open a new tab to start using Cleo.  
   *(Note: Firefox unloads temporary extensions when the browser is completely closed).*

---

### Option B: Firefox Developer Edition / Nightly (Permanent Installation)
If you use Firefox Developer Edition, Nightly, or unbranded builds, you can install the release permanently:

1. Go to `about:config` in your address bar and click **Accept the Risk and Continue**.
2. Search for:
   ```text
   xpinstall.signatures.required
3. Double-click the preference to toggle its value to **`false`**.
4. Download **`cleo-firefox.zip`** and rename the file extension from `.zip` to **`.xpi`** (e.g., `cleo-firefox.xpi`).
5. Go to `about:addons`, click the gear icon (⚙️) above your installed extensions, and select **Install Add-on From File...**.
6. Select `cleo-firefox.xpi` and click **Add** when prompted.

---

## Updating Cleo

When a new version is released:

1. Download the latest `cleo-chromium.zip` or `cleo-firefox.zip`.
2. Replace the contents of your existing extracted folder (for Chromium) or load the new file (for Firefox).
3. In your browser's extension page (`chrome://extensions` or `about:debugging`), click the **Reload (↻)** button on the Cleo tile.

---

## Troubleshooting

* **"Manifest file is missing or unreadable" (Chromium):** You selected an outer enclosing folder instead of the directory where `manifest.json` is located. Point the file picker directly to the folder containing `manifest.json`.
* **Browser asks to revert new tab:** Chromium browsers occasionally display a security banner confirming whether you want to keep the new tab page. Select **Keep changes** to keep Cleo active.
* **Settings backup:** Cleo saves configurations locally via `chrome.storage.local` and `localStorage`. Before clearing browser site data or reinstalling, use the **Export Settings** button in Cleo's customize panel to generate a `.json` backup.