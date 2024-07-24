const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ko", name: "Korean" },
];

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.contextMenus.create({
    id: "summarizeLink",
    title: "Summarize this link with AI",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarizeLink") {
    chrome.tabs.sendMessage(tab.id, {
      action: "showLanguageSelector",
      linkUrl: info.linkUrl,
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "summarizeWithLanguage") {
    const { linkUrl, language } = message;
    fetchAndSummarize(linkUrl, language, sender.tab.id);
  }
});

async function fetchAndSummarize(linkUrl, language, tabId) {
  try {
    const response = await fetch(linkUrl);
    const pageContent = await response.text();
    const summary = await getSummaryFromOpenAI(pageContent, linkUrl, language);

    chrome.tabs.sendMessage(tabId, {
      action: "copySummary",
      summary: summary,
    });

    chrome.storage.local.set({ summary });
    addToCopyHistory(summary);
  } catch (error) {
    console.error("Error in summarization process:", error);
    chrome.tabs.sendMessage(tabId, {
      action: "showError",
      error: "Failed to generate summary. Please try again.",
    });
  }
}

async function getSummaryFromOpenAI(text, linkUrl, language) {
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
          content: `Summarize the following text from the link: ${linkUrl}\n\nProvide the summary in ${language}.\n\n${text}`,
        },
      ],
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  if (data.choices && data.choices.length > 0) {
    console.log("OpenAI API response received");
    return `Link: ${linkUrl}\n\nSummary (${language}):\n${data.choices[0].message.content}`;
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
