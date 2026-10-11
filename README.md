# ChatGPT Quote Back

A lightweight browser extension that helps you return to quoted text in long ChatGPT conversations, so you can continue reading without scrolling through earlier messages.

Works on **https://chatgpt.com/** in **Google Chrome** and **Microsoft Edge**. No API key is required.

## Features

- Remember the original location of text you select and quote in a follow-up question.
- Add a **“↩ 返回引用原文” (Back to quoted text)** button beside the question.
- Scroll back to the original passage and briefly highlight it.
- Use **“返回回答 ↓” (Back to answer)** to return to the follow-up answer.
- Save reference locations locally so they can be restored after refreshing the page.

The current extension uses Chinese button labels. This README is in English.

## Installation

1. On the GitHub repository page, select **Code → Download ZIP**.
2. Extract the ZIP file to a folder you want to keep. Alternatively, use a local copy of the extension files.
3. Open your browser's extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the folder that directly contains `manifest.json`, `content.js`, and `style.css`.
6. Refresh any ChatGPT tabs that were already open.

**Select the folder containing `manifest.json` itself.** Selecting its parent folder will produce a missing-manifest error.

## Usage

1. Open a conversation on ChatGPT.
2. Select a passage from an earlier ChatGPT response.
3. Use ChatGPT's built-in quote or ask-about-selection action, then send your follow-up question.
4. After reading the new answer, click **Back to quoted text** beside your question.
5. The extension returns to the original passage and briefly highlights it.
6. Click **Back to answer** in the floating bar to return to the follow-up answer.

The extension adds a separate navigation button beside the question. Depending on the ChatGPT interface, the selected quote may also have its own native behavior.

## Local Storage and Privacy

The extension runs only on `chatgpt.com`. Its code makes no network requests and does not upload conversation content.

It saves reference records in the browser's local extension storage. Records include the quoted text, the original message text, surrounding text, and location information used to find the passage again.

### What does the 500-record limit mean?

The extension keeps up to **500 reference records across all ChatGPT conversations in that browser profile**.

Each recorded quote uses one record. Once the limit is exceeded, the oldest records are removed to keep local storage usage bounded. Older navigation buttons may remain usable in an already-open page, but their saved references will no longer be available after a refresh.

This limit does **not** restrict your ChatGPT message count or the number of times you can use the extension. Removing a reference record does not delete or modify your ChatGPT conversation.

Uninstalling the extension removes its local extension storage.

## Limitations

- Only quotes made while the extension is active are recorded; it does not reconstruct earlier references.
- The current version records one quoted passage per question.
- Selecting text, copying it, and including it in a new question may also create a navigation button.
- If the original message has not been loaded, scroll upward to load earlier messages and try again.
- Deleted or edited messages may prevent exact navigation or highlighting.
- Changes to ChatGPT's page structure or quote interface may require extension updates.
- This is an early version. It has worked in the author's browser, but has not been tested across all browser versions or ChatGPT interface variants.

## Source Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Extension metadata, storage permission, and supported website |
| `content.js` | Selection capture, reference storage, navigation, and highlighting |
| `style.css` | Navigation button, floating bar, and highlight styling |

## Updating a Local Installation

1. Replace the extension files in your installed folder with the updated versions.
2. Open your browser's extensions page and click the extension's reload button.
3. Refresh your ChatGPT tabs.

## Reporting Issues

When reporting a problem, include your browser name and version, what you selected, and whether the navigation button was missing or returned to the wrong location. Screenshots can help; remove private conversation details before sharing them.
