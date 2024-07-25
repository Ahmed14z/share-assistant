const ongoingOperations = new Map();
const injectedTabs = new Set();
import { Summarizer } from "./Summarizer";

class OperationManager {
  constructor() {
    this.summarizer = new Summarizer();
  }

  summarizeAndShare(url, tabId, platform = "") {
    if (ongoingOperations.has(tabId)) {
      console.log("Operation already in progress for this tab");
      return;
    }
    console.log("platform", platform);

    ongoingOperations.set(tabId, true);

    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError || response.status !== "ready") {
        console.error(
          "Error in ping message or content script not ready:",
          chrome.runtime.lastError
        );

        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["dist/content.js"],
          })
          .then(() => {
            console.log("Content script injected successfully.");

            this.retryMessageSend(tabId, {
              action: "showLanguageSelector",
              linkUrl: url,
              sharePanel: platform,
            });
          })
          .catch((error) => {
            console.error("Failed to inject content script:", error);
            ongoingOperations.delete(tabId);
          });
      } else {
        console.log("Content script is ready, sending message...");
        this.retryMessageSend(tabId, {
          action: "showLanguageSelector",
          linkUrl: url,
          sharePanel: platform,
        });
      }
    });

    setTimeout(() => {
      if (ongoingOperations.has(tabId)) {
        console.log("Operation timed out, resetting state");
        ongoingOperations.delete(tabId);
      }
    }, 30000);
  }

  retryMessageSend(tabId, message) {
    this.sendMessageToTab(tabId, message)
      .then((response) => {
        console.log("Message sent successfully", response);
      })
      .catch((error) => {
        console.error("Error sending message to tab:", error);
      });
  }

  sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error in sendMessageToTab:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  removeOperation(tabId) {
    ongoingOperations.delete(tabId);
  }

  resetExtensionState() {
    injectedTabs.clear();
    ongoingOperations.clear();
    console.log("Extension state reset");
  }
}

export { OperationManager };
