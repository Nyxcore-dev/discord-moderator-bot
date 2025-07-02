/*
================================================================================
MULTI-LANGUAGE PROFANITY CONFIGURATION
================================================================================
CRITICAL NOTE: These word lists are STARTER PACKS and are not culturally perfect.
The severity of a word is highly dependent on context and region.
It is STRONGLY RECOMMENDED that you and your moderation team review, edit,
add, and remove words to fit your community's specific standards.
================================================================================
*/

const profanity = {
    // English
    en: {
        TIER_3_WORDS: ['cunt', 'nigger', 'faggot', 'kys', 'go kill yourself'],
        TIER_2_WORDS: ['bitch', 'slut', 'whore', 'retard', 'fuck'],
        TIER_1_WORDS: ['hell', 'damn', 'crap', 'piss', 'asshole'],
    },
    // Spanish (es) - REQUIRES REVIEW BY A NATIVE SPEAKER
    es: {
        TIER_3_WORDS: ['puta madre', 'gilipollas', 'maricón'],
        TIER_2_WORDS: ['puta', 'joder', 'coño', 'mierda', 'cabrón'],
        TIER_1_WORDS: ['hostia', 'cojones', 'culo'],
    },
    // French (fr) - REQUIRES REVIEW BY A NATIVE SPEAKER
    fr: {
        TIER_3_WORDS: ['enculé', 'fils de pute', 'nique ta mère'],
        TIER_2_WORDS: ['putain', 'merde', 'salope', 'connard', 'bâtard'],
        TIER_1_WORDS: ['cul', 'con', 'chier'],
    },
    // German (de) - REQUIRES REVIEW BY A NATIVE SPEAKER
    de: {
        TIER_3_WORDS: ['hurensohn', 'fotze', 'wichser'],
        TIER_2_WORDS: ['scheiße', 'arschloch', 'ficken', 'miststück'],
        TIER_1_WORDS: ['verdammt', 'arsch', 'mist'],
    },
    // Add other supported languages here...
    // it: {}, ja: {}, ko: {}, ru: {}, etc.
};

// --- DO NOT EDIT BELOW THIS LINE ---

// This function builds a single, massive regex for all words and a map to track each word's language and tier.
const buildMasterProfanityData = () => {
    const allWords = [];
    const wordMap = {};

    for (const langCode in profanity) {
        const tiers = profanity[langCode];
        for (const tierName in tiers) {
            const tierLevel = parseInt(tierName.match(/\d+/)[0], 10); // Extracts 1, 2, or 3
            for (const word of tiers[tierName]) {
                const lowerWord = word.toLowerCase();
                allWords.push(lowerWord.replace(/ /g, '\\s*')); // Handle spaces in multi-word phrases
                wordMap[lowerWord] = { lang: langCode, tier: tierLevel };
            }
        }
    }

    const regex = new RegExp(`\\b(${allWords.join('|')})\\b`, 'i');
    return { masterRegex: regex, wordMap: wordMap };
};

module.exports = buildMasterProfanityData();