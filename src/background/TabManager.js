const injectedTabs = new Set();
import { OperationManager } from "./OperationManager";

class TabManager {
  constructor() {
    this.operationManager = new OperationManager();
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && !injectedTabs.has(tabId)) {
      chrome.scripting
        .executeScript({
          target: { tabId: tabId },
          files: ["dist/content.js"],
        })
        .then(() => {
          console.log(`Content script injected in tab ${tabId}`);
          injectedTabs.add(tabId);
        })
        .catch((error) => {
          console.warn(
            `Failed to inject content script in tab ${tabId}:`,
            error
          );
        });
    }
  }

  handleTabRemoval(tabId) {
    injectedTabs.delete(tabId);
    this.operationManager.removeOperation(tabId);
  }
}

export { TabManager };
