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
    // Inject content script
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["dist/content.js"],
      },
      async () => {
        console.log("Content script injected");

        const linkUrl = info.linkUrl;
        console.log("Link URL:", linkUrl);

        try {
          // Await the results of async functions
          const pageContent = await fetchPageContent(linkUrl);
          console.log("Page Content:", pageContent);

          const summary = await getSummaryFromOpenAI(pageContent, linkUrl);
          console.log("Summary:", summary);

          if (summary) {
            // Send summary to content script to copy to clipboard
            chrome.tabs.sendMessage(tab.id, {
              action: "copyToClipboard",
              text: summary,
            });
          } else {
            console.error("No summary available");
          }
        } catch (error) {
          console.error(
            "Failed to fetch page content or generate summary:",
            error
          );
        }
      }
    );
  }
});

async function fetchPageContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    if (response.status !== 200) {
      throw new Error("Network response was not ok");
    }

    // Load HTML with Cheerio
    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $("script, style, noscript, iframe, link, meta").remove();

    // Extract text from relevant elements
    let pageContent = $("body").text();

    // Clean up text
    pageContent = pageContent.replace(/\s+/g, " ").trim(); // Replace multiple spaces and trim

    console.log("Fetched page content:", pageContent);
    return pageContent;
  } catch (error) {
    console.error("Error fetching page content:", error);
    throw error;
  }
}

async function getSummaryFromOpenAI(text, linkUrl) {
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
    return `Link: ${linkUrl}\n\nSummary: ${data.choices[0].message.content}`;
  } else {
    throw new Error("No summary returned from OpenAI");
  }
}
