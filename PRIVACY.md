# Privacy Policy for Cleo - Custom New Tab

**Last Updated:** August 2026

Cleo is built from the ground up with a privacy-first architecture. All features and data processing run entirely within your local browser environment. Cleo does not collect, track, log, or transmit any personal data, browsing history, or usage statistics to external servers or third parties.

---

## Permissions & Data Usage

Cleo requests only the minimum set of browser permissions required to deliver its core dashboard functionality:

* **Storage (`storage`):** Used to persist your dashboard configurations (custom colors, fonts, layout settings, pinned bookmarks, and timer preferences) locally via `chrome.storage.local` and `localStorage`. This data never leaves your device.
* **Top Sites (`topSites`):** Used solely to display your most frequently visited sites in the shortcut grid when "Most Visited Sites" is enabled. This data is read in-memory to construct the speed dial and is never stored permanently or transmitted off your machine.
* **Favicons (`favicon`):** Used to display high-resolution website icons for your speed dial tiles and search engine selector. Favicon luminance analysis for smart contrast adjustment is executed entirely on a client-side HTML5 canvas.
* **Alarms (`alarms`):** Used strictly by the background service worker to maintain accurate countdown timing for the integrated Pomodoro focus timer across browser tabs.
* **Notifications (`notifications`):** Used to display native desktop notifications when a Pomodoro focus session or break interval completes.

---

## Search Queries & Outgoing Requests

* **Direct Search Routing:** When you submit a search query, Cleo directs your browser straight to your selected search provider (e.g., Google, DuckDuckGo, Brave, Startpage, Kagi, etc.) using standard URL parameters. Cleo does not route searches through intermediary proxy servers, log query strings, or inject affiliate trackers.
* **Zero External Telemetry:** Cleo contains no analytics scripts, tracking pixels, crash reporters, or external API dependencies. The extension operates 100% offline (with the sole exception of loading external search engine result pages upon user submission).

---

## Backup & Data Portability

* **Local Import / Export:** Cleo’s backup and restore functionality uses browser-native `Blob` and `FileReader` APIs to generate and parse local `.json` configuration files. Backup files are saved directly to your local download directory and are never uploaded to remote servers.

---

## Third-Party Disclosures

Cleo does not sell, lease, or share any user data. Because the extension collects no information, no user data is shared with third parties, advertisers, or analytics providers.

---

## Changes to This Policy

If changes are made to Cleo's privacy policy, the updated document will be published directly in the extension's repository with a revised effective date.

---

## Contact

For questions or feedback regarding this privacy policy, please open an issue on the official GitHub repository or contact:

**Developer:** Joshit Gupta

**Email:** `joshitgupta@gmail.com`