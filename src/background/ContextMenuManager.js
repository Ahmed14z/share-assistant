import { OperationManager } from "./OperationManager";

class ContextMenuManager {
  constructor() {
    this.operationManager = new OperationManager();
  }

  createMenus() {
    chrome.contextMenus.create({
      id: "summarizeLink",
      title: "🔗 Summarize this link with AI",
      contexts: ["link"],
    });
    chrome.contextMenus.create({
      id: "summarizeAndShareReddit",
      title: "🟠 Summarize and Share on Reddit",
      contexts: ["link"],
    });
    chrome.contextMenus.create({
      id: "summarizeAndShareTwitter",
      title: "🐦 Summarize and Share on Twitter",
      contexts: ["link"],
    });
    chrome.contextMenus.create({
      id: "resetExtension",
      title: "🔄 Reset Extension",
      contexts: ["action"],
    });
  }

  handleMenuClick(info, tab) {
    console.log("Context menu item clicked", info.menuItemId);
    if (info.menuItemId === "summarizeLink") {
      this.operationManager.summarizeAndShare(info.linkUrl, tab.id);
    } else if (info.menuItemId === "summarizeAndShareReddit") {
      this.operationManager.summarizeAndShare(info.linkUrl, tab.id, "reddit");
    } else if (info.menuItemId === "summarizeAndShareTwitter") {
      this.operationManager.summarizeAndShare(info.linkUrl, tab.id, "twitter");
    } else if (info.menuItemId === "resetExtension") {
      this.operationManager.resetExtensionState();
    }
  }
}

export { ContextMenuManager };
