console.log("Content script loaded and running");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  if (message.action === "copyToClipboard") {
    const text = message.text;
    const input = document.createElement("textarea");
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.value = text;
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
    console.log("Text copied to clipboard:", text);
    showNotification("Summary copied to clipboard!");
  }
});

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-4 right-4 bg-green-500 text-white py-2 px-4 rounded shadow-md";
  notification.innerText = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}
