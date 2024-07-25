import { ContextMenuManager } from "./ContextMenuManager";
import { TabManager } from "./TabManager";
import { MessageHandler } from "./MessageHandler";
import { OperationManager } from "./OperationManager";

const operationManager = new OperationManager();
const contextMenuManager = new ContextMenuManager(operationManager);
const tabManager = new TabManager(operationManager);
const messageHandler = new MessageHandler(operationManager);

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  contextMenuManager.createMenus();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  tabManager.handleTabUpdate(tabId, changeInfo, tab);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabManager.handleTabRemoval(tabId);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  contextMenuManager.handleMenuClick(info, tab);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  messageHandler.handleMessage(message, sender, sendResponse);
});
