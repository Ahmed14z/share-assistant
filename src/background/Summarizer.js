class Summarizer {
  async getSummaryFromOpenAI(text, linkUrl, language) {
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
            content: `Summarize the following text from the link: ${linkUrl}\n\nMake it as a catchy social media post in ${language} with a maximum of 280 characters.\n\n${text} `,
          },
        ],
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return `${data.choices[0].message.content} \n\n`;
    } else {
      throw new Error("No summary returned from OpenAI");
    }
  }

  addToCopyHistory(summary) {
    chrome.storage.local.get(["copyHistory"], (result) => {
      const copyHistory = result.copyHistory || [];
      copyHistory.unshift(summary);
      chrome.storage.local.set({ copyHistory: copyHistory.slice(0, 5) });
    });
  }

  async shareOnReddit(url, tabId) {
    try {
      const summary = await this.getSummaryFromStorage();
      const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(
        url
      )}&title=${encodeURIComponent(summary)}`;

      await chrome.tabs.create({ url: redditUrl });
      console.log("Opened Reddit sharing page");
    } catch (error) {
      console.error("Failed to share on Reddit:", error);
    }
  }

  async shareOnTwitter(url, tabId) {
    try {
      const summary = await this.getSummaryFromStorage();
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        summary
      )}&url=${encodeURIComponent(url)}`;

      await chrome.tabs.create({ url: twitterUrl });
      console.log("Opened Twitter sharing page");
    } catch (error) {
      console.error("Failed to share on Twitter:", error);
    }
  }

  getSummaryFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["summary"], (result) => {
        resolve(result.summary || "");
      });
    });
  }
}

export { Summarizer };
