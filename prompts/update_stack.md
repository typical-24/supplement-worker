# Update Stack

You are working on an existing Telegram supplement bot.

The bot already:
- receives supplement messages from Telegram
- stores supplement entries in Notion
- shows evidence information
- shows a suggested stack for supported supplements

Task:
Update the suggested stack behavior for one or more supplements without changing unrelated logic.

Requirements:

Behavior:
- keep the current message format
- update stack recommendations through the smallest possible change
- return a clean display string like "Vitamin D3 + Zinc"
- keep unsupported supplements returning no suggested stack

Implementation rules:
- prefer a metadata map or similarly simple lookup
- avoid hard-coding more one-off conditionals
- keep supplement matching normalized and case-insensitive
- preserve all existing Notion behavior

Expected Telegram confirmation output shape:

Eingetragen
Supplement Name - 400 mg

Portion 1
Stark

Suggested stack
Vitamin D3 + Zinc

https://examine.com/supplements/example/

Do NOT break existing functionality.

Do NOT change the Notion payload structure.

Keep the existing functions unchanged unless the update requires a minimal targeted refactor:

parseSupplementInput()
createNotionEntry()
getTodayMaxPortion()
sendTelegramMessage()

Preferred approach:
- keep stack logic centralized
- make future stack updates easy to extend
- avoid touching request handling or Notion request code
