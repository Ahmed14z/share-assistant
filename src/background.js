chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.contextMenus.create({
    id: "analyzeLink",
    title: "Summarize this link with AI",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyzeLink") {
    console.log("Context menu item clicked");
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["dist/content.js"],
      },
      () => {
        console.log("Content script injected");
        chrome.tabs.sendMessage(tab.id, {
          action: "extractContent",
          linkUrl: info.linkUrl,
        });
      }
    );
  }
});

chrome.webNavigation.onCompleted.addListener(
  (details) => {
    console.log("Web navigation completed", details);
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ["dist/content.js"],
    });
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script", message);
  if (message.action === "fetchPageContent") {
    console.log("Fetching page content for", message.url);
    fetch(message.url)
      .then((response) => response.text())
      .then((text) => {
        console.log("Page content fetched");
        sendResponse({ text });
      })
      .catch((error) => {
        console.error("Error fetching page content:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for sendResponse
  }

  if (message.action === "summarizeContent") {
    const { pageContent, linkUrl } = message;
    console.log("Summarizing content from", linkUrl);
    getSummaryFromOpenAI(pageContent, linkUrl)
      .then((summary) => {
        console.log("Summary generated:", summary);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "copyToClipboard",
          text: summary,
        });
        chrome.storage.local.set({ summary });
        addToCopyHistory(summary);
      })
      .catch((error) => console.error("Failed to generate summary:", error));
  }
});

async function getSummaryFromOpenAI(text, linkUrl) {
  console.log("Calling OpenAI API");
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
          content: `Summarize the following text from the link: ${linkUrl}\n\n${text}`,
        },
      ],
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  if (data.choices && data.choices.length > 0) {
    console.log("OpenAI API response received");
    return `Link: ${linkUrl}\n\nSummary: ${data.choices[0].message.content}`;
  } else {
    throw new Error("No summary returned from OpenAI");
  }
}

function addToCopyHistory(summary) {
  console.log("Adding summary to copy history");
  chrome.storage.local.get(["copyHistory"], (result) => {
    const copyHistory = result.copyHistory || [];
    copyHistory.unshift(summary);
    chrome.storage.local.set({ copyHistory: copyHistory.slice(0, 5) });
  });
}
