let allTips = [];
let filteredTips = [];

// Load and display grammar tips
async function loadTips() {
  const { grammarTips = [] } = await chrome.storage.local.get(["grammarTips"]);
  allTips = grammarTips;
  filteredTips = grammarTips;
  displayTips();
}

// Display tips in the container
function displayTips() {
  const container = document.getElementById("tipsContainer");
  const emptyState = document.getElementById("emptyState");

  if (filteredTips.length === 0) {
    container.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  container.innerHTML = filteredTips.map((tip) => createTipCard(tip)).join("");
}

// Create HTML for a single tip card
function createTipCard(tip) {
  const date = new Date(tip.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div class="tip-card" data-id="${tip.id}">
      <div class="tip-header">
        <div class="tip-date">${formattedDate}</div>
      </div>
      <div class="tip-content">
        <h3>💡 Grammar Tip</h3>
        <div class="tip-text">${escapeHtml(tip.grammarTip)}</div>
        <div class="tip-examples">
          <div class="example-box original-example">
            <h4>Original</h4>
            <p title="${escapeHtml(tip.originalText)}">${escapeHtml(tip.originalText)}</p>
          </div>
          <div class="example-box enhanced-example">
            <h4>Enhanced</h4>
            <p title="${escapeHtml(tip.enhancedText)}">${escapeHtml(tip.enhancedText)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Search functionality
function handleSearch(searchTerm) {
  const term = searchTerm.toLowerCase();

  if (!term) {
    filteredTips = allTips;
  } else {
    filteredTips = allTips.filter(
      (tip) =>
        tip.grammarTip.toLowerCase().includes(term) ||
        tip.originalText.toLowerCase().includes(term) ||
        tip.enhancedText.toLowerCase().includes(term)
    );
  }

  displayTips();
}

// Clear all tips
async function clearAllTips() {
  if (
    confirm(
      "Are you sure you want to delete all grammar tips? This action cannot be undone."
    )
  ) {
    await chrome.storage.local.set({ grammarTips: [] });
    allTips = [];
    filteredTips = [];
    displayTips();
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadTips();

  // Search input
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    handleSearch(e.target.value);
  });

  // Clear all button
  document.getElementById("clearAll").addEventListener("click", clearAllTips);
});
