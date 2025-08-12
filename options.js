// Load saved settings
document.addEventListener("DOMContentLoaded", async () => {
  const { apiKey, grammarTipsEnabled, floatingBrainEnabled } =
    await chrome.storage.sync.get([
      "apiKey",
      "grammarTipsEnabled",
      "floatingBrainEnabled",
    ]);
  if (apiKey) {
    document.getElementById("apiKey").value = apiKey;
  }

  // Set grammar tips toggle (default to true if not set)
  document.getElementById("grammarTips").checked = grammarTipsEnabled !== false;

  // Set floating brain toggle (default to true if not set)
  const floatingToggle = document.getElementById("floatingBrainEnabled");
  if (floatingToggle) {
    floatingToggle.checked = floatingBrainEnabled !== false;
  }
});

// Toggle API key visibility
document.getElementById("toggleVisibility").addEventListener("click", () => {
  const input = document.getElementById("apiKey");
  const button = document.getElementById("toggleVisibility");

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "🙈";
  } else {
    input.type = "password";
    button.textContent = "👁️";
  }
});

// Save API key
document.getElementById("save").addEventListener("click", async () => {
  const apiKey = document.getElementById("apiKey").value.trim();
  const status = document.getElementById("status");

  if (!apiKey) {
    status.className = "status error";
    status.textContent = "Please enter an API key";
    return;
  }

  if (!apiKey.startsWith("sk-")) {
    status.className = "status error";
    status.textContent = 'Invalid API key format. OpenAI keys start with "sk-"';
    return;
  }

  try {
    await chrome.storage.sync.set({ apiKey });
    status.className = "status success";
    status.textContent = "API key saved successfully!";

    // Clear success message after 3 seconds
    setTimeout(() => {
      status.style.display = "none";
    }, 3000);
  } catch (error) {
    status.className = "status error";
    status.textContent = "Failed to save API key. Please try again.";
  }
});

// Save on Enter key
document.getElementById("apiKey").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("save").click();
  }
});

// Handle grammar tips toggle
document.getElementById("grammarTips").addEventListener("change", async (e) => {
  const enabled = e.target.checked;
  await chrome.storage.sync.set({ grammarTipsEnabled: enabled });

  // Show brief confirmation
  const status = document.getElementById("status");
  status.className = "status success";
  status.textContent = enabled
    ? "Grammar tips enabled"
    : "Grammar tips disabled";
  status.style.display = "block";

  setTimeout(() => {
    status.style.display = "none";
  }, 2000);
});

// Handle view tips button
document.getElementById("viewTips").addEventListener("click", () => {
  // Open the grammar tips dashboard
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

// Handle floating brain toggle
document
  .getElementById("floatingBrainEnabled")
  .addEventListener("change", async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ floatingBrainEnabled: enabled });

    // Brief confirmation
    const status = document.getElementById("status");
    if (status) {
      status.className = "status success";
      status.textContent = enabled
        ? "Floating brain enabled"
        : "Floating brain disabled";
      status.style.display = "block";
      setTimeout(() => {
        status.style.display = "none";
      }, 2000);
    }
  });
