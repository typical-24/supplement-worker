# Add Supplement

You are working on an existing Telegram supplement bot.

The bot already:
- receives Telegram messages
- parses supplement inputs like "Magnesium 400 mg"
- creates entries in Notion
- adds Examine links and evidence labels for known supplements
- counts daily portions

Task:
Add support for one new supplement with minimal code changes.

Requirements:

Behavior:
- extend the existing supplement metadata maps instead of adding a new architecture
- support one additional supplement name and its aliases
- include its Examine link when available
- include its evidence label when available
- include its suggested stack when defined
- preserve current Telegram confirmation formatting

Implementation rules:
- use the existing metadata-driven approach
- keep matching case-insensitive
- preserve current parsing behavior for amount and unit
- do not introduce breaking changes for existing supplements

Do NOT break existing functionality.

Do NOT change the Notion payload structure.

Keep the existing functions unchanged unless a minimal targeted update is required:

parseSupplementInput()
createNotionEntry()
getTodayMaxPortion()
sendTelegramMessage()

Preferred approach:
- add or update entries in the existing metadata maps
- only touch helper logic if the new supplement cannot be supported otherwise

Expected result:
- the new supplement can be entered through Telegram
- the Notion entry is created exactly as before
- the Telegram confirmation includes portion, evidence, suggested stack, and Examine link when applicable
