const axios = require("axios");
const cheerio = require("cheerio");

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyzeLink",
    title: "Summarize this link with AI",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "analyzeLink") {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["dist/content.js"],
      },
      async () => {
        console.log("Content script injected");
        chrome.tabs.sendMessage(tab.id, { action: "showLoading" });
        const linkUrl = info.linkUrl;
        try {
          const pageContent = await fetchPageContentWithCookies(linkUrl);
          console.log("Fetched page content:", pageContent);
          const summary = await getSummaryFromOpenAI(pageContent, linkUrl);
          console.log("Generated summary:", summary);
          if (summary) {
            chrome.tabs.sendMessage(tab.id, {
              action: "copyToClipboard",
              text: summary,
            });
            chrome.storage.local.set({ summary });
            addToCopyHistory(summary);
          }
        } catch (error) {
          console.error(
            "Failed to fetch page content or generate summary:",
            error
          );
        } finally {
          chrome.tabs.sendMessage(tab.id, { action: "hideLoading" });
        }
      }
    );
  }
});

async function fetchPageContentWithCookies(url) {
  try {
    const cookies = await getCookies(url);
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Cookie: cookieString,
      },
    });
    if (response.status !== 200) {
      throw new Error("Network response was not ok");
    }
    const $ = cheerio.load(response.data);
    $("script, style, noscript, iframe, link, meta").remove();
    let pageContent = $("body").text();
    pageContent = pageContent.replace(/\s+/g, " ").trim();
    return pageContent;
  } catch (error) {
    console.error("Error fetching page content:", error);
    throw error;
  }
}

function getCookies(url) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ url }, (cookies) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(cookies);
      }
    });
  });
}

async function getSummaryFromOpenAI(text, linkUrl) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
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
    return `Link: ${linkUrl}\n\nSummary: ${data.choices[0].message.content}`;
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
