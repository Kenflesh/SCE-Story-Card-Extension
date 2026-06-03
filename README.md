# Story Card Extension (SCE) for AI Dungeon

A simple script for AI Dungeon that fixes several major issues with Story Cards, which otherwise make the mechanic largely useless.

## Problems With the Original System

1. Everything relies on triggers. If something is not explicitly named, it effectively does not exist for the AI. Even if you have hundreds of cards, the AI will not acknowledge them unless a trigger appears in the text.

2. Information only enters the context when it appears in the chat or the AI output. Until then, the information stored in cards effectively does not exist, even if trigger words are written in Plot Essentials or Author's Note.

3. Story Cards function only as a reference. Even if you explicitly state that an enemy exists, the AI may simply ignore it because there is no instruction telling it how to incorporate that information into the narrative.

4. After a card is triggered, the AI often forgets about it within a few turns. If the information must remain relevant for longer than one turn, it must be repeatedly reintroduced, which quickly becomes frustrating.

## What This Script Does

This script solves these problems by inserting selected Story Cards directly into the context. As a result, the AI can remember them, reference them naturally, or incorporate them into the story when appropriate.

Because the script only injects context rather than altering core mechanics, it does not break the generation system and allows cards to be used in a more flexible and intelligent way.

## Features
The current implementation includes the following mechanics:
• Recall - allows cards to automatically trigger if they match the context, without using Triggers.
• Parent - You can assign cards to their parent card.
• Event - an event creation function.
• Always Include Cards - a simple function designed to shift context from PE or AN to a story card. 
• Random Card - a function you might consider nonsensical, but which can be useful.

A brief description of how it works:

• Recall - allows cards to automatically call themselves if they fit the context, without using Triggers. The script scans the last characters in the context (for example, 10,000 characters), "tokenizes" them, does the same for the cards, and removes common words like "the." Then, when generating a response, it checks the context against all cards, and if a card matches the context (there are many common words), the script inserts matching cards. You can increase or decrease a card's chance by setting weight=0, where 0 disables the match, and 10 increases the chance of that card by 10 times. The "percentage" of word matches can be specified in the card config.

• Parent - you can assign cards their parent card. This is useful if you don't want to accidentally end up in the other side of the world when entering the trigger word or using this script's functions. Recall, for example, will check the chance, including all Parent cards (a parent card can have its own parent, and so on ad infinitum), and insert the entire hierarchy into the context.

• Event - a function for creating events.
You can create an Event card type so that it's called with a certain chance and remains in the context for a certain number of turns. Want to add variety to your scripts, for example, with a chance to break your character's weapon? The information that this is about to happen will be included in the context, and the AI ​​will somehow guide the story within this event.

• Always Include Cards - a simple function designed to shift the context from PE or AN to the story card, but it's surprisingly useful.
You enter the card names here, and the context sees them every turn as World Info. I don't understand why this is, but it works much more reliably than Plot Essentials or Author's Notes. For a simple example, if I write medieval fantasy in AN, I get a stove, refrigerator, and frying pan. But if I add such a card to the context, I don't get modern appliances; they simply stop appearing. I have no idea why this happens, but it works for me.

• Random Card – a feature you might consider nonsense, but which could be useful.
You know those situations where the plot is stuck and the AI ​​forces it to move forward by adding something unusual. "You never noticed," "appears out of nowhere," "knocks on your door," and so on. This feature allows you to do the same, adding cards into the context without any prerequisites. You can set a chance, and a random card can appear in the context, and the AI ​​will then decide whether to use it or not. It's like food for thought for it, so your 100 cults in Story Cards aren't useless if you never mentioned them.

## Why should you include this script in your scenario?
The script is lightweight, configurable, and does not interfere with normal gameplay if you choose not to use specific features. It does not pollute the context with unnecessary data and does not consume generation output for internal scripting tasks.

## Script Installation Guide

Enabling scripts in AI Dungeon is straightforward. If you have never done it before, do not worry—the process is simpler than it may sound.

### Step‑by‑Step Installation

1. Open your scenario in **AI Dungeon**.
2. Click **Edit Scenario**.
3. Open the **DETAILS** tab.
4. Scroll down to the **Scripting** section.
5. Enable the option **Scripts Enabled**.
6. Click **EDIT SCRIPTS**.

You will see several script files in the editor:

- **Library**
- **Input**
- **Context**
- **Output**

For each of these files, do the following:

1. Open the corresponding script file from this repository.
2. Copy its contents.
3. Paste the contents into the matching editor file in AI Dungeon.

Example:

- Copy the contents of `Library.js` → paste into **Library**
- Copy the contents of `Input.js` → paste into **Input**
- Copy the contents of `Context.js` → paste into **Context**
- Copy the contents of `Output.js` → paste into **Output**

After inserting the contents of all files, click the **Save** button located in the **top‑right corner** of the script editor.

Once saved, the script will be active and you can immediately start your adventure.

# WARNING
There's just one important limitation: it doesn't work with the Optimized Context feature, which is available on some models.
To disable it during gameplay, go to:
Gameplay → AI Models → Memory System and disable Optimized Context.
It simply disables my script (like some other scripts) from running, but instead increases the potential context.

### Using Multiple Scripts Together

If you want to combine this script with other AI Dungeon scripts, read the comments inside the files.

Comments are marked with `//` and are located primarily in the **Context** and **Library** files. These comments explain how to merge scripts safely and how the systems interact.

Reading those comments should provide enough information to integrate multiple scripts without breaking functionality.
Once installed, the script will automatically begin working according to its configuration.

# Now for the usage details
Once the script is loaded and launched, a new card called "SCE Config" will appear. All script settings are managed through it. However, if you're creating a script for others, you can edit the default values ​​at the top of the Library.

Remember that by default, the script already works as expected, and there's really nothing complicated about it, so don't be intimidated by it. It may already work as expected, or you can change a few numbers if something isn't right. It only takes about 5 minutes to figure it out, and you won't need most of the settings.

The card contents look like this (example):
```
// StoryCard Extension Configuration
// Edit values below, save the card, and the changes will apply immediately.

// ----- General -----
useOnlyAutouseCards = false

// ----- Recall (keyword-based triggering) -----
contextRecallEnabled = true
contextRecallThreshold = 0.05
contextWindowChars = 10000
contextRecallMaxCards = 5
customStopWords = 
recallInsertPosition = bot
recallDecayRate = 0.995

// ----- Cascade Settings -----
cascadeEnabled = false
cascadePriorityMultiplier = 1.3

// ----- Events -----
randomEventChance = 0.05
eventDuration = 2
useEventWeights = true

// ----- Random Cards -----
randomCardChance = 0
useCardWeights = true

// ----- Always Include (by story card title) -----
alwaysIncludeCards = World, Global War

// ----- System -----
currentEventTitle = 
currentEventDurationLeft = 0
```
The non-standard part here is just an example of using alwaysIncludeCards, where "World" and "Global War" are Story Card names that will always be used in context.

Instructions for use can be found below (in the card description):
```
===============================================
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
To create a hierarchy (e.g., City → Tavern), add parent=Title in the card's Triggers.
Example Triggers: parent=CityName
When a card is recalled, its entire parent chain (parent → parent of parent, etc.) is added automatically.
The context will show relations like "Card (part of ParentCard)".

-------------------------------------------------------
RECALL (KEYWORD-BASED CARD TRIGGERING)
-------------------------------------------------------
contextRecallEnabled = true/false
  - Master switch for the recall mechanic.

contextRecallThreshold = 0.005
  - Minimum coverage score (0.0 to 1.0) for a card to be recalled.
  - Now based on how much of the card's content is covered by the context.
  - Typically 0.15 works well; lower = more sensitive.

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

recallDecayRate = 1.0
  - Weight decay for tokens based on their distance from the end of the context.
  - 1.0 means no decay (all tokens weight equally).
  - Values < 1.0 make recent tokens count more. Example: 0.995 gives a mild recency bias.
  - Lower values (e.g. 0.9) strongly focus on the very last sentences.

-------------------------------------------------------
CASCADE (iterative expansion of context during recall)
-------------------------------------------------------
cascadeEnabled = true/false
  - If true, the script iteratively adds found cards to the working text, allowing deeper chains of related cards to be discovered.
  - If false, only a single pass is performed (no contextual expansion).

cascadePriorityMultiplier = 1.3
  - When cascadeEnabled = true, this multiplier is applied to the score of a card whose parent (or any ancestor) has already been selected.
  - Values > 1.0 give priority to direct descendants; set to 1.0 to disable the bonus.

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
  - Used internally to track active events. 
=======================================================
```

The main thing you need to know to avoid problems and questions when using the script and to ensure everything is easy to control is:

1. If you have useOnlyAutouseCards = true, the cards that will use the script must have "autouse" written in the Triggers section for the script to work. If useOnlyAutouseCards = false, the script works on everything except Event cards or if the card has "Config" in its name.
2. To avoid problems, the Triggers entry should look like this: autouse weight=2.5 parent=Kingdom Larion
This is an example of how to combine the autouse, weight, and parent mechanics. The first indicates whether the script will use this card, the second indicates how often the AI ​​will pay attention to it (2.5 means 2.5 times more often, weight=0 means completely ignore it, weight=0.5 means half as often, weight=1.0 means it's as if the word wasn't even written). "Parent" is at the end so that cards with spaces in the name can be used without problems. So, if you have useOnlyAutouseCards = false, don't change the weight, and don't use "Parent," you don't need to write anything at all in Triggers. And if useOnlyAutouseCards = true, you only need to write "autouse" and nothing else.
Remember: you can use the standard system in conjunction with this one. You can also write, for example, "tavern, autouse" so that my script adds the card to the context, and Triggers from the standard system will trigger based on the word. 3. Using the Parent mechanic, ensure that each card in the hierarchy has "autouse" written on it.
4. Regarding Events. Create a card with "Event" written in the category, and it will be triggered every turn based on the chance in the settings. This frequency is also affected by the weight parameter, so you can reduce the chance of a specific card by, for example, 10 times by writing "weight=0.1" in Triggers. You can also change the duration of a specific event by writing "event=10" there; this will force the AI ​​to remember that this event occurs for 20 turns. This can be useful if the event is going to be long, so that the AI ​​doesn't forget it after a couple of turns and definitely doesn't ignore it (usually it takes 1-2 turns for the AI ​​to smoothly lead up to this event).
5. Regarding Recall. Remember that whether a card is triggered directly depends on how many words match the recent context. If the card says "demon" and you see a demon throughout the story, there is a chance it will appear. If you wrote "very cool mage" on a card, then when someone looks at them, they won't be a very cool mage, and the script won't have any reason to remember that card. But if you look at that person and write "He has a magic staff, he looks like a mage, and considering how experienced he seems, he's very cool," it's guaranteed to work. It may seem inconvenient, but if the cards aren't full of useless fluff, it will work just fine, because it only needs to match a few words, and it will select the cards with the most matches.
6. The script works well on the free tier! Personally, I have a free tier, and I wrote a script for myself.
7. If context isn't an issue for you, remember that the 1000-character limitation doesn't apply, as it will transfer the entire card text to the context.

Good luck using the script!
