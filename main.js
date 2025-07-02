const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
// Read secrets from environment variables
const token = process.env.token;
const ownerId = process.env.ownerId;

// Exit if secrets are not provided
if (!token || !ownerId) {
    console.error('FATAL ERROR: Missing required environment variables (token, ownerId). Please set them in your hosting provider\'s secrets/variables manager.');
    process.exit(1);
}
const { masterRegex, wordMap } = require('./profanity.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const userWarnings = new Map(); // Tracks user offenses for non-severe violations

// --- Dictionary API Function (Now with language support) ---
async function getDefinition(word, langCode) {
    // The API uses 'en' for English, but other codes are standard.
    const apiLangCode = langCode === 'en' ? 'en_US' : langCode;
    try {
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/${apiLangCode}/${word}`);
        const definition = response.data[0]?.meanings[0]?.definitions[0]?.definition;
        return definition || 'No definition found.';
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return 'No definition found for this word.';
        }
        console.error(`Error fetching definition for '${word}' in '${apiLangCode}':`, error.message);
        return 'Could not retrieve definition due to an API error.';
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const owner = await client.users.fetch(ownerId).catch(() => null);
    const content = message.content;
    const user = message.author;
    const member = message.member;

    // --- Command to explain profanity tiers ---
    if (message.content.toLowerCase() === '!wordcategories') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Profanity Filter Categories')
            .setDescription('Our moderation bot categorizes inappropriate language into three tiers to determine the severity of an infraction.')
            .addFields(
                { name: 'Tier 1: Minor Violations', value: 'General profanity. Contributes to the 3-strike system (Warn -> Mute -> Ban).' },
                { name: 'Tier 2: Major Violations', value: 'Serious insults and slurs. Also contributes to the 3-strike system.' },
                { name: 'Tier 3: Severe Violations', value: 'Zero-tolerance words (e.g., hate speech). Results in an immediate and permanent ban.' }
            )
            .setFooter({ text: 'This system supports multiple languages. For privacy and safety, the specific words in each tier are not listed publicly.' });

        await message.channel.send({ embeds: [embed] });
        return;
    }

    // --- Multi-Language Profanity Check ---
    const match = content.match(masterRegex);
    if (match) {
        const offendingWord = match[1].toLowerCase();
        const wordInfo = wordMap[offendingWord.replace(/\s*/g, '')]; // Look up the word in our map

        if (!wordInfo) return; // Should not happen, but a good safeguard

        const { lang, tier } = wordInfo;

        await message.delete();

        const definition = await getDefinition(offendingWord, lang);
        const dmEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Multi-Lingual Moderation Report')
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Language Detected', value: lang.toUpperCase(), inline: true },
                { name: 'Offending Word', value: `||${offendingWord}||`, inline: false },
                { name: 'Word Definition', value: definition, inline: false }
            );

        // Tier 3 Words: Instant Ban
        if (tier === 3) {
            try {
                dmEmbed.addFields({ name: 'Action Taken', value: `Immediate Ban (Tier 3 Violation)`, inline: false });
                await owner?.send({ embeds: [dmEmbed] });
                await member.ban({ reason: `Tier 3 Profanity Violation (${lang}): Used word '${offendingWord}'` });
                await message.channel.send(`**${user.tag} has been permanently banned for a severe rule violation.**`);
                console.log(`Banned ${user.tag} for Tier 3 violation in ${lang}.`);
            } catch (error) {
                console.error(`Failed to ban ${user.tag}:`, error);
            }
            return;
        }

        // Tier 1 & 2 Words: 3-Strike System
        const offenses = (userWarnings.get(user.id) || 0) + 1;
        userWarnings.set(user.id, offenses);
        const reason = `Profanity Violation (Tier ${tier} - ${lang})`;

        try {
            switch (offenses) {
                case 1:
                    dmEmbed.addFields({ name: 'Action Taken', value: 'Warning (1st Offense)', inline: false });
                    await owner?.send({ embeds: [dmEmbed] });
                    await message.channel.send(`**Warning for ${user.tag}**: Please refrain from using inappropriate language. This is your 1st offense.`);
                    break;
                case 2:
                    dmEmbed.addFields({ name: 'Action Taken', value: '10-Minute Mute (2nd Offense)', inline: false });
                    await owner?.send({ embeds: [dmEmbed] });
                    await member.timeout(10 * 60 * 1000, reason);
                    await message.channel.send(`**${user.tag} has been muted for 10 minutes** for a 2nd offense.`);
                    break;
                case 3:
                    dmEmbed.addFields({ name: 'Action Taken', value: 'Permanent Ban (3rd Offense)', inline: false });
                    await owner?.send({ embeds: [dmEmbed] });
                    await member.ban({ reason: `3rd Profanity Offense (${lang})` });
                    await message.channel.send(`**${user.tag} has been permanently banned** for a 3rd offense.`);
                    userWarnings.delete(user.id);
                    break;
            }
        } catch (error) {
            console.error(`Failed to moderate ${user.tag}:`, error);
        }
        return;
    }

    // --- Other Rules (Spam, Caps, Invites) ---
    const otherRules = {
        SPAM: { regex: /(.)\1{15,}/i, message: 'Please avoid spamming.' },
        EXCESSIVE_CAPS: { regex: /^[A-Z\s]{20,}$/, message: 'Please avoid using excessive caps.' },
        DISCORD_INVITES: { regex: /discord\.gg\/[a-zA-Z0-9]+/i, message: 'Invite links are not allowed.' },
    };

    for (const ruleName in otherRules) {
        if (otherRules[ruleName].regex.test(content)) {
            await message.delete();
            const reply = await message.channel.send(`**Warning for ${user.tag}**: ${otherRules[ruleName].message}`);
            setTimeout(() => reply.delete(), 10000);
            await owner?.send(`Warned ${user.tag} for **${ruleName}** in #${message.channel.name}.`);
            break;
        }
    }
});

client.login(token);