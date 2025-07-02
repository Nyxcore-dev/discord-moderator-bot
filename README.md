# Luxcrypt Multi-Lingual Moderator Bot

This is an advanced, multi-lingual Discord moderation bot designed to help keep your server safe and respectful. It automatically detects and acts upon rule violations, including profanity in multiple languages, spam, excessive caps, and invite links.

## Key Features

- **Multi-Lingual Profanity Filter:** Detects and moderates inappropriate language in English, Spanish, French, and German.
- **Tiered Enforcement System:**
  - **Tier 1 & 2 Violations:** Follow a 3-strike system (Warning -> 10-Minute Mute -> Permanent Ban).
  - **Tier 3 Violations:** Severe, zero-tolerance words result in an immediate, permanent ban.
- **Advanced Owner Reports:** For every profanity-related action, the server owner receives a detailed Direct Message including the offending word, its dictionary definition, the language detected, and the action taken.
- **Simple Rule Enforcement:** Handles spam, excessive caps, and invite links with a simple warning and message deletion.
- **`!wordcategories` Command:** Allows any user to see an explanation of the profanity tiers without revealing the word lists.

## Configuration

1.  **`config.json`:** Before running the bot, you must fill in this file:
    - `token`: Your Discord bot's token.
    - `ownerId`: Your Discord user ID, so the bot can send you moderation reports.
2.  **`profanity.js`:** This file contains the word lists for all supported languages. You can and should customize these lists to fit your community's standards.

## 24/7 Hosting

To run this bot 24/7, it must be deployed on a hosting service that supports long-running Node.js applications, such as:
- **PaaS:** Railway.app, Fly.io, Heroku
- **VPS:** Oracle Cloud, DigitalOcean, AWS Lightsail

---

**Disclaimer:** The profanity lists included are starter packs and may not be culturally perfect for every community. It is strongly recommended that a native speaker for each language reviews and customizes the lists in `profanity.js`.