// Track which inputs have brain buttons
const processedInputs = new WeakSet();

// Create floating brain button
function createFloatingBrainButton() {
  const floatingButton = document.createElement("button");
  floatingButton.className = "smartify-floating-btn";
  floatingButton.innerHTML = "🧠";
  floatingButton.title = "Enhance any text with AI";

  floatingButton.addEventListener("click", () => {
    toggleFloatingPanel();
  });

  return floatingButton;
}

// Create floating panel for text enhancement
function createFloatingPanel() {
  const panel = document.createElement("div");
  panel.className = "smartify-floating-panel";
  panel.innerHTML = `
    <div class="smartify-panel-header">
      <h3>🧠 Enhance Your Text</h3>
      <button class="smartify-panel-close">&times;</button>
    </div>
    <div class="smartify-panel-content">
      <textarea 
        class="smartify-panel-input" 
        placeholder="Paste or type your text here..."
        rows="6"
      ></textarea>
      <button class="smartify-panel-enhance">Enhance Text</button>
      <div class="smartify-panel-result-container" style="display: none;">
        <h4>Enhanced Text</h4>
        <div class="smartify-panel-result"></div>
        <button class="smartify-panel-copy">Copy to Clipboard</button>
      </div>
    </div>
  `;

  // Add event listeners
  const closeBtn = panel.querySelector(".smartify-panel-close");
  const enhanceBtn = panel.querySelector(".smartify-panel-enhance");
  const copyBtn = panel.querySelector(".smartify-panel-copy");
  const textarea = panel.querySelector(".smartify-panel-input");
  const resultContainer = panel.querySelector(
    ".smartify-panel-result-container"
  );
  const resultDiv = panel.querySelector(".smartify-panel-result");

  closeBtn.addEventListener("click", () => {
    panel.classList.remove("smartify-panel-open");
  });

  enhanceBtn.addEventListener("click", async () => {
    const text = textarea.value.trim();
    if (!text) return;

    enhanceBtn.disabled = true;
    enhanceBtn.textContent = "Enhancing...";

    try {
      const result = await enhanceText(text);
      if (result && typeof result.enhancedText === "string") {
        resultDiv.textContent = result.enhancedText;
        resultContainer.style.display = "block";

        // Show grammar tip if available
        if (typeof result.grammarTip === "string" && result.grammarTip.trim()) {
          const existingTip = panel.querySelector(
            ".smartify-panel-grammar-tip"
          );
          if (existingTip) existingTip.remove();

          const tipDiv = document.createElement("div");
          tipDiv.className = "smartify-panel-grammar-tip";

          const tipTitle = document.createElement("h4");
          tipTitle.textContent = "💡 Grammar Tip";

          const tipP = document.createElement("p");
          tipP.textContent = result.grammarTip;

          tipDiv.appendChild(tipTitle);
          tipDiv.appendChild(tipP);

          resultContainer.prepend(tipDiv);
        }
      } else {
        throw new Error("No enhanced text returned from the API");
      }
    } catch (error) {
      console.error("Smartify error:", error);
      alert(`Failed to enhance text: ${error?.message || String(error)}`);
    } finally {
      enhanceBtn.disabled = false;
      enhanceBtn.textContent = "Enhance Text";
    }
  });

  copyBtn.addEventListener("click", async () => {
    const text = resultDiv.textContent;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy to Clipboard";
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  });

  // Handle Enter key in textarea
  textarea.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      enhanceBtn.click();
    }
  });

  return panel;
}

// Toggle floating panel visibility
function toggleFloatingPanel() {
  const panel = document.querySelector(".smartify-floating-panel");
  if (panel) {
    panel.classList.toggle("smartify-panel-open");
    if (panel.classList.contains("smartify-panel-open")) {
      const textarea = panel.querySelector(".smartify-panel-input");
      textarea.focus();
    }
  }
}

// Initialize floating UI with better error handling
async function initializeFloatingUI(retryCount = 0) {
  try {
    // Respect user setting (default to true if unset)
    const { floatingBrainEnabled } = await chrome.storage.sync.get([
      "floatingBrainEnabled",
    ]);
    const isEnabled = floatingBrainEnabled !== false;

    // Always create the panel to support keyboard shortcut, but only add button if enabled
    const hasPanel = !!document.querySelector(".smartify-floating-panel");
    const hasButton = !!document.querySelector(".smartify-floating-btn");

    // Don't add floating UI on certain domains (configurable)
    const blockedDomains = ["chrome://", "chrome-extension://", "about:"];
    const currentUrl = window.location.href;
    if (blockedDomains.some((domain) => currentUrl.startsWith(domain))) {
      console.log("Smartify: Blocked on system pages");
      return;
    }

    // Ensure body is ready
    if (!document.body) {
      throw new Error("Document body not ready");
    }

    // Create panel if missing
    if (!hasPanel) {
      const floatingPanel = createFloatingPanel();
      document.body.appendChild(floatingPanel);
    }

    // Create or remove button based on setting
    if (isEnabled && !hasButton) {
      const floatingButton = createFloatingBrainButton();
      document.body.appendChild(floatingButton);
      console.log("Smartify: Floating button shown (enabled)");
    } else if (!isEnabled && hasButton) {
      document.querySelector(".smartify-floating-btn").remove();
      console.log("Smartify: Floating button hidden (disabled)");
    }

    // Add keyboard shortcut to toggle panel (only add once)
    if (!window.smartifyKeyboardListenerAdded) {
      document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "E") {
          toggleFloatingPanel();
        }
      });
      window.smartifyKeyboardListenerAdded = true;
    }
  } catch (error) {
    console.error("Smartify: Error initializing floating UI:", error);

    // Retry for dynamic pages
    if (retryCount < 3) {
      setTimeout(
        () => {
          console.log(
            `Smartify: Retrying initialization (attempt ${retryCount + 2}/4)`
          );
          initializeFloatingUI(retryCount + 1);
        },
        1000 * (retryCount + 1)
      );
    }
  }
}

// Create brain button element
function createBrainButton() {
  const button = document.createElement("button");
  button.className = "smartify-brain-btn";
  button.innerHTML = "🧠";
  button.title = "Enhance with AI";
  return button;
}

// Position button near input element with better handling
function positionButton(button, input) {
  try {
    const rect = input.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    // Check if input is actually visible
    if (rect.width === 0 || rect.height === 0) {
      button.style.display = "none";
      return;
    }

    // Position inside the right edge of the input
    let top = rect.top + scrollTop + 5;
    let left = rect.right + scrollLeft - 35;

    // Ensure button stays within viewport
    const buttonWidth = 30;
    if (left + buttonWidth > window.innerWidth + scrollLeft) {
      left = window.innerWidth + scrollLeft - buttonWidth - 5;
    }

    button.style.top = `${top}px`;
    button.style.left = `${left}px`;
    button.style.position = "absolute";

    // Debug logging
    if (window.smartifyDebug) {
      console.log("Smartify: Positioned button at", { top, left, input, rect });
    }
  } catch (error) {
    console.error("Smartify: Error positioning button:", error);
    button.style.display = "none";
  }
}

// Create diff modal
function createDiffModal() {
  const modal = document.createElement("div");
  modal.className = "smartify-modal";
  modal.innerHTML = `
    <div class="smartify-modal-content">
      <div class="smartify-modal-header">
        <h3>Enhanced Text</h3>
        <button class="smartify-close">&times;</button>
      </div>
      <div class="smartify-diff-container">
        <div class="smartify-original">
          <h4>Original</h4>
          <div class="smartify-text"></div>
        </div>
        <div class="smartify-enhanced">
          <h4>Enhanced</h4>
          <div class="smartify-text"></div>
        </div>
      </div>
      <div class="smartify-modal-footer">
        <button class="smartify-accept">Accept</button>
        <button class="smartify-cancel">Cancel</button>
      </div>
    </div>
  `;
  return modal;
}

// Show diff modal with original and enhanced text
function showDiffModal(originalText, enhancedText, grammarTip, acceptCallback) {
  const existingModal = document.querySelector(".smartify-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = createDiffModal();
  document.body.appendChild(modal);

  // Set text content
  modal.querySelector(".smartify-original .smartify-text").textContent =
    originalText;
  modal.querySelector(".smartify-enhanced .smartify-text").textContent =
    enhancedText;

  // Add grammar tip if available
  if (grammarTip) {
    const tipContainer = document.createElement("div");
    tipContainer.className = "smartify-grammar-tip";
    tipContainer.innerHTML = `
      <h4>💡 Grammar Tip</h4>
      <p>${grammarTip}</p>
    `;
    modal
      .querySelector(".smartify-modal-content")
      .insertBefore(
        tipContainer,
        modal.querySelector(".smartify-modal-footer")
      );
  }

  // Handle close
  const closeModal = () => modal.remove();
  modal.querySelector(".smartify-close").addEventListener("click", closeModal);
  modal.querySelector(".smartify-cancel").addEventListener("click", closeModal);

  // Handle accept
  modal.querySelector(".smartify-accept").addEventListener("click", () => {
    acceptCallback(enhancedText);
    closeModal();
  });

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// Store grammar tip in local storage
async function storeGrammarTip(originalText, enhancedText, grammarTip) {
  const { grammarTips = [] } = await chrome.storage.local.get(["grammarTips"]);

  const newTip = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    originalText: originalText.substring(0, 100), // Store first 100 chars
    enhancedText: enhancedText.substring(0, 100),
    grammarTip,
  };

  // Keep only the last 100 tips
  const updatedTips = [newTip, ...grammarTips].slice(0, 100);
  await chrome.storage.local.set({ grammarTips: updatedTips });
}

// Call OpenAI API to enhance text
async function enhanceText(text) {
  const { apiKey, grammarTipsEnabled } = await chrome.storage.sync.get([
    "apiKey",
    "grammarTipsEnabled",
  ]);

  if (!apiKey) {
    alert("Please set your OpenAI API key in the extension settings");
    chrome.runtime.sendMessage({ action: "openOptions" });
    return null;
  }

  const systemPrompt = `You are a helpful assistant that enhances casual text to be more professional, clear, and intelligent while maintaining the original meaning and tone. Keep the same general length unless the original is very short. Do not add unnecessary formality. Just improve clarity, grammar, and expression. Never use an em-dash.${
    grammarTipsEnabled !== false
      ? " When enhancing text, also provide a specific grammar tip based on the improvements you made. The tip should be educational and help the user understand why certain changes were made."
      : ""
  }`;

  const requestBody = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Please enhance this text${
          grammarTipsEnabled !== false ? " and provide a grammar tip" : ""
        }: "${text}"`,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  };

  // Add structured output format if grammar tips are enabled
  if (grammarTipsEnabled !== false) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: {
        name: "enhanced_text_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            enhanced: {
              type: "string",
              description: "The enhanced version of the text",
            },
            grammarTip: {
              type: "string",
              description: "A specific grammar tip explaining the improvements",
            },
          },
          required: ["enhanced", "grammarTip"],
          additionalProperties: false,
        },
      },
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to enhance text");
  }

  const data = await response.json();
  const choice = data?.choices?.[0]?.message?.content;
  if (!choice) {
    throw new Error("Unexpected API response format");
  }
  let content = choice;
  let enhancedText;
  let grammarTip = null;

  // Debug log for development
  if (grammarTipsEnabled !== false) {
    console.log("Smartify API Response:", {
      content,
      structured: !!requestBody.response_format,
    });
  }

  // Grammar tips enabled is already retrieved above

  if (grammarTipsEnabled !== false) {
    try {
      const parsed = JSON.parse(content);
      enhancedText = parsed?.enhanced ?? parsed?.enhancedText ?? "";
      grammarTip = parsed?.grammarTip ?? null;

      if (grammarTip && enhancedText) {
        await storeGrammarTip(text, enhancedText, grammarTip);
      }
    } catch (e) {
      console.warn(
        "Failed to parse structured output, falling back to plain text:",
        e
      );
      enhancedText = content;

      const tipMatch = content.match(/Grammar Tip:?\s*(.+?)(?:\n|$)/i);
      if (tipMatch) {
        grammarTip = tipMatch[1].trim();
        enhancedText = content.replace(tipMatch[0], "").trim();
      }
    }
  } else {
    enhancedText = content;
  }

  // Remove surrounding quotation marks if present
  enhancedText = enhancedText.trim();

  // Check for various quote types
  // Unicode: \u201C = ", \u201D = ", \u2018 = ', \u2019 = '
  const startQuotes = ['"', "'", "\u201C", "\u2018", "\u201D", "\u2019"];
  const endQuotes = ['"', "'", "\u201D", "\u2019", "\u201C", "\u2018"];

  for (let i = 0; i < startQuotes.length; i++) {
    if (
      enhancedText.startsWith(startQuotes[i]) &&
      enhancedText.endsWith(endQuotes[i])
    ) {
      enhancedText = enhancedText.slice(1, -1).trim();
      break;
    }
  }

  return { enhancedText, grammarTip };
}

// Handle brain button click
async function handleBrainClick(input, button) {
  const originalText = input.value || input.textContent;

  if (!originalText.trim()) {
    return;
  }

  button.disabled = true;
  button.innerHTML = "⏳";

  try {
    const result = await enhanceText(originalText);
    if (result && result.enhancedText) {
      showDiffModal(
        originalText,
        result.enhancedText,
        result.grammarTip,
        (newText) => {
          if (input.value !== undefined) {
            input.value = newText;
          } else {
            input.textContent = newText;
          }
          // Trigger input event for frameworks
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      );
    }
  } catch (error) {
    console.error("Smartify error:", error);
    alert(`Failed to enhance text: ${error.message}`);
  } finally {
    button.disabled = false;
    button.innerHTML = "🧠";
  }
}

// Add brain button to input element
function addBrainButton(input) {
  if (processedInputs.has(input) || input.readOnly || input.disabled) {
    return;
  }

  processedInputs.add(input);

  const button = createBrainButton();
  document.body.appendChild(button);

  // Position button
  positionButton(button, input);

  // Handle click
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleBrainClick(input, button);
  });

  // Handle input focus/blur with better detection
  const showButton = () => {
    button.style.display = "block";
    positionButton(button, input);
    if (window.smartifyDebug) {
      console.log("Smartify: Showing button for input", input);
    }
  };

  const hideButton = () => {
    setTimeout(() => {
      if (!button.matches(":hover") && !button.matches(":focus")) {
        button.style.display = "none";
      }
    }, 200);
  };

  // Multiple events for better detection
  input.addEventListener("focus", showButton);
  input.addEventListener("click", showButton);
  input.addEventListener("mouseenter", showButton);

  input.addEventListener("blur", hideButton);
  input.addEventListener("mouseleave", hideButton);

  // Initially hide button
  button.style.display = "none";

  // Update position on scroll/resize
  const updatePosition = () => positionButton(button, input);
  window.addEventListener("scroll", updatePosition);
  window.addEventListener("resize", updatePosition);

  // Clean up when input is removed
  const observer = new MutationObserver(() => {
    if (!document.contains(input)) {
      button.remove();
      observer.disconnect();
    }
  });
  observer.observe(input.parentElement || document.body, { childList: true });
}

// Find and process text inputs
function processTextInputs() {
  // More comprehensive selector for text inputs
  const selectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[type="search"]',
    'input[type="url"]',
    'input[type="tel"]',
    'input[type="password"]',
    "input:not([type])",
    "textarea",
    '[contenteditable="true"]',
    '[role="textbox"]',
    // Common framework-specific inputs
    "div[contenteditable]",
    "span[contenteditable]",
  ];

  const inputs = document.querySelectorAll(selectors.join(", "));

  inputs.forEach((input) => {
    // Skip if already processed
    if (processedInputs.has(input)) return;

    // Skip hidden or very small inputs
    const rect = input.getBoundingClientRect();
    const styles = window.getComputedStyle(input);

    if (
      rect.width < 50 ||
      rect.height < 15 ||
      styles.display === "none" ||
      styles.visibility === "hidden" ||
      input.offsetParent === null // element or parent is hidden
    ) {
      return;
    }

    // Skip password fields unless they're being used for text
    if (
      input.type === "password" &&
      !input.getAttribute("data-smartify-enabled")
    ) {
      return;
    }

    addBrainButton(input);
  });
}

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    processTextInputs();
    initializeFloatingUI();
  });
} else {
  processTextInputs();
  initializeFloatingUI();
}

// Watch for new inputs with debouncing
let processTimeout;
const observer = new MutationObserver((mutations) => {
  // Debounce to avoid excessive processing
  clearTimeout(processTimeout);
  processTimeout = setTimeout(() => {
    processTextInputs();

    // Also check if floating UI needs to be initialized
    if (!document.querySelector(".smartify-floating-btn")) {
      console.log("Smartify: Floating button missing, reinitializing...");
      initializeFloatingUI();
    }
  }, 300);
});

// Start observing when body is available
function startObserving() {
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["contenteditable", "role", "type"],
    });
    console.log("Smartify: Started observing for new inputs");
  } else {
    setTimeout(startObserving, 100);
  }
}

startObserving();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processInputs") {
    processTextInputs();
  }
});

// Debug mode for troubleshooting
window.smartifyDebug = false;
window.enableSmartifyDebug = () => {
  window.smartifyDebug = true;
  console.log("Smartify Debug Mode: ENABLED");
  console.log("Reprocessing all inputs...");
  processTextInputs();
  console.log(
    "Inputs found:",
    document.querySelectorAll(".smartify-brain-btn").length
  );
  console.log(
    "Floating button:",
    document.querySelector(".smartify-floating-btn")
  );
  return "Debug mode enabled. Check console for detailed logs.";
};

console.log(
  "Smartify: Extension loaded. Type 'enableSmartifyDebug()' in console to enable debug mode."
);
