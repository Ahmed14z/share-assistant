console.log("Content script loaded and running");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  if (message.action === "copyToClipboard") {
    const text = message.text;
    const input = document.createElement("textarea");
    input.style.position = "fixed";
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
    console.log("Text copied to clipboard:", text);
  }
});
