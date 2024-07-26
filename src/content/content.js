import { Readability } from "@mozilla/readability";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);

  if (message.action === "ping") {
    console.log("Ping received, responding...");
    sendResponse({ status: "ready" });
    return true;
  }
  console.log("Content script received message:", message);

  if (message.action === "extractContent") {
    const { language, sharePanel, selection, isSelection } = message;
    console.log("Starting content extraction for current tab");

    let pageContent;
    if (isSelection && selection) {
      pageContent = selection;
      console.log("Extracting selected text:", pageContent);
    } else {
      const documentClone = document.cloneNode(true);
      const readability = new Readability(documentClone);
      const article = readability.parse();
      pageContent = article ? article.textContent : document.body.innerText;
      console.log("Extracting full page content");
    }

    console.log("Content extracted successfully:", pageContent);

    chrome.runtime.sendMessage({
      action: "summarizeContent",
      pageContent,
      language,
      sharePanel,
      isSelection,
      url: window.location.href,
    });

    return true;
  }

  if (message.action === "showLanguageSelector") {
    showLanguageSelector(
      message.linkUrl,
      message.sharePanel,
      message.selection,
      message.isSelection
    );
    sendResponse({ status: "languageSelectorShown" });
    return true;
  }

  if (message.action === "copySummary") {
    copyToClipboard(message.summary);
    showNotification("Summary copied to clipboard!");
    chrome.runtime.sendMessage({ action: "operationComplete" });
    sendResponse({ status: "summaryCopied" });
    return true;
  }

  if (message.action === "showError") {
    showNotification(message.error, 5000);
    chrome.runtime.sendMessage({ action: "operationComplete" });
    sendResponse({ status: "errorShown" });
    return true;
  }
});

function showNotification(message, duration = 3000) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    document.body.removeChild(notification);
  }, duration);
}

function showLanguageSelector(linkUrl, sharePanel, selection, isSelection) {
  const languages = [
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "ko", name: "Korean" },
  ];

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  const popup = document.createElement("div");
  popup.style.cssText = `
     background-color: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    font-family: Arial, sans-serif;
    max-width: 300px;
    width: 100%;
  `;

  popup.innerHTML = `
   <h2 style="margin-top: 0; margin-bottom: 20px; color: #333; font-size: 18px;">Select Summary Language</h2>
    <select id="languageSelect" style="width: 100%; margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px;">
      ${languages
        .map((lang) => `<option value="${lang.code}">${lang.name}</option>`)
        .join("")}
    </select>
 <button id="confirmButton" style="width: 100%; padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Summarize</button>  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  document.getElementById("confirmButton").addEventListener("click", () => {
    const selectedLanguage = document.getElementById("languageSelect").value;
    document.body.removeChild(overlay);
    chrome.runtime.sendMessage({
      action: "summarizeWithLanguage",
      linkUrl: linkUrl,
      language: selectedLanguage,
      sharePanel: sharePanel,
      selection: selection,
      isSelection: isSelection,
    });
    showNotification("Summarizing...", 5000);
    chrome.runtime.sendMessage({ action: "operationComplete" });
  });
}
function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
