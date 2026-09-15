# Google Sheets submission bridge

This Apps Script appends roster rows to the `Roster Submissions` tab in the Big Hurt spreadsheet.

The current sheet columns are: submission details, a blank `Team Number` column for race staff to fill in later, and the four event assignments. On the first submission after this update, the script automatically removes the old event email columns and inserts `Team Number`. Do not rename the existing tab.

When race staff enters a team number in one row, the bound `onEdit` handler fills that number into other rows with the same team name when their team-number cell is blank.

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
wrangler pages secret put APPS_SCRIPT_URL --project-name big-hurt-team-roster
wrangler pages secret put SUBMISSION_SECRET --project-name big-hurt-team-roster
```

Do not commit the secret or put it in `index.html`.
