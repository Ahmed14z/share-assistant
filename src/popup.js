document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["summary", "copyHistory"], (result) => {
    document.getElementById("output").innerText =
      result.summary || "No summary available";
    const copyHistory = result.copyHistory || [];
    updateCopyHistory(copyHistory);
  });

  document.getElementById("copy").addEventListener("click", () => {
    const summary = document.getElementById("output").innerText;
    copyToClipboard(summary);
  });

  document.getElementById("clear-history").addEventListener("click", () => {
    clearCopyHistory();
  });
});

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification("Summary copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}

function clearCopyHistory() {
  chrome.storage.local.set({ copyHistory: [] }, () => {
    updateCopyHistory([]);
    showNotification("Copy history cleared!");
  });
}

function updateCopyHistory(copyHistory) {
  const historyContainer = document.getElementById("copy-history");
  historyContainer.innerHTML = "";
  copyHistory.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.className = "p-2 border-b hover:bg-gray-200 cursor-pointer";
    listItem.innerText = item.length > 30 ? `${item.slice(0, 30)}...` : item;
    listItem.title = item;
    listItem.addEventListener("click", () => {
      copyToClipboard(item);
    });
    historyContainer.appendChild(listItem);
  });
}

function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.innerText = message;
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Listen for updates from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateSummary") {
    document.getElementById("output").innerText = message.summary;
    updateCopyHistory(message.copyHistory);
  }
});
