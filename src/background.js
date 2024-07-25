const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ko", name: "Korean" },
];

const injectedTabs = new Set();
const ongoingOperations = new Map();

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.contextMenus.create({
    id: "summarizeLink",
    title: "Summarize this link with AI",
    contexts: ["link"],
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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
        console.warn(`Failed to inject content script in tab ${tabId}:`, error);
      });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  ongoingOperations.delete(tabId);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu item clicked");
  if (info.menuItemId === "summarizeLink") {
    if (ongoingOperations.has(tab.id)) {
      console.log("Operation already in progress for this tab");
      return;
    }

    ongoingOperations.set(tab.id, true);

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "showLanguageSelector",
        linkUrl: info.linkUrl,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "Error sending message to content script:",
            chrome.runtime.lastError.message
          );
          ongoingOperations.delete(tab.id);
        }
      }
    );

    // Set a timeout to clear the operation if it takes too long
    setTimeout(() => {
      if (ongoingOperations.has(tab.id)) {
        console.log("Operation timed out, resetting state");
        ongoingOperations.delete(tab.id);
      }
    }, 10000); // 30 seconds timeout
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message in background script:", message);

  if (message.action === "summarizeWithLanguage") {
    const { linkUrl, language } = message;
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "extractContent",
      linkUrl: linkUrl,
      language: language,
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
    const { pageContent, linkUrl, language } = message;
    getSummaryFromOpenAI(pageContent, linkUrl, language)
      .then((summary) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "copySummary",
          summary: summary,
        });
        chrome.storage.local.set({ summary });
        addToCopyHistory(summary);
      })
      .catch((error) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "showError",
          error: "Failed to generate summary. Please try again.",
        });
      })
      .finally(() => {
        ongoingOperations.delete(sender.tab.id);
      });
  }

  if (message.action === "operationComplete") {
    ongoingOperations.delete(sender.tab.id);
  }
});
async function getSummaryFromOpenAI(text, linkUrl, language) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Summarize the following text from the link: ${linkUrl}\n\nMake it as a catchy twitter post in ${language}.\n\n${text}`,
        },
      ],
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  if (data.choices && data.choices.length > 0) {
    return `${data.choices[0].message.content} \n\nRead more: ${linkUrl}`;
  } else {
    throw new Error("No summary returned from OpenAI");
  }
}

function addToCopyHistory(summary) {
  chrome.storage.local.get(["copyHistory"], (result) => {
    const copyHistory = result.copyHistory || [];
    copyHistory.unshift(summary);
    chrome.storage.local.set({ copyHistory: copyHistory.slice(0, 5) });
  });
}

// Add a new function to reset the extension state
function resetExtensionState() {
  injectedTabs.clear();
  ongoingOperations.clear();
  console.log("Extension state reset");
}

// Add a context menu item to reset the extension
chrome.contextMenus.create({
  id: "resetExtension",
  title: "Reset Extension",
  contexts: ["action"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "resetExtension") {
    resetExtensionState();
  }
});
