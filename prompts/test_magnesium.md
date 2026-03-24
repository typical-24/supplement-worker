# Test Magnesium

You are working on an existing Telegram supplement bot.

The bot already:
- receives Telegram messages
- parses supplement inputs like "Magnesium 400 mg"
- creates entries in Notion
- counts daily portions

Task:
Ensure Magnesium works as the reference supplement in the system.

Requirements:

Supplement:
Magnesium

Evidence:
★★★ Stark

Examine link:
https://examine.com/supplements/magnesium/

Suggested stack:
Vitamin D3
Zinc

Expected Telegram confirmation output:

Eingetragen
Magnesium — 400 mg

Portion 1

★★★ Stark

Suggested stack
Vitamin D3 + Zinc

https://examine.com/supplements/magnesium/

Rules:

Do NOT break existing functionality.

Do NOT change the Notion payload structure.

Keep the existing functions unchanged:

parseSupplementInput()
createNotionEntry()
getTodayMaxPortion()
sendTelegramMessage()

Only add minimal logic necessary to support Magnesium metadata.