# Privacy Policy for Cleo - Custom New Tab

**Last Updated:** September 2026

Cleo is built from the ground up with an uncompromising privacy-first architecture. All features, theme computations, image processing, and data storage execute entirely within your local browser sandbox. Cleo does not collect, track, log, monetize, or transmit your personal data, browsing history, or search queries to remote servers or third-party analytics services.

---

## Permissions & Data Usage

Cleo requests only the minimal set of browser permissions required to deliver its core dashboard features:

* **Storage (`storage`):** Used to persist dashboard preferences—such as custom color hexes, typography choices, grid alignment (`left` vs `center`), layout lock status, curated shortcuts, hidden dynamic site lists, and Pomodoro timer preferences—locally via `chrome.storage.local` and `localStorage`. This data remains sandboxed on your device and is never synchronized to external servers.
* **Top Sites (`topSites`):** Used solely to display frequently visited websites in the shortcut grid when "Most Visited Sites" is active. This data is read in-memory to populate speed-dial tiles. Cleo does not log, export, or track your browsing habits. Any hidden items are maintained in a local exclusion list stored on your device.
* **Favicons (`favicon`):** Used to display official website icons within speed-dial tiles and the search engine selector. Icon luminance and contrast calculations are performed in-memory via client-side HTML5 canvas APIs to automatically invert monochromatic graphics over contrasting backgrounds.
* **Alarms (`alarms`):** Used strictly by the background service worker to track countdown intervals for the integrated Pomodoro focus timer across browser tabs without keeping CPU-intensive loops active.
* **Notifications (`notifications`):** Used exclusively to dispatch native desktop notifications when Pomodoro focus sessions or break intervals start or finish.

---

## Local Media & Image Processing

* **Client-Side Wallpaper Decoding:** When you upload custom wallpapers (including formats such as PNG, JPEG, WebP, SVG, AVIF, HEIC, and TIFF), all decoding and image compression are handled in-memory using dedicated client-side Web Workers and bundled utilities.
* **Dominant Color Extraction:** Automated theme adaptation samples pixel data directly through an HTML5 `<canvas>` element using browser-native APIs. Images and extracted palette values are never uploaded to cloud processing services or external endpoints.

---

## Outgoing Network Requests & External Services

* **Direct Search Routing:** Submitting an inquiry in the search bar routes directly from your browser to your selected search provider (such as Google, DuckDuckGo, Brave, Startpage, Kagi, Bing, Yahoo, Qwant, or Ecosia) via standard URL parameters. Cleo does not intercept, redirect through intermediary proxy servers, inspect, or log your search queries.
* **Favicon Fallback Retrieval:** If the internal browser cache lacks a valid high-resolution icon for an external domain, Cleo queries public favicon resolvers (such as DuckDuckGo’s icon endpoint) transmitting only the destination hostname. No personal identifiers, cookies, or referral headers are attached.
* **Zero Telemetry:** Cleo contains zero tracking scripts, analytics SDKs, session recording tools, or error-reporting beacons. The extension functions fully offline (excluding external searches initiated by the user).

---

## Backup & Data Portability

* **Local Configuration Archives:** Cleo's export tool generates a clean, unencrypted `.json` snapshot of your locally saved dashboard settings, shortcut URLs, and timer preferences using browser-native `Blob` and `FileReader` APIs. 
* **Isolated Import:** Restoring configurations overwrites existing sandbox keys locally with zero data transmitted across the network.

---

## Third-Party Disclosures

Cleo does not sell, lease, exchange, or transfer user information to third parties, advertising networks, or data brokers.

---

## Policy Updates

Any future revisions or adjustments to this privacy policy will be documented and published directly to the project's public repository alongside an updated effective date.

---

## Contact

For inquiries or clarification regarding this privacy policy, open an issue on the official GitHub repository or reach out directly:

**Developer:** Joshit Gupta  
**Email:** `joshitgupta@gmail.com`