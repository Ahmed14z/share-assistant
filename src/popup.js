document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["summary"], (result) => {
    document.getElementById("output").innerText =
      result.summary || "No summary available";
  });

  document.getElementById("copy").addEventListener("click", () => {
    const summary = document.getElementById("output").innerText;
    copyToClipboard(summary);
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
}
