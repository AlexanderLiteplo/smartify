// Check API key status and focus textarea
document.addEventListener("DOMContentLoaded", async () => {
  const { apiKey } = await chrome.storage.sync.get(["apiKey"]);
  const statusEl = document.getElementById("status");
  const enhanceInput = document.getElementById("enhance-input");
  const enhanceBtn = document.getElementById("enhance-btn");

  if (!apiKey) {
    statusEl.textContent = "No API Key";
    statusEl.style.color = "#ef4444";
    enhanceBtn.disabled = true;
  }

  // Auto-focus the textarea
  enhanceInput.focus();

  // Update keyboard shortcut hint based on platform
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const hintElement = document.getElementById("enhance-hint");
  if (isMac) {
    hintElement.innerHTML = "or press <kbd>⌘</kbd>+<kbd>Enter</kbd>";
  }
});

// Open settings
document.getElementById("settings-btn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Open dashboard
document.getElementById("dashboard-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

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

// Enhance text functionality
async function enhanceText(text) {
  const { apiKey, grammarTipsEnabled } = await chrome.storage.sync.get([
    "apiKey",
    "grammarTipsEnabled",
  ]);

  if (!apiKey) {
    throw new Error("Please set your OpenAI API key in settings");
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
    max_tokens: 2000, // Increased for longer texts
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
  let content = data.choices[0].message.content;
  let enhancedText;
  let grammarTip = null;

  console.log("Popup enhancement response:", { content, grammarTipsEnabled });

  if (grammarTipsEnabled !== false) {
    try {
      // Sometimes the API returns a string that needs to be parsed twice
      let contentToParse = content;

      // If content is a JSON string within quotes, parse it first
      if (typeof content === "string" && content.trim().match(/^["'].*["']$/)) {
        try {
          contentToParse = JSON.parse(content);
        } catch (e) {
          // Not a quoted JSON string, use as-is
        }
      }

      // Now try to parse as JSON
      if (
        typeof contentToParse === "string" &&
        contentToParse.trim().startsWith("{")
      ) {
        const parsed = JSON.parse(contentToParse);

        // Validate the parsed object has the expected structure
        if (parsed.enhanced && typeof parsed.enhanced === "string") {
          enhancedText = parsed.enhanced;
          grammarTip = parsed.grammarTip || null;

          // Store grammar tip if available
          if (grammarTip) {
            await storeGrammarTip(text, enhancedText, grammarTip);
          }
        } else {
          throw new Error("Invalid response structure");
        }
      } else {
        // If not JSON, use content as-is
        enhancedText = contentToParse;
      }
    } catch (e) {
      console.error("Failed to parse structured output:", e);

      // Check if the JSON might be incomplete (truncated)
      if (content.includes('"enhanced"') && !content.trim().endsWith("}")) {
        console.error("Response appears to be truncated");
        enhancedText =
          "Error: Response was too long and got cut off. Please try with shorter text.";
      } else {
        // Try to extract the enhanced text from the JSON string as fallback
        // Use a more robust regex that handles multiline content
        const match = content.match(/"enhanced"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (match) {
          // Unescape the JSON string properly
          try {
            // Parse just the extracted string as JSON to handle all escape sequences
            enhancedText = JSON.parse('"' + match[1] + '"');

            // If we successfully extracted the text, try to get the grammar tip too
            const tipMatch = content.match(
              /"grammarTip"\s*:\s*"((?:[^"\\]|\\.)*)"/
            );
            if (tipMatch) {
              try {
                grammarTip = JSON.parse('"' + tipMatch[1] + '"');
              } catch (e) {
                // Ignore grammar tip parsing errors
              }
            }
          } catch (unescapeError) {
            // Fallback to basic unescaping
            enhancedText = match[1]
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")
              .replace(/\\r/g, "\r")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, "\\");
          }
        } else {
          // Last resort: check if it's plain text that somehow got through
          if (!content.includes("{") && !content.includes('"enhanced"')) {
            // Might be plain text response
            enhancedText = content;
          } else {
            console.error(
              "Could not extract enhanced text from response:",
              content
            );
            enhancedText =
              "Error: Could not parse the enhanced text. Please try again.";
          }
        }
      }
    }
  } else {
    enhancedText = content;
  }

  // Remove surrounding quotation marks if present
  if (enhancedText && typeof enhancedText === "string") {
    enhancedText = enhancedText.trim();
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
  }

  console.log("Final enhancement result:", {
    enhancedText: enhancedText?.substring(0, 100) + "...",
    grammarTip: !!grammarTip,
  });

  return { enhancedText, grammarTip };
}

// Handle enhance button click
async function handleEnhance() {
  const input = document.getElementById("enhance-input");
  const text = input.value.trim();

  if (!text) {
    return;
  }

  const enhanceBtn = document.getElementById("enhance-btn");
  const resultDiv = document.getElementById("enhance-result");
  const resultText = document.getElementById("result-text");
  const grammarTipDiv = document.getElementById("grammar-tip");
  const tipText = document.getElementById("tip-text");

  enhanceBtn.disabled = true;
  enhanceBtn.textContent = "⏳ Enhancing...";

  try {
    const result = await enhanceText(text);

    console.log("Enhancement result:", result);

    // Ensure we're displaying the text, not a JSON object
    if (typeof result.enhancedText === "object") {
      console.error(
        "enhancedText is an object, not a string:",
        result.enhancedText
      );
      resultText.textContent = JSON.stringify(result.enhancedText);
    } else {
      resultText.textContent = result.enhancedText;
    }

    resultDiv.style.display = "block";

    if (result.grammarTip) {
      tipText.textContent = result.grammarTip;
      grammarTipDiv.style.display = "block";
    } else {
      grammarTipDiv.style.display = "none";
    }
  } catch (error) {
    console.error("Enhancement error:", error);
    alert(error.message);
  } finally {
    enhanceBtn.disabled = false;
    enhanceBtn.textContent = "🧠 Enhance Text";
  }
}

// Handle copy button
document.getElementById("copy-btn").addEventListener("click", () => {
  const resultText = document.getElementById("result-text").textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    const copyBtn = document.getElementById("copy-btn");
    copyBtn.textContent = "✓ Copied!";
    setTimeout(() => {
      copyBtn.textContent = "📋 Copy";
    }, 2000);
  });
});

// Handle enhance button click
document.getElementById("enhance-btn").addEventListener("click", handleEnhance);

// Handle Ctrl+Enter or Cmd+Enter shortcut
document.getElementById("enhance-input").addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    handleEnhance();
  }
});
