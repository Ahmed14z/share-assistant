import { Readability } from "@mozilla/readability";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script", message);
  if (message.action === "extractContent") {
    const { linkUrl } = message;
    console.log("Extracting content from", linkUrl);
    chrome.runtime.sendMessage(
      { action: "fetchPageContent", url: linkUrl },
      (response) => {
        if (response.error) {
          console.error("Error fetching page content:", response.error);
          return;
        }

        console.log("Page content fetched, processing with Readability");
        const text = response.text;
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        // Remove unnecessary elements
        const scripts = doc.querySelectorAll(
          "script, style, noscript, iframe, link, meta"
        );
        scripts.forEach((el) => el.remove());

        // Use Readability to parse the document
        const reader = new Readability(doc);
        const article = reader.parse();
        const pageContent = article
          ? article.textContent
          : "Failed to extract content";

        console.log(
          "Content extracted, sending to background script for summarization"
        );
        chrome.runtime.sendMessage({
          action: "summarizeContent",
          pageContent,
          linkUrl,
        });
      }
    );
  }

  if (message.action === "copyToClipboard") {
    const text = message.text;
    console.log("Copying text to clipboard:", text);
    const input = document.createElement("textarea");
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.value = text;
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
    console.log("Text copied to clipboard");
    showNotification("Summary copied to clipboard!");
  }
});

function showNotification(message) {
  console.log("Showing notification:", message);
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-4 right-4 bg-green-500 text-white py-2 px-4 rounded shadow-md";
  notification.innerText = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}
