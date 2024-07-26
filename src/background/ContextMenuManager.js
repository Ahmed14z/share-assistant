import { OperationManager } from "./OperationManager";

class ContextMenuManager {
  constructor(operationManager) {
    this.operationManager = operationManager;
  }

  createMenus() {
    chrome.contextMenus.create({
      id: "summarizeText",
      title: "📄 Share selected text with AI",
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: "sharePageClipboard",
      title: "🔗 Share this page into clipboard with AI",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "sharePageReddit",
      title: "🟠 Share this page on Reddit",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "sharePageTwitter",
      title: "🐦 Share this page on Twitter",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "resetExtension",
      title: "🔄 Reset Extension",
      contexts: ["action"],
    });
  }

  handleMenuClick(info, tab) {
    console.log("Context menu item clicked", info.menuItemId);
    if (info.menuItemId === "summarizeText") {
      this.operationManager.summarizeText(info.selectionText, tab.id, true);
    } else if (info.menuItemId === "sharePageClipboard") {
      this.operationManager.summarizeAndShare(
        tab.url,
        tab.id,
        null,
        true
      );
    } else if (info.menuItemId === "sharePageReddit") {
      this.operationManager.summarizeAndShare(
        tab.url,
        tab.id,
        "reddit",
        false
      );
    } else if (info.menuItemId === "sharePageTwitter") {
      this.operationManager.summarizeAndShare(
        tab.url,
        tab.id,
        "twitter",
        false
      );
    } else if (info.menuItemId === "resetExtension") {
      this.operationManager.resetExtensionState();
    }
  }
}

export { ContextMenuManager };
