import { Summarizer } from "./Summarizer";

class MessageHandler {
  constructor(operationManager) {
    this.operationManager = operationManager;
    this.summarizer = new Summarizer();
  }

  handleMessage(message, sender, sendResponse) {
    console.log("Received message in background script:", message);

    if (message.action === "summarizeWithLanguage") {
      const { linkUrl, language, sharePanel, selection, isSelection } = message;
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "extractContent",
        linkUrl: linkUrl,
        language: language,
        sharePanel: sharePanel,
        selection: selection,
        isSelection: isSelection,
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
      const { pageContent, language, sharePanel, isSelection, url } = message;
      console.log("Is selection:", isSelection); // Add this log

      let summaryPrompt;
      if (isSelection) {
        summaryPrompt = `Summarize the following selected text in ${language} with a maximum of 250 characters:\n\n${pageContent}`;
      } else {
        summaryPrompt = `Summarize the following text from the link: ${url}\n\nMake it as a catchy social media post in ${language} \n\n${pageContent} with a maximum of 250 characters.`;
      }

      this.summarizer
        .getSummaryFromOpenAI(summaryPrompt, url, language)
        .then((summary) => {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "copySummary",
            summary: summary,
          });
          chrome.storage.local.set({ summary });
          this.summarizer.addToCopyHistory(summary);
          console.log("share panel", sharePanel);
          if (sharePanel === "reddit") {
            this.summarizer.shareOnReddit(url, sender.tab.id);
          } else if (sharePanel === "twitter") {
            this.summarizer.shareOnTwitter(url, sender.tab.id);
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
