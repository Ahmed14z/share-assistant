import { Summarizer } from "./Summarizer";

class MessageHandler {
  constructor(operationManager) {
    this.operationManager = operationManager;
    this.summarizer = new Summarizer();
  }

  handleMessage(message, sender, sendResponse) {
    console.log("Received message in background script:", message);

    if (message.action === "summarizeWithLanguage") {
      const { linkUrl, language, sharePanel } = message;
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "extractContent",
        linkUrl: linkUrl,
        language: language,
        sharePanel: sharePanel,
      });
    }

    if (message.action === "fetchPageContent") {
      fetch(message.url)
        .then((response) => response.text())
        .then((text) => {
          sendResponse({ text });
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });
      return true;
    }

    if (message.action === "summarizeContent") {
      const { pageContent, linkUrl, language, sharePanel } = message;
      this.summarizer
        .getSummaryFromOpenAI(pageContent, linkUrl, language)
        .then((summary) => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "copySummary",
            summary: summary,
          });
          chrome.storage.local.set({ summary });
          this.summarizer.addToCopyHistory(summary);
          console.log("share panel", sharePanel);
          if (sharePanel === "reddit") {
            this.summarizer.shareOnReddit(linkUrl, sender.tab.id);
          } else if (sharePanel === "twitter") {
            this.summarizer.shareOnTwitter(linkUrl, sender.tab.id);
          }
        })
        .catch((error) => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "showError",
            error: "Failed to generate summary. Please try again.",
          });
        })
        .finally(() => {
          this.operationManager.removeOperation(sender.tab.id);
        });
    }

    if (message.action === "operationComplete") {
      this.operationManager.removeOperation(sender.tab.id);
    }
  }
}

export { MessageHandler };
