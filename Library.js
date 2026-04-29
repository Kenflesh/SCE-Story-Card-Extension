//Other code here

// ============================================================================
// StoryCard Extension
// ============================================================================

const CONFIG_CARD_TITLE = "SCE Config";
const DEFAULT_CONFIG = {
    randomCardChance: 0.0,
    randomEventChance: 0.05,
    useOnlyAutouseCards: false,
    eventDuration: 2,
    useEventWeights: true,
    useCardWeights: true,
    currentEventTitle: "",
    currentEventDurationLeft: 0,
    alwaysIncludeCards: [],
    contextRecallEnabled: true,
    contextRecallThreshold: 0.03,
    contextWindowChars: 10000,
    contextRecallMaxCards: 3,
    customStopWords: [],
    recallInsertPosition: "bot"
};

// ============================================================================
// Help functions
// ============================================================================

function getCardText(card) {
    if (card.entry) return card.entry;
    if (card.value) return card.value;
    if (card.content) return card.content;
    if (card.description) return card.description;
    if (card.text) return card.text;
    if (card.keys && card.keys.entry) return card.keys.entry;
    return null;
}

function getCardTitle(card) {
    return card.title || (card.keys && card.keys.title) || '';
}

function setCardText(card, newText) {
    if (card.entry !== undefined) {
        card.entry = newText;
    } else if (card.value !== undefined) {
        card.value = newText;
    } else if (card.content !== undefined) {
        card.content = newText;
    } else if (card.description !== undefined) {
        card.description = newText;
    } else if (card.text !== undefined) {
        card.text = newText;
    } else if (card.keys && card.keys.entry !== undefined) {
        card.keys.entry = newText;
    } else {
        card.entry = newText;
    }
}

function hasAutouseTrigger(card) {
    let keys = card.keys;
    if (!keys) return false;
    let keysStr = Array.isArray(keys) ? keys.join(' ') : keys;
    return keysStr.toLowerCase().includes('autouse');
}

function isEventCard(card) {
    let cardType = card.type || (card.keys && card.keys.type);
    let customType = card.customType || (card.keys && card.keys.customType);
    if (cardType === 'Event') return true;
    if (cardType === 'Custom' && customType === 'Event') return true;
    if (card.keys && card.keys.type === 'Custom' && card.keys.customType === 'Event') return true;
    return false;
}

function getAllStoryCards() {
    let cards = [];
    if (typeof storyCards !== 'undefined' && Array.isArray(storyCards)) cards = cards.concat(storyCards);
    if (typeof worldInfo !== 'undefined' && worldInfo && Array.isArray(worldInfo.storyCards)) cards = cards.concat(worldInfo.storyCards);
    if (typeof state !== 'undefined' && state && state.worldInfo && Array.isArray(state.worldInfo.storyCards)) cards = cards.concat(state.worldInfo.storyCards);
    if (typeof window !== 'undefined' && Array.isArray(window.storyCards)) cards = cards.concat(window.storyCards);
    return cards.length > 0 ? cards : null;
}

function categorizeCards(allCards, useOnlyAutouse) {
    let eventCards = [];
    let regularCandidates = [];
    for (let card of allCards) {
        let title = getCardTitle(card);
        if (title.toLowerCase().includes('config')) continue;

        if (isEventCard(card)) {
            eventCards.push(card);
        } else {
            regularCandidates.push(card);
        }
    }
    let regularCards = useOnlyAutouse
        ? regularCandidates.filter(card => hasAutouseTrigger(card))
        : regularCandidates;
    return { eventCards, regularCards };
}

// ============================================================================
// Blocks creating
// ============================================================================

function formatAlwaysCardsBlock(cards) {
    if (!cards || cards.length === 0) return null;
    let entries = [];
    for (let card of cards) {
        let title = getCardTitle(card);
        let content = getCardText(card);
        if (content) {
            entries.push(`${title}: ${content};`);
        }
    }
    if (entries.length === 0) return null;
    return `[World Info:\n${entries.join('\n')}]`;
}

function formatRandomCard(card) {
    let title = getCardTitle(card);
    let content = getCardText(card);
    if (!content) return null;
    return `[Use the following information to enrich the story if it fits the current context:\n${title}. ${content}]`;
}

function formatEventCard(card) {
    let title = getCardTitle(card);
    let content = getCardText(card);
    if (!content) return null;
    return `[The following event may occur: ${title}. ${content}. Describe it if there are no contradictions.]`;
}

function formatRecallSingle(cards) {
    if (!cards || cards.length === 0) return null;
    let items = [];
    for (let card of cards) {
        let title = getCardTitle(card);
        let content = getCardText(card);
        if (content) {
            items.push(`• ${title}:\n${content};`);
        }
    }
    if (items.length === 0) return null;
    return `[The following information may be relevant to the current context:\n${items.join('\n')}]`;
}

function formatHierarchy(cards, definedSet) {
    if (!cards || cards.length === 0) return null;
    let items = [];
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let title = getCardTitle(card);
        let content = getCardText(card);
        if (!content) continue;
        
        let indent = "  ".repeat(i);
        let parentNote = "";
        if (i > 0) {
            let parentTitle = getCardTitle(cards[i-1]);
            parentNote = ` (part of ${parentTitle})`;
        }
        
        if (definedSet && definedSet.has(title)) {
            if (i === 0) {
                items.push(`${indent}• ${title}`);
            } else {
                items.push(`${indent}• ${title}${parentNote}`);
            }
        } else {
            items.push(`${indent}• ${title}${parentNote}:\n${indent}  ${content};`);
        }
    }
    if (items.length === 0) return null;
    return items.join('\n');
}

function formatAllHierarchies(hierarchyStrings) {
    if (!hierarchyStrings || hierarchyStrings.length === 0) return null;
    let blocks = [];
    for (let i = 0; i < hierarchyStrings.length; i++) {
        blocks.push(`{Hierarchy ${i+1}.\n${hierarchyStrings[i]}}`);
    }
    let combined = blocks.join('\n\n');
    return `[Current hierarchies (each sub-item is part of the parent item above):\n${combined}\n]`;
}

function formatDefinitionsBlock(cards) {
    if (!cards || cards.length === 0) return null;
    let items = [];
    for (let card of cards) {
        let title = getCardTitle(card);
        let content = getCardText(card);
        if (!content) continue;
        let parentTitle = getCardParent(card);
        let displayTitle = title;
        if (parentTitle) {
            displayTitle = `${title} (part of ${parentTitle})`;
        }
        items.push(`• ${displayTitle}:\n  ${content};`);
    }
    if (items.length === 0) return null;
    return `[In the current context, the following terms refer to:\n${items.join('\n')}]`;
}

function formatRecallCandidate(candidate, definedSet) {
    if (candidate.type === 'single') {
        return formatRecallSingle(candidate.cards);
    } else {
        return formatHierarchy(candidate.cards, definedSet);
    }
}

// ============================================================================
// Config card
// ============================================================================

function generateConfigHelpText() {
    return `===============================================
STORY CARD EXTENSION CONFIGURATION GUIDE
===============================================

This card stores settings for the StoryCard Extension script.
Edit the values below, then save the card. The script will automatically use the new settings.

-------------------------------------------------------
GENERAL
-------------------------------------------------------
useOnlyAutouseCards = true/false
  - true: Only cards with the trigger "autouse" will ever be used.
  - false: All story cards (except Events) are eligible for random selection and context recall.

-------------------------------------------------------
PARENT HIERARCHIES (linking cards)
-------------------------------------------------------
To create a hierarchy (e.g., City → Tavern), add parent=Title in the card's Keys.
Example: Keys: parent=CityName
When a card is recalled, its entire parent chain (parent → parent of parent, etc.) is added automatically.
The context will show relations like "Card (part of ParentCard)".

-------------------------------------------------------
RECALL (KEYWORD-BASED CARD TRIGGERING)
-------------------------------------------------------
contextRecallEnabled = true/false
  - Master switch for the recall mechanic.

contextRecallThreshold = 0.005
  - Minimum similarity score (0.0 to 1.0) to trigger a card.
  - Lower = more sensitive.

contextWindowChars = 10000
  - How many recent characters of the story are analyzed for keywords.

contextRecallMaxCards = 4
  - Maximum number of cards OR hierarchies recalled in one action.
  - Example: 2 single cards + 2 hierarchies, or 4 hierarchies, etc.

customStopWords = word1, word2, ...
  - Extra words to ignore (case-insensitive). Useful for character names that cause false triggers.
  - Example: customStopWords = YourCharacterName, shadow, eldrin

recallInsertPosition = top / bot
  - Where to insert recalled cards in the context.
  - "top" = right after always-include cards (near the beginning).
  - "bot" = near the end, just before events.

-------------------------------------------------------
WEIGHT (affects random selection & recall sorting)
-------------------------------------------------------
Add weight=number in the card's Keys to increase (number>1) or decrease (0<number<1) its chance.
Examples: weight=2, weight=0.5

-------------------------------------------------------
EVENTS (cards marked as "Event" type)
-------------------------------------------------------
randomEventChance = 0.1
  - Probability (0.0 to 1.0) that a random Event card will trigger each action.

eventDuration = 2
  - How many actions the event will stay in the context after triggering.

useEventWeights = true/false
  - If true, respects weight=number triggers in the card's Keys for random selection.

-------------------------------------------------------
RANDOM CARDS (non-Event cards)
-------------------------------------------------------
randomCardChance = 0
  - Probability (0.0 to 1.0) that a random story card is added to context each action.

useCardWeights = true/false
  - If true, uses weight=number triggers for random card selection.

-------------------------------------------------------
ALWAYS INCLUDE
-------------------------------------------------------
alwaysIncludeCards = cardTitle1, cardTitle2, ...
  - Comma-separated list of story card titles that will be ALWAYS added to context.

-------------------------------------------------------
SYSTEM
-------------------------------------------------------
currentEventTitle / currentEventDurationLeft
  - Used internally to track active events. Do not change unless you know what you're doing.

=======================================================
`;
}

function findConfigCard() {
    let allCards = getAllStoryCards();
    if (!allCards) return null;
    return allCards.find(card => getCardTitle(card) === CONFIG_CARD_TITLE);
}

function readConfigFromCard(card) {
    let config = { ...DEFAULT_CONFIG };
    if (!card) return config;
    let content = getCardText(card);
    if (!content) return config;

    try {
        let parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) {
            for (let key of Object.keys(DEFAULT_CONFIG)) {
                if (parsed.hasOwnProperty(key)) {
                    config[key] = parsed[key];
                }
            }
            return config;
        }
    } catch (e) {}

    let lines = content.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line === '' || line.startsWith('//') || line.startsWith('===')) continue;
        let eqPos = line.indexOf('=');
        if (eqPos === -1) eqPos = line.indexOf(':');
        if (eqPos === -1) continue;
        let key = line.slice(0, eqPos).trim();
        let value = line.slice(eqPos + 1).trim();
        switch (key) {
            case 'randomCardChance':
            case 'randomEventChance':
            case 'contextRecallThreshold':
                config[key] = parseFloat(value);
                break;
            case 'eventDuration':
            case 'contextWindowChars':
            case 'contextRecallMaxCards':
            case 'currentEventDurationLeft':
                config[key] = parseInt(value, 10);
                break;
            case 'useOnlyAutouseCards':
            case 'useEventWeights':
            case 'useCardWeights':
            case 'contextRecallEnabled':
                config[key] = (value.toLowerCase() === 'true');
                break;
            case 'alwaysIncludeCards':
                config.alwaysIncludeCards = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
                break;
            case 'customStopWords':
                config.customStopWords = value.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
                break;
            case 'recallInsertPosition':
                if (value.toLowerCase() === 'bot') config.recallInsertPosition = 'bot';
                else config.recallInsertPosition = 'top';
                break;
            case 'currentEventTitle':
                config.currentEventTitle = value;
                break;
        }
    }
    return config;
}

function writeConfigToCard(card, config) {
    if (!card) return;
    if (!card.description && card.description !== '') {
        card.description = generateConfigHelpText();
    }
    let lines = [];
    lines.push("// StoryCard Extension Configuration");
    lines.push("// Edit values below, save the card, and the changes will apply immediately.");
    lines.push("");
    lines.push("// ----- General -----");
    lines.push(`useOnlyAutouseCards = ${config.useOnlyAutouseCards}`);
    lines.push("");
    lines.push("// ----- Recall (keyword-based triggering) -----");
    lines.push(`contextRecallEnabled = ${config.contextRecallEnabled}`);
    lines.push(`contextRecallThreshold = ${config.contextRecallThreshold}`);
    lines.push(`contextWindowChars = ${config.contextWindowChars}`);
    lines.push(`contextRecallMaxCards = ${config.contextRecallMaxCards}`);
    lines.push(`customStopWords = ${(config.customStopWords || []).join(', ')}`);
    lines.push(`recallInsertPosition = ${config.recallInsertPosition === 'bot' ? 'bot' : 'top'}`);
    lines.push("");
    lines.push("// ----- Events -----");
    lines.push(`randomEventChance = ${config.randomEventChance}`);
    lines.push(`eventDuration = ${config.eventDuration}`);
    lines.push(`useEventWeights = ${config.useEventWeights}`);
    lines.push("");
    lines.push("// ----- Random Cards -----");
    lines.push(`randomCardChance = ${config.randomCardChance}`);
    lines.push(`useCardWeights = ${config.useCardWeights}`);
    lines.push("");
    lines.push("// ----- Always Include (by story card title) -----");
    lines.push(`alwaysIncludeCards = ${(config.alwaysIncludeCards || []).join(', ')}`);
    lines.push("");
    lines.push("// ----- System -----");
    lines.push(`currentEventTitle = ${config.currentEventTitle || ''}`);
    lines.push(`currentEventDurationLeft = ${config.currentEventDurationLeft || 0}`);
    
    setCardText(card, lines.join('\n'));
}

function ensureConfigCard() {
    let existing = findConfigCard();
    if (existing) return existing;

    let newCard = {
        title: CONFIG_CARD_TITLE,
        entry: "",
        description: generateConfigHelpText(),
        keys: "",
        type: "Custom",
        customType: "Config"
    };

    let added = false;
    if (typeof storyCards !== 'undefined' && Array.isArray(storyCards)) {
        storyCards.push(newCard);
        added = true;
    } else if (typeof worldInfo !== 'undefined' && worldInfo && Array.isArray(worldInfo.storyCards)) {
        worldInfo.storyCards.push(newCard);
        added = true;
    } else if (typeof state !== 'undefined' && state && state.worldInfo && Array.isArray(state.worldInfo.storyCards)) {
        state.worldInfo.storyCards.push(newCard);
        added = true;
    } else if (typeof window !== 'undefined' && Array.isArray(window.storyCards)) {
        window.storyCards.push(newCard);
        added = true;
    }

    if (!added) {
        console.error("[SCE] Could not add config card – no suitable array found.");
        return null;
    }
    writeConfigToCard(newCard, DEFAULT_CONFIG);
    return newCard;
}

// ============================================================================
// Weight functions
// ============================================================================

function getEventWeight(card) {
    let keys = card.keys;
    if (!keys) return 1;
    let keysStr = Array.isArray(keys) ? keys.join(' ') : keys;
    let match = keysStr.match(/weight=([\d.]+)/i);
    if (match) {
        let w = parseFloat(match[1]);
        return isNaN(w) ? 1 : Math.max(0, w);
    }
    return 1;
}

function getEventDuration(card, globalDuration) {
    let keys = card.keys;
    if (!keys) return globalDuration;
    let keysStr = Array.isArray(keys) ? keys.join(' ') : keys;
    let match = keysStr.match(/duration=(\d+)/i);
    if (match) {
        let d = parseInt(match[1], 10);
        return isNaN(d) ? globalDuration : Math.max(1, d);
    }
    return globalDuration;
}

function getCardWeight(card) {
    let keys = card.keys;
    if (!keys) return 1;
    let keysStr = Array.isArray(keys) ? keys.join(' ') : keys;
    let match = keysStr.match(/weight=([\d.]+)/i);
    if (match) {
        let w = parseFloat(match[1]);
        return isNaN(w) ? 1 : Math.max(0, w);
    }
    return 1;
}

function getCardParent(card) {
    let keys = card.keys;
    if (!keys) return null;
    let keysStr = Array.isArray(keys) ? keys.join(' ') : keys;
    let match = keysStr.match(/parent=([^;,\n]+)/i);
    if (match) {
        return match[1].trim();
    }
    return null;
}

function selectCardByWeight(cards) {
    if (!cards || cards.length === 0) return null;
    let weights = cards.map(c => getCardWeight(c));
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) return null;
    let rand = Math.random() * totalWeight;
    let accum = 0;
    for (let i = 0; i < cards.length; i++) {
        accum += weights[i];
        if (rand < accum) return cards[i];
    }
    return cards[cards.length - 1];
}

function selectEventByWeight(events) {
    if (!events || events.length === 0) return null;
    let weights = events.map(e => getEventWeight(e));
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) return null;
    let rand = Math.random() * totalWeight;
    let accum = 0;
    for (let i = 0; i < events.length; i++) {
        accum += weights[i];
        if (rand < accum) return events[i];
    }
    return events[events.length - 1];
}

// ============================================================================
// Tokens!
// ============================================================================

function computeHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
}

function computeCardHash(card) {
    let content = getCardText(card) || '';
    let title = getCardTitle(card);
    return computeHash(title + '###' + content);
}

const DEFAULT_STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from', 'had', 'has', 'have',
    'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'she', 'that',
    'the', 'their', 'them', 'they', 'this', 'to', 'was', 'we', 'were', 'with', 'you', 'your', 'yes',
    'no', 'not', 'but', 'so', 'for', 'yet', 'nor', 'then', 'now', 'well', 'very', 'just', 'like',
    'such', 'than', 'then', 'there', 'these', 'those', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'both', 'each', 'every', 'more', 'most', 'some', 'any', 'no', 'only', 'own',
    'same', 'than', 'that', 'then', 'thence', 'there', 'these', 'they', 'this', 'those', 'through',
    'until', 'unto', 'upon', 'us', 'use', 'used', 'using', 'we', 'what', 'when', 'where', 'which',
    'while', 'who', 'whom', 'why', 'with', 'within', 'without', 'your', 'yours', 'yourself'
]);

function simpleTokenize(text, extraStopWords = []) {
    if (!text || typeof text !== 'string') return [];
    let words = text.toLowerCase().replace(/[^a-z0-9а-яё]/gi, ' ').split(/\s+/);
    let allStopWords = new Set(DEFAULT_STOP_WORDS);
    for (let w of extraStopWords) {
        allStopWords.add(w.toLowerCase());
    }
    return words.filter(w => w.length > 1 && !allStopWords.has(w));
}

function stripBrackets(text) {
    return text.replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, '');
}

function similarity(tokenArray1, tokenArray2) {
    if (!tokenArray1 || !tokenArray2) return 0;
    if (tokenArray1.length === 0 || tokenArray2.length === 0) return 0;
    let set2 = new Set(tokenArray2);
    let intersection = 0;
    for (let t of tokenArray1) {
        if (set2.has(t)) intersection++;
    }
    let norm = Math.sqrt(tokenArray1.length * tokenArray2.length);
    return norm === 0 ? 0 : intersection / norm;
}

function getCardsSignature(regularCards) {
    let items = [];
    for (let card of regularCards) {
        let title = getCardTitle(card);
        let hash = computeCardHash(card);
        items.push(title + ':' + hash);
    }
    items.sort();
    return items.join('|');
}

function buildCardBags(regularCards, customStopWords) {
    let bags = {};
    for (let card of regularCards) {
        let title = getCardTitle(card);
        let content = getCardText(card) || '';
        let combined = (title ? title + ' ' : '') + content;
        let tokens = combined ? simpleTokenize(combined, customStopWords) : [];
        bags[title] = tokens;
    }
    return bags;
}

// ============================================================================
// Hierarchy
// ============================================================================

function findCardByTitle(title, allCards) {
    if (!title) return null;
    let normTitle = title.trim().toLowerCase().replace(/\s+/g, ' ');
    return allCards.find(card => {
        let cardTitle = getCardTitle(card);
        if (!cardTitle) return false;
        let normCardTitle = cardTitle.trim().toLowerCase().replace(/\s+/g, ' ');
        return normCardTitle === normTitle;
    });
}

function getCardHierarchy(card, allCards, visited = new Set()) {
    if (!card) return [];
    let title = getCardTitle(card);
    if (visited.has(title)) {
        console.warn("[SCE] Cycle detected for", title);
        return [card];
    }
    visited.add(title);
    let parentTitle = getCardParent(card);
    if (parentTitle) {
        let parentCard = findCardByTitle(parentTitle, allCards);
        if (parentCard) {
            let parentHierarchy = getCardHierarchy(parentCard, allCards, visited);
            return [...parentHierarchy, card];
        }
    }
    return [card];
}

function hierarchySimilarity(hierarchyCards, contextTokens, customStopWords) {
    if (!hierarchyCards.length) return 0;
    let scores = [];
    for (let card of hierarchyCards) {
        let title = getCardTitle(card);
        let content = getCardText(card) || '';
        let combined = (title ? title + ' ' : '') + content;
        let cardTokens = combined ? simpleTokenize(combined, customStopWords) : [];
        if (cardTokens.length === 0) continue;
        let score = similarity(cardTokens, contextTokens);
        scores.push(score);
    }
    if (scores.length === 0) return 0;
    return Math.min(...scores);
}

// ============================================================================
// Recall candidates
// ============================================================================

function selectRecallCandidates(text, allCards, regularCards, config) {
    if (typeof state === 'undefined') { state = {}; }
    if (!regularCards || regularCards.length === 0) {
        console.log("[SCE] No regular cards for recall");
        return [];
    }
    if (!state.__sceCardBags) state.__sceCardBags = {};

    let currentSignature = getCardsSignature(regularCards);
    let needRebuild = (state.__sceRecallSignature !== currentSignature);
    let customStop = config.customStopWords || [];

    if (needRebuild) {
        state.__sceCardBags = buildCardBags(regularCards, customStop);
        state.__sceRecallSignature = currentSignature;
        console.log("[SCE] Rebuilt card bags. Cards:", regularCards.length);
        for (let card of regularCards) {
            let title = getCardTitle(card);
            let tokens = state.__sceCardBags[title] || [];
            console.log(`[SCE]   ${title}: ${tokens.length} tokens`);
        }
    }

    let cleanText = stripBrackets(text);
    let contextWindow = config.contextWindowChars || 3000;
    let recentClean = cleanText.slice(-contextWindow);
    let contextTokensClean = simpleTokenize(recentClean, customStop);

    let recentRaw = text.slice(-contextWindow);
    let contextTokensRaw = simpleTokenize(recentRaw, customStop);

    console.log("[SCE] Context tokens clean:", contextTokensClean.length, "raw:", contextTokensRaw.length);
    let threshold = config.contextRecallThreshold !== undefined ? config.contextRecallThreshold : 0.001;

    let singleCandidates = [];
    for (let card of regularCards) {
        let title = getCardTitle(card);
        if (isEventCard(card) || title.toLowerCase().includes('config')) continue;
        if (getCardParent(card)) continue;

        let cardTokens = state.__sceCardBags[title];
        if (!cardTokens || cardTokens.length === 0) continue;
        let score = similarity(cardTokens, contextTokensClean);
        if (score >= threshold) {
            let weight = getCardWeight(card);
            let weightedScore = score * weight;
            singleCandidates.push({
                type: 'single',
                card: card,
                score: score,
                weightedScore: weightedScore,
                cards: [card]
            });
        }
    }

    let allHierarchies = [];
    for (let card of regularCards) {
        let title = getCardTitle(card);
        if (isEventCard(card) || title.toLowerCase().includes('config')) continue;
        if (!getCardParent(card)) continue;

        let hierarchy = getCardHierarchy(card, allCards);
        if (!hierarchy.length) continue;

        let hierarchyScore = hierarchySimilarity(hierarchy, contextTokensRaw, customStop);
        if (hierarchyScore >= threshold) {
            let weight = getCardWeight(card);
            let weightedScore = hierarchyScore * weight;
            allHierarchies.push({
                type: 'hierarchy',
                hierarchy: hierarchy,
                score: hierarchyScore,
                weightedScore: weightedScore,
                leafCard: card,
                cards: hierarchy
            });
        }
    }

    let allCandidates = [...singleCandidates, ...allHierarchies];
    allCandidates.sort((a, b) => b.weightedScore - a.weightedScore);
    let maxCards = config.contextRecallMaxCards || 1;
    let selected = allCandidates.slice(0, maxCards);

    console.log(`[SCE] Recall candidates: ${allCandidates.length}, selected: ${selected.length}`);
    for (let cand of selected) {
        if (cand.type === 'single') {
            console.log(`  - single: ${getCardTitle(cand.card)} (score=${cand.score.toFixed(4)}, weighted=${cand.weightedScore.toFixed(4)})`);
        } else {
            let titles = cand.cards.map(c => getCardTitle(c)).join(' → ');
            console.log(`  - hierarchy: ${titles} (score=${cand.score.toFixed(4)}, weighted=${cand.weightedScore.toFixed(4)})`);
        }
    }
    return selected;
}

// ============================================================================
// Main
// ============================================================================

function StoryCardExtensionContext(text) {
    if (typeof state === 'undefined') { state = {}; }

    let configCard = ensureConfigCard();
    if (!configCard) return text;

    let config = readConfigFromCard(configCard);
    let allCards = getAllStoryCards();
    if (!allCards || allCards.length === 0) return text;

    let { eventCards, regularCards } = categorizeCards(allCards, config.useOnlyAutouseCards);

    let usedCardTitles = new Set();
    let definedTitlesSetForAll = new Set();

    let alwaysBlock = null;
    if (config.alwaysIncludeCards && config.alwaysIncludeCards.length > 0) {
        let cardMap = new Map();
        for (let card of allCards) {
            let title = getCardTitle(card);
            if (title) cardMap.set(title, card);
        }
        let foundCards = [];
        for (let name of config.alwaysIncludeCards) {
            let card = cardMap.get(name);
            if (card) {
                let title = getCardTitle(card);
                if (!usedCardTitles.has(title)) {
                    foundCards.push(card);
                    usedCardTitles.add(title);
                }
            }
        }
        alwaysBlock = formatAlwaysCardsBlock(foundCards);
    }

    if (typeof info !== 'undefined' && info.lastOutput !== undefined) {
        if (state.lastOutput === undefined) state.lastOutput = info.lastOutput;
        state.isRetry = (info.lastOutput === state.lastOutput);
        state.lastOutput = info.lastOutput;
    } else if (typeof info !== 'undefined' && info.actionCount !== undefined) {
        if (state.lastActionCount === undefined) state.lastActionCount = info.actionCount;
        state.isRetry = (info.actionCount === state.lastActionCount);
        state.lastActionCount = info.actionCount;
    } else {
        state.isRetry = false;
    }

    if (!state.currentEvent) {
        state.currentEvent = { text: null, title: null, duration: 0 };
    }

    if (config.currentEventTitle === "" && state.currentEvent.duration > 0) {
        state.currentEvent = { text: null, title: null, duration: 0 };
        writeConfigToCard(configCard, config);
    } else if (config.currentEventDurationLeft === 0 && state.currentEvent.duration > 0) {
        state.currentEvent = { text: null, title: null, duration: 0 };
        config.currentEventTitle = "";
        config.currentEventDurationLeft = 0;
        writeConfigToCard(configCard, config);
    } else if (config.currentEventTitle !== "" && config.currentEventTitle !== state.currentEvent.title) {
        let foundEvent = eventCards.find(c => getCardTitle(c) === config.currentEventTitle);
        if (foundEvent) {
            state.currentEvent.text = formatEventCard(foundEvent);
            state.currentEvent.title = config.currentEventTitle;
            state.currentEvent.duration = config.currentEventDurationLeft;
        } else {
            state.currentEvent = { text: null, title: null, duration: 0 };
            config.currentEventTitle = "";
            config.currentEventDurationLeft = 0;
            writeConfigToCard(configCard, config);
        }
    } else if (config.currentEventDurationLeft !== state.currentEvent.duration && config.currentEventTitle === state.currentEvent.title) {
        state.currentEvent.duration = config.currentEventDurationLeft;
    }

    if (state.currentEvent.duration === 0 && state.currentEvent.title !== null) {
        state.currentEvent = { text: null, title: null, duration: 0 };
        config.currentEventTitle = "";
        config.currentEventDurationLeft = 0;
        writeConfigToCard(configCard, config);
    }

    let newText = text;
    let recallBlocks = [];

    if (config.contextRecallEnabled && regularCards.length > 0) {
        let candidates = selectRecallCandidates(text, allCards, regularCards, config);

        let ancestorTitles = new Set();
        for (let cand of candidates) {
            if (cand.type === 'hierarchy' && cand.cards && cand.cards.length > 1) {
                for (let i = 0; i < cand.cards.length - 1; i++) {
                    ancestorTitles.add(getCardTitle(cand.cards[i]));
                }
            }
        }
        candidates = candidates.filter(cand => {
            if (cand.type === 'single' && ancestorTitles.has(getCardTitle(cand.card))) {
                return false;
            }
            return true;
        });

        definedTitlesSetForAll.clear();
        let definitionCards = [];
        for (let cand of candidates) {
            if (cand.type === 'hierarchy' && cand.cards && cand.cards.length > 1) {
                for (let i = 0; i < cand.cards.length - 1; i++) {
                    let card = cand.cards[i];
                    let title = getCardTitle(card);
                    if (!definedTitlesSetForAll.has(title)) {
                        definedTitlesSetForAll.add(title);
                        definitionCards.push(card);
                    }
                }
            }
        }

        let definitionsBlock = null;
        if (definitionCards.length > 0) {
            definitionsBlock = formatDefinitionsBlock(definitionCards);
        }

        let hierarchyStrings = [];
        for (let cand of candidates) {
            if (cand.type === 'hierarchy') {
                let hasUndefinedCard = cand.cards.some(card => !definedTitlesSetForAll.has(getCardTitle(card)));
                if (!hasUndefinedCard) {
                    continue;
                }
                let hierStr = formatHierarchy(cand.cards, definedTitlesSetForAll);
                if (hierStr) hierarchyStrings.push(hierStr);
            }
        }

        let hierarchiesBlock = null;
        if (hierarchyStrings.length > 0) {
            hierarchiesBlock = formatAllHierarchies(hierarchyStrings);
        }

        let singleBlocks = [];
        for (let cand of candidates) {
            if (cand.type === 'single') {
                let block = formatRecallSingle(cand.cards);
                if (block) singleBlocks.push(block);
            }
        }

        if (definitionsBlock) recallBlocks.push(definitionsBlock);
        if (hierarchiesBlock) recallBlocks.push(hierarchiesBlock);
        recallBlocks.push(...singleBlocks);
    }

    if (regularCards.length > 0 && Math.random() < config.randomCardChance) {
        let selectedCard = config.useCardWeights
            ? selectCardByWeight(regularCards)
            : regularCards[Math.floor(Math.random() * regularCards.length)];
        if (selectedCard) {
            let title = getCardTitle(selectedCard);
            if (!usedCardTitles.has(title)) {
                let block = null;
                let parent = getCardParent(selectedCard);
                if (parent) {
                    let hierarchy = getCardHierarchy(selectedCard, allCards);
                    if (hierarchy && hierarchy.length) {
                        let newCards = [];
                        for (let card of hierarchy) {
                            let t = getCardTitle(card);
                            if (!usedCardTitles.has(t)) {
                                newCards.push(card);
                                usedCardTitles.add(t);
                            }
                        }
                        if (newCards.length > 0) {
                            let hierStr = formatHierarchy(newCards, definedTitlesSetForAll);
                            if (hierStr) {
                                block = `[Current hierarchies (each sub-item is part of the parent item above):\n${hierStr}\n]`;
                            }
                        }
                    }
                } else {
                    block = formatRandomCard(selectedCard);
                    if (block) usedCardTitles.add(title);
                }
                if (block) {
                    if (config.recallInsertPosition === 'bot') {
                        newText = newText + '\n\n' + block;
                    } else {
                        newText = block + '\n\n' + newText;
                    }
                }
            }
        }
    }

    for (let block of recallBlocks) {
        if (config.recallInsertPosition === 'bot') {
            newText = newText + '\n\n' + block;
        } else {
            newText = block + '\n\n' + newText;
        }
    }

    if (alwaysBlock) {
        newText = alwaysBlock + '\n\n' + newText;
    }

    if (state.currentEvent.duration > 0) {
        if (state.currentEvent.text) {
            let eventTitle = state.currentEvent.title;
            if (!usedCardTitles.has(eventTitle)) {
                newText = newText + '\n\n' + state.currentEvent.text;
                usedCardTitles.add(eventTitle);
            }
        }
        if (!state.isRetry) {
            state.currentEvent.duration--;
            if (state.currentEvent.duration === 0) {
                state.currentEvent = { text: null, title: null, duration: 0 };
                config.currentEventTitle = "";
                config.currentEventDurationLeft = 0;
                writeConfigToCard(configCard, config);
            } else {
                config.currentEventDurationLeft = state.currentEvent.duration;
                writeConfigToCard(configCard, config);
            }
        }
    } else {
        if (eventCards.length > 0 && Math.random() < config.randomEventChance) {
            let selectedCard = config.useEventWeights
                ? selectEventByWeight(eventCards)
                : eventCards[Math.floor(Math.random() * eventCards.length)];
            if (selectedCard) {
                let title = getCardTitle(selectedCard);
                if (!usedCardTitles.has(title)) {
                    let block = formatEventCard(selectedCard);
                    if (block) {
                        let duration = getEventDuration(selectedCard, config.eventDuration);
                        state.currentEvent = { text: block, title: title, duration: duration };
                        config.currentEventTitle = title;
                        config.currentEventDurationLeft = duration;
                        writeConfigToCard(configCard, config);
                        newText = newText + '\n\n' + block;
                        usedCardTitles.add(title);
                    }
                }
            }
        }
    }

    return newText;
}

//Other code here
