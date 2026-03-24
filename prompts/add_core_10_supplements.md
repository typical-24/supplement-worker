# Add Core 10 Supplements

You are working on an existing Telegram supplement bot.

The bot already:
- receives Telegram messages
- parses supplement inputs like "Magnesium 400 mg"
- creates entries in Notion
- adds Examine links and evidence labels for known supplements
- counts daily portions
- shows suggested stack recommendations for supported supplements

Task:
Add support for a core set of 10 supplements using the existing metadata-driven approach.

Core supplements to support:
- Magnesium
- Vitamin D3
- Vitamin D3+K2
- Omega-3
- Omega-3 DHA
- Kreatin
- Zink
- Eisen
- Selen
- Jod

Requirements:

Behavior:
- each supplement must resolve to the correct Examine slug
- each supplement must have an evidence label
- aliases and common input variants should still match
- existing Telegram confirmation formatting must stay intact
- suggested stack output should continue to work for supplements that define one

Implementation rules:
- use the existing metadata maps instead of introducing a new system
- keep supplement matching normalized and case-insensitive
- preserve the current parsing behavior for amount and unit
- preserve current portion-counting behavior
- avoid changing request handling unless it is required for metadata support

Expected Telegram confirmation output shape:

Eingetragen
Magnesium - 400 mg

Portion 1
Stark

Suggested stack
Vitamin D3 + Zinc

https://examine.com/supplements/magnesium/

Rules:

Do NOT break existing functionality.

Do NOT change the Notion payload structure.

Keep the existing functions unchanged unless a minimal targeted update is required:

parseSupplementInput()
createNotionEntry()
getTodayMaxPortion()
sendTelegramMessage()

Preferred approach:
- add or update entries in the existing metadata maps
- keep the implementation minimal and easy to extend
- only change helper logic when a metadata entry alone is not sufficient

Expected result:
- all 10 core supplements can be entered through Telegram
- each supported supplement gets the expected Examine link and evidence value
- Notion entry creation works exactly as before
- confirmation messages still include portion, evidence, suggested stack, and source link when available
