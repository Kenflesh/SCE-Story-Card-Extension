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

(Detailed use instructions can be found in the script configuration file in the scenario containing this script)

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

### Using Multiple Scripts Together

If you want to combine this script with other AI Dungeon scripts, read the comments inside the files.

Comments are marked with `//` and are located primarily in the **Context** and **Library** files. These comments explain how to merge scripts safely and how the systems interact.

Reading those comments should provide enough information to integrate multiple scripts without breaking functionality.
Once installed, the script will automatically begin working according to its configuration.
