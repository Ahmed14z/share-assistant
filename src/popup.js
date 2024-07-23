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
    addToCopyHistory(summary);
  });

  document.getElementById("clear-history").addEventListener("click", () => {
    clearCopyHistory();
  });
});

function copyToClipboard(text) {
  const input = document.createElement("textarea");
  input.style.position = "fixed";
  input.style.opacity = 0;
  input.value = text;
  document.body.appendChild(input);
  input.focus();
  input.select();
  document.execCommand("Copy");
  document.body.removeChild(input);
  showNotification("Summary copied to clipboard!");
}

function addToCopyHistory(summary) {
  chrome.storage.local.get(["copyHistory"], (result) => {
    const copyHistory = result.copyHistory || [];
    copyHistory.unshift(summary);
    chrome.storage.local.set({ copyHistory: copyHistory.slice(0, 5) });
    updateCopyHistory(copyHistory);
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
