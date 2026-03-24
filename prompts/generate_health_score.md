# Generate Health Score

You are working on an existing Telegram supplement bot.

The bot already:
- receives Telegram messages
- parses supplement entries
- stores data in Notion
- reads today's entries to determine daily portions
- sends Telegram confirmations

Task:
Add a simple health score feature based on the supplements recorded today.

Requirements:

Behavior:
- add a Telegram command that generates a daily health score summary
- read today's supplement entries from Notion
- calculate a deterministic score from the supplements found today
- include a short explanation of how the score was derived
- return a friendly Telegram message with the score and the supplements counted

Implementation rules:
- keep the scoring logic simple and transparent
- prefer using existing evidence metadata as one scoring input
- handle duplicate entries predictably
- return a sensible fallback if no supplements were logged today
- keep the feature isolated from the normal supplement entry flow

Suggested output shape:

Health Score
78/100

Counted today
Magnesium
Vitamin D3
Omega-3

Reasoning
Strong-evidence supplements increased the score.

Do NOT break existing functionality.

Do NOT change the existing Notion entry payload structure for supplement logging.

Keep the current supplement entry path intact:

parseSupplementInput()
createNotionEntry()
getTodayMaxPortion()
sendTelegramMessage()

Preferred approach:
- add one focused command handler for the score request
- add one helper to query today's supplements from Notion
- add one helper to compute the score from known metadata
- keep all new logic small and testable
