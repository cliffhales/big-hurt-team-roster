# Google Sheets submission bridge

This Apps Script appends roster rows to the `Roster Submissions` tab in the Big Hurt spreadsheet.

1. Open the spreadsheet and choose **Extensions → Apps Script**.
2. Replace the starter code with the contents of `Code.gs`.
3. In Apps Script, open **Project Settings → Script properties** and add:
   - Property: `SUBMISSION_SECRET`
   - Value: a long random string you create and keep private.
4. Click **Deploy → New deployment**.
5. Select **Web app**.
6. Set **Execute as** to yourself and **Who has access** to anyone with the link.
7. Deploy, authorize the script, and copy the web app URL.

The Cloudflare Pages Function uses that URL and the same secret. Configure them from the repository directory with Wrangler:

```bash
wrangler pages secret put APPS_SCRIPT_URL --project-name big-hurt-survey
wrangler pages secret put SUBMISSION_SECRET --project-name big-hurt-survey
```

Do not commit the secret or put it in `index.html`.
