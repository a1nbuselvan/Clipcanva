# Clipcanva Tab Capture

This Chromium extension captures the **currently visible browser tab only when
you click “Capture this tab.”** It does not detect operating-system screenshots,
observe other screenshot tools, or run a background capture service.

## Install for local testing

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `browser-extension` folder.
4. Pin the Clipcanva extension from the browser toolbar.
5. Open Clipcanva, click the extension on a website, and choose **Capture this
   tab**.
6. Choose **Download import bundle**, then in Clipcanva choose **Add → Import
   files** and select the downloaded `.clipcanva.json` file.

The bundle includes the screenshot, page title, capture time, and website origin.
The source origin intentionally omits the page path, query string, and fragment.
Captures are kept in the extension's local IndexedDB until cleared. They are
not uploaded to a server or added to the canvas automatically. Export the
bundle and import it in Clipcanva using **Add → Import files**. Screenshots may
contain sensitive information; only capture pages you are comfortable saving.

Browser-internal pages and other restricted tabs cannot be captured. Cloud
sync is handled by the signed-in Clipcanva app after you import the bundle.
