// Importing Google Fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
document.head.appendChild(fontLink);

const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const closeChatbot = document.querySelector("#close-chatbot");

// History Sidebar Elements
const toggleSidebar = document.querySelector("#toggle-sidebar");
const historySidebar = document.querySelector(".history-sidebar");
const closeSidebar = document.querySelector("#close-sidebar");
const newChatBtn = document.querySelector("#new-chat");
const chatList = document.querySelector(".chat-list");
const searchChats = document.querySelector("#search-chats");

// TTS Button and Menu Logic
const ttsButton = document.getElementById("tts-button");
const ttsMenu = document.querySelector(".tts-menu");
const ttsVoiceMenu = document.querySelector(".tts-voice-menu");
const ttsLanguageList = document.querySelector(".tts-language-list");
const ttsVoiceList = document.querySelector(".tts-voice-list");
const closeTtsMenu = document.getElementById("close-tts-menu");
const backToLanguages = document.getElementById("back-to-languages");

// Theme Switching Logic
const themeSwitchCheckbox = document.getElementById("theme-switch-checkbox");
const themeMenu = document.getElementById("theme-menu");
const themeMenuList = document.querySelector(".theme-menu-list");
const backgroundVideo = document.getElementById("background-video");

// Game Menu Logic
const gameButton = document.getElementById("game-button");
const gameMenu = document.querySelector(".game-menu");
const closeGameMenu = document.getElementById("close-game-menu");
const gameList = document.querySelector(".game-list");

// Speech To Text Button And Its Logic
const sttButton = document.getElementById("stt-button");
const waveformCanvas = document.getElementById("waveform");
const waveformCtx = waveformCanvas.getContext("2d");
const waveformContainer = document.querySelector(".waveform-container");

// Default theme is Dark
let currentTheme = "dark";
switchTheme(currentTheme); // Set the initial theme and slider position

// Function to switch themes
function switchTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  currentTheme = theme;

  // Update the slider switch based on the selected theme
  const themeSwitchCheckbox = document.getElementById("theme-switch-checkbox");
  if (theme === "dark") {
    themeSwitchCheckbox.checked = false; // Move slider to dark (moon) side
  } else {
    themeSwitchCheckbox.checked = true; // Move slider to light (sun) side
  }
}

// Function to change background video
function changeBackgroundVideo(videoPath) {
  backgroundVideo.src = videoPath;
  backgroundVideo.load();
  backgroundVideo.play();
}

// Event listener for theme switch button
themeSwitchCheckbox.addEventListener("change", () => {
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  switchTheme(newTheme); // Call switchTheme to update the theme
  if (newTheme === "light") {
    changeBackgroundVideo("./assets/background-light.mp4");
  } else {
    changeBackgroundVideo("./assets/background-dark.mp4");
  }
});

// Event listener for theme menu button
themeMenu.addEventListener("click", () => {
  themeMenuList.style.display = themeMenuList.style.display === "block" ? "none" : "block";
});

// Event listener for theme options
document.querySelectorAll(".theme-option").forEach((option) => {
  option.addEventListener("click", () => {
    const theme = option.getAttribute("data-theme");
    const videoPath = option.getAttribute("data-video");
    switchTheme(theme); // Call switchTheme to update the slider
    changeBackgroundVideo(videoPath);
    themeMenuList.style.display = "none";
  });
});

// Close theme menu when clicking outside
document.addEventListener("click", (e) => {
  if (!themeMenu.contains(e.target) && !themeMenuList.contains(e.target)) {
    themeMenuList.style.display = "none";
  }
});

// API setup
const API_KEY = "AIzaSyBAxva2fkDLl_jI4jF6i4lyoiZwyvnzWpM"; // Updated API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`; // Updated API endpoint

// Initialize user message and file data
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
    name: null,
    textContent: null
  },
};

// Store chat sessions
let chatSessions = [];
let currentSessionIndex = -1; // Track the index of the current session
let currentSession = []; // Current chat session

const initialInputHeight = messageInput.scrollHeight;

// Save chat sessions to localStorage
function saveChatSessions() {
  localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
}

// Load chat sessions from localStorage
function loadChatSessions() {
  const savedSessions = localStorage.getItem("chatSessions");
  if (savedSessions) {
    chatSessions = JSON.parse(savedSessions);
    currentSessionIndex = chatSessions.length - 1; // Set to the latest session
    currentSession = chatSessions[currentSessionIndex]?.messages || [];
  } else {
    // Create the first chat session automatically
    const newSession = {
      title: "Chat 1",
      messages: [
        {
          role: "model",
          parts: [{ text: "Hey there, <br /> How can I help you today?" }],
        },
      ],
      favorite: false,
    };
    chatSessions.push(newSession);
    currentSessionIndex = 0;
    currentSession = [...newSession.messages];
    saveChatSessions();
  }
}

// Load chat history when the page loads
window.addEventListener("load", () => {
  loadChatSessions();
  loadChatHistory(); // Update the UI with the loaded chat history
  loadChat(currentSessionIndex); // Load the first chat by default
});

// TTS Voices Data (loaded from tts-voices.json)
let ttsVoices = {};

// Selected Voice (default to a US English voice)
let selectedVoice = "en-US-Standard-A";

// Load TTS Voices from JSON File
async function loadTtsVoicesData() {
  try {
    const response = await fetch("./assets/tts-voices.json"); // Path to your JSON file
    if (!response.ok) throw new Error("Failed to load TTS voices data");
    ttsVoices = await response.json();
    console.log("TTS Voices Data Loaded:", ttsVoices);
  } catch (error) {
    console.error("Error loading TTS voices data:", error);
  }
}

// Open TTS Menu
ttsButton.addEventListener("click", () => {
  ttsMenu.style.display = "block";
  ttsVoiceMenu.style.display = "none";
  loadTtsLanguages();
});

// Close TTS Menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    !ttsMenu.contains(e.target) &&
    !ttsVoiceMenu.contains(e.target) &&
    !ttsButton.contains(e.target)
  ) {
    ttsMenu.style.display = "none";
    ttsVoiceMenu.style.display = "none";
  }
});

// Close TTS Menu
closeTtsMenu.addEventListener("click", () => {
  ttsMenu.style.display = "none";
});

// Load Languages and Accents
function loadTtsLanguages() {
  ttsLanguageList.innerHTML = "";
  Object.keys(ttsVoices).forEach((language) => {
    const div = document.createElement("div");
    div.textContent = language;
    div.addEventListener("click", () => {
      loadTtsVoices(language);
      ttsMenu.style.display = "none";
      ttsVoiceMenu.style.display = "block";
    });
    ttsLanguageList.appendChild(div);
  });
}

// Load Voices for Selected Language
function loadTtsVoices(language) {
  ttsVoiceList.innerHTML = "";
  ttsVoices[language].voices.forEach((voice) => {
    const div = document.createElement("div");
    div.textContent = voice.name;
    div.addEventListener("click", () => {
      selectTtsVoice(voice.code);
      ttsVoiceMenu.style.display = "none";
    });
    ttsVoiceList.appendChild(div);
  });
}

// Back to Languages Menu
backToLanguages.addEventListener("click", () => {
  ttsVoiceMenu.style.display = "none";
  ttsMenu.style.display = "block";
});

// Select Voice and Apply to TTS
function selectTtsVoice(voiceCode) {
  selectedVoice = voiceCode;
  console.log("Selected Voice:", selectedVoice);
  // You can now use this voiceCode in your TTS API calls
}

let currentAudio = null; // Track the currently playing audio
let ttsState = "stopped"; // Can be "stopped", "playing", or "paused"

// Function to create a message element with TTS functionality
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);

  if (classes.includes("bot-message")) {
    // Create buttons
    const ttsButton = document.createElement("button");
    ttsButton.classList.add("tts-button");
    ttsButton.innerHTML = '<span class="material-symbols-rounded">text_to_speech</span>';

    const downloadButton = document.createElement("button");
    downloadButton.classList.add("download-button", "hidden");
    downloadButton.innerHTML = '<span class="material-symbols-rounded">download</span>';
    
    const pauseResumeButton = document.createElement("button");
    pauseResumeButton.classList.add("pause-resume-button", "hidden");
    pauseResumeButton.innerHTML = '<span class="material-symbols-rounded">pause</span>';

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("tts-controls");
    buttonContainer.appendChild(ttsButton);
    buttonContainer.appendChild(downloadButton);
    buttonContainer.appendChild(pauseResumeButton);

    // Add content and buttons
    div.innerHTML = content;
    div.appendChild(buttonContainer);

    // Initialize message state
    div.ttsState = "stopped";
    div.audio = null;
    div.audioBlob = null;

    // Event listeners
    ttsButton.addEventListener("click", async () => {
      const text = div.querySelector(".message-text").innerText;
      await generateTTS(text, div);
      playAudio(div);
    });

    downloadButton.addEventListener("click", async () => {
      const text = div.querySelector(".message-text").innerText;
      await handleDownload(text, div, downloadButton);
    });

    pauseResumeButton.addEventListener("click", () => {
      togglePauseResume(div);
    });

  } else {
    div.innerHTML = content;
  }

  return div;
};

async function generateTTS(text, messageElement) {
  // If we already have generated audio, return it
  if (messageElement.audioBlob) {
    return;
  }

  const apiKey = "AIzaSyBOeHpdbvNx-7TXEKNjS9GAOc19IRgr5UE";
  const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const requestBody = {
    input: { text: text },
    voice: { 
      languageCode: selectedVoice.split("-").slice(0, 2).join("-"), 
      name: selectedVoice 
    },
    audioConfig: { audioEncoding: "MP3" },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error("No audio content received");
    }

    // Create audio blob
    const audioData = atob(data.audioContent);
    const arrayBuffer = new ArrayBuffer(audioData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < audioData.length; i++) {
      uint8Array[i] = audioData.charCodeAt(i);
    }
    
    messageElement.audioBlob = new Blob([arrayBuffer], { type: "audio/mp3" });
    messageElement.audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);

  } catch (error) {
    console.error("TTS Generation Error:", error);
    throw error;
  }
}

function playAudio(messageElement) {
  const ttsButton = messageElement.querySelector(".tts-button");
  const downloadButton = messageElement.querySelector(".download-button");
  const pauseResumeButton = messageElement.querySelector(".pause-resume-button");
  const pauseIcon = pauseResumeButton.querySelector(".material-symbols-rounded");

  // Stop any current playback
  if (messageElement.audio) {
    messageElement.audio.pause();
    messageElement.audio.currentTime = 0;
  }

  // Update UI
  messageElement.ttsState = "playing";
  ttsButton.classList.add("hidden");
  downloadButton.classList.remove("hidden");
  pauseResumeButton.classList.remove("hidden");
  pauseIcon.textContent = "pause";

  // Play audio
  messageElement.audio.play();

  // Handle audio end
  messageElement.audio.addEventListener("ended", () => {
    messageElement.ttsState = "stopped";
    ttsButton.classList.remove("hidden");
    pauseResumeButton.classList.add("hidden");
  }, { once: true });
}

async function handleDownload(text, messageElement, downloadButton) {
  // Save original button state
  const originalHTML = downloadButton.innerHTML;
  const originalDisabled = downloadButton.disabled;
  
  // Set loading state
  downloadButton.innerHTML = '<span class="material-symbols-rounded">downloading</span>';
  downloadButton.disabled = true;

  try {
    // Generate TTS if not already available
    if (!messageElement.audioBlob) {
      await generateTTS(text, messageElement);
    }

    // Create download link
    const url = URL.createObjectURL(messageElement.audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tts-${selectedVoice}-${Date.now()}.mp3`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    console.error("Download failed:", error);
    // Show error state briefly
    downloadButton.innerHTML = '<span class="material-symbols-rounded">error</span>';
    await new Promise(resolve => setTimeout(resolve, 1000));
  } finally {
    // Restore button state
    downloadButton.innerHTML = originalHTML;
    downloadButton.disabled = originalDisabled;
  }
}

function downloadAudio(messageElement) {
  if (!messageElement.audioBlob) {
    console.error("No audio available to download");
    return;
  }

  // Create a download link
  const url = URL.createObjectURL(messageElement.audioBlob);
  const a = document.createElement("a");
  a.href = url;
  
  // Generate a filename based on the message content and voice
  const messageText = messageElement.querySelector(".message-text").innerText;
  const filename = `tts-${selectedVoice}-${Date.now()}.mp3`;
  a.download = filename;
  
  // Trigger the download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}


// Function to handle TTS for a specific message
function speakText(text, messageElement) {
  const ttsButton = messageElement.querySelector(".tts-button");
  const downloadButton = messageElement.querySelector(".download-button");
  const pauseResumeButton = messageElement.querySelector(".pause-resume-button");

  // Stop any currently playing audio for this message
  if (messageElement.audio) {
    messageElement.audio.pause();
    messageElement.audio.currentTime = 0;
  }

  const apiKey = "AIzaSyBOeHpdbvNx-7TXEKNjS9GAOc19IRgr5UE"; // Your Google Cloud TTS API key
  const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const requestBody = {
    input: { text: text },
    voice: { languageCode: selectedVoice.split("-").slice(0, 2).join("-"), name: selectedVoice },
    audioConfig: { audioEncoding: "MP3" }, // Output format
  };

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => response.json())
    .then(async (data) => {
      if (data.audioContent) {
        // Decode the base64 audio content
        const audioData = atob(data.audioContent);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < audioData.length; i++) {
          uint8Array[i] = audioData.charCodeAt(i);
        }
        
        // Create a blob for downloading
        messageElement.audioBlob = new Blob([arrayBuffer], { type: "audio/mp3" });
        
        // Create audio URL for playback
        messageElement.audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);

        // Update the TTS state and buttons
        messageElement.ttsState = "playing";
        ttsButton.classList.add("hidden"); // Hide the TTS button
        downloadButton.classList.remove("hidden"); // Show the download button
        pauseResumeButton.classList.remove("hidden"); // Show the Pause button

        // Play the audio
        messageElement.audio.play();

        // Listen for the end of the audio
        messageElement.audio.addEventListener("ended", () => {
          messageElement.ttsState = "stopped";
          ttsButton.classList.remove("hidden"); // Show the TTS button
          downloadButton.classList.remove("hidden"); // Keep download button visible
          pauseResumeButton.classList.add("hidden"); // Hide the Pause/Resume button
        });
      } else {
        console.error("Error: No audio content received");
        fallbackToWebSpeech(text); // Fallback to Web Speech API
      }
    })
    .catch((error) => {
      console.error("Error fetching TTS audio:", error);
      fallbackToWebSpeech(text); // Fallback to Web Speech API
    });
}

// Function to toggle Pause/Resume for a specific message
function togglePauseResume(messageElement) {
  const pauseResumeButton = messageElement.querySelector(".pause-resume-button");
  const pauseIcon = pauseResumeButton.querySelector(".material-symbols-rounded");

  if (!messageElement.audio) return;

  if (messageElement.ttsState === "playing") {
    // Pause the audio
    messageElement.audio.pause();
    messageElement.ttsState = "paused";
    pauseIcon.textContent = "play_arrow";
  } else if (messageElement.ttsState === "paused") {
    // Resume the audio
    messageElement.audio.play();
    messageElement.ttsState = "playing";
    pauseIcon.textContent = "pause";
  }
}

// Function to stop any currently playing TTS audio
function stopAllTTS() {
  // Find all bot messages in the chat body
  const botMessages = document.querySelectorAll(".message.bot-message");

  // Loop through each bot message
  botMessages.forEach((message) => {
    if (message.audio) {
      // Pause the audio if it's playing
      message.audio.pause();
      message.audio.currentTime = 0; // Reset the audio to the beginning

      // Update the TTS state and buttons
      message.ttsState = "stopped";
      const ttsButton = message.querySelector(".tts-button");
      const pauseResumeButton = message.querySelector(".pause-resume-button");

      if (ttsButton && pauseResumeButton) {
        ttsButton.classList.remove("hidden"); // Show the TTS button
        pauseResumeButton.classList.add("hidden"); // Hide the Pause/Resume button
      }
    }
  });
}

// Fallback to Web Speech API
function fallbackToWebSpeech(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

// Call this function when the page loads
window.addEventListener("load", () => {
  loadTtsVoicesData();
});

// Function to escape HTML code
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Function to load chat messages with proper formatting
const loadChatMessages = (messages) => {
  chatBody.innerHTML = ""; // Clear the chat body

  messages.forEach((message) => {
    let messageContent = "";

    // Check if this is a code block (saved as HTML)
    if (message.parts[0].text && message.parts[0].text.includes("code-block")) {
      // Render the saved HTML directly for code blocks
      messageContent = message.parts[0].text;
    } 
    // Handle file attachments from stored data
    else if (message.parts[0].file_data) {
      const fileData = message.parts[0].file_data;
      
      // Create file preview for non-media files
      if (!fileData.mime_type.startsWith("image/") && !fileData.mime_type.startsWith("video/")) {
        messageContent += `
          <div class="message-preview">
            <span class="file-icon" data-type="${getFileType(fileData)}"></span>
            <span class="file-name">${fileData.name}</span>
          </div>`;
      }

      // Add image/video attachment if exists
      if (fileData.mime_type.startsWith("image/")) {
        messageContent += `<img src="data:${fileData.mime_type};base64,${fileData.data}" class="attachment" />`;
      } else if (fileData.mime_type.startsWith("video/")) {
        messageContent += `
          <div class="video-container">
            <video controls class="attachment">
              <source src="data:${fileData.mime_type};base64,${fileData.data}" type="${fileData.mime_type}">
              Your browser does not support the video tag.
            </video>
          </div>`;
      }

      // Add text content if exists (for files with messages)
      if (message.parts[1] && message.parts[1].text) {
        messageContent += `<div class="message-text">${formatBotResponse(message.parts[1].text)}</div>`;
      }
    }
    // Regular text message
    else if (message.parts[0].text) {
      messageContent += `<div class="message-text">${formatBotResponse(message.parts[0].text)}</div>`;
    }

    // Append the message to the chat body
    const messageElement = createMessageElement(
      messageContent,
      message.role === "user" ? "user-message" : "bot-message"
    );
    chatBody.appendChild(messageElement);

    // Reinitialize Prism.js for code blocks
    if (messageContent.includes("code-block")) {
      Prism.highlightAllUnder(messageElement);

      // Reinitialize copy button functionality
      const copyButton = messageElement.querySelector(".copy-code-btn");
      if (copyButton) {
        const code = messageElement.querySelector("code").innerText;
        copyButton.addEventListener("click", () => {
          navigator.clipboard.writeText(code).then(() => {
            copyButton.textContent = "Copied!";
            setTimeout(() => {
              copyButton.textContent = "content_copy";
            }, 2000);
          });
        });
      }
    }
  });

  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
};

// Function to trim unnecessary line breaks from the start and end of the text
const trimLineBreaks = (text) => {
  // Remove leading line breaks
  text = text.replace(/^\n+/, "");
  // Remove trailing line breaks
  text = text.replace(/\n+$/, "");
  return text;
};

const formatBotResponse = (text) => {
  if (!text) return '';

  // First check if this is a code block - if so, return as-is
  if (text.includes('```')) {
    return text;
  }

  // Process tables first (since they're multi-line)
  let formattedText = text.replace(
    /^([^\n]*\|[^\n]*\n)([^\n]*\|[^\n]*\n)((?:\s*[^\n]*\|[^\n]*\n)*)/gm,
    (match, headerLine, separatorLine, bodyLines) => {
      // Process header
      const headers = headerLine
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
      
      // Process body rows
      const rows = [];
      const allLines = bodyLines.split('\n').filter(line => line.trim() !== '');
      
      for (const line of allLines) {
        const cells = line
          .split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '');
        if (cells.length > 0) {
          rows.push(cells);
        }
      }

      // Generate HTML
      let html = '<table class="markdown-table"><thead><tr>';
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      html += '</tr></thead><tbody>';

      rows.forEach(row => {
        html += '<tr>';
        row.forEach((cell, i) => {
          const align = i < separatorLine.split('|').length - 1 && 
                       separatorLine.split('|')[i + 1].match(/^:?-+:?$/) 
                       ? separatorLine.split('|')[i + 1].includes(':') 
                         ? separatorLine.split('|')[i + 1].endsWith(':')
                           ? 'right' 
                           : 'center'
                         : 'left'
                       : 'left';
          html += `<td style="text-align:${align}">${cell}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table>';
      return html;
    }
  );

  // Process other markdown elements
  return formattedText
    // Normalize line endings first
    .replace(/\r\n?/g, '\n')
    
    // Handle code blocks first (to prevent processing inside them)
    .replace(/```([a-z]*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
      const language = lang ? ` language-${lang}` : '';
      return `<pre class="markdown-codeblock"><code class="${language.trim()}">${escapeHtml(code)}</code></pre>`;
    })
    
    // Handle inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    
    // Blockquotes (multi-level support)
    .replace(/^(>+)(.*)$/gm, (match, level, content) => {
      const depth = level.length;
      const cls = depth > 1 ? ` class="markdown-quote nested-${depth}"` : ' class="markdown-quote"';
      return `<blockquote${cls}>${content.trim()}</blockquote>`;
    })
    
    // Headers (h1 to h6)
    .replace(/^#{1,6}\s+(.*?)(?:\s+#+)?$/gm, (match, content, offset, str) => {
      const level = match.match(/^#+/)[0].length;
      return `<h${level} class="chat-heading">${content}</h${level}>`;
    })
    
    // Horizontal rules
    .replace(/^[-*_]{3,}$/gm, '<hr class="markdown-hr">')
    
    // Bold (with edge case handling)
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>')
    
    // Italics (with edge case handling)
    .replace(/(\*|_)(?=\S)([\s\S]*?\S)\1/g, '<em>$2</em>')
    
    // Strikethrough
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
    
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image">')
    
    // Links (with title support)
    .replace(/\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]+)")?\)/g, (match, text, href, title) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}" class="chat-link" target="_blank"${titleAttr}>${text}</a>`;
    })
    
    // Autolinks (URLs and emails)
    .replace(/(^|\s)(https?:\/\/[^\s]+)/g, '$1<a href="$2" class="chat-link" target="_blank">$2</a>')
    .replace(/(^|\s)([^\s]+@[^\s]+\.[^\s]+)/g, '$1<a href="mailto:$2" class="chat-link">$2</a>')
    
    // Lists (unordered and ordered)
    .replace(/^(\s*)[-+*]\s+(.*)$/gm, (match, indent, content) => {
      const depth = Math.floor(indent.length / 2);
      return `${indent}<ul class="markdown-list${depth ? ' nested' : ''}"><li>${content}</li></ul>`;
    })
    .replace(/^(\s*)\d+\.\s+(.*)$/gm, (match, indent, content) => {
      const depth = Math.floor(indent.length / 2);
      return `${indent}<ol class="markdown-list${depth ? ' nested' : ''}"><li>${content}</li></ol>`;
    })
    
    // Paragraphs (handle wrapped text)
    .replace(/^([^\n<].*[^\n>])(?=\n|$)/gm, '<p class="markdown-paragraph">$1</p>')
    
    // Line breaks (only when two spaces at end of line)
    .replace(/  \n/g, '<br>\n')
    
    // Clean up empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/g, '')
    
    // Fix nested lists
    .replace(/<\/([uo])l>\s*<\1l>/g, '');
};


function typeWriter(text, speed, outputElement) {
  // Preprocess the text using formatBotResponse to apply formatting
  text = formatBotResponse(text);

  // Parse the formatted text into DOM nodes
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${text}</div>`, 'text/html');
  let nodes = Array.from(doc.body.firstChild.childNodes);

  // Clear the output element before starting
  outputElement.innerHTML = '';
  
  let currentParent = outputElement;
  const nodeStack = [];
  let currentNodeIndex = 0;
  let currentTextIndex = 0;

  function processTextNode(node) {
    if (currentTextIndex < node.textContent.length) {
      const textNode = document.createTextNode(node.textContent[currentTextIndex]);
      currentParent.appendChild(textNode);
      currentTextIndex++;
      setTimeout(() => processNode(), speed);
    } else {
      currentTextIndex = 0;
      currentNodeIndex++;
      processNode();
    }
  }

  function cloneElement(element) {
    const clone = document.createElement(element.tagName.toLowerCase());
    
    // Copy attributes
    Array.from(element.attributes).forEach(attr => {
      clone.setAttribute(attr.name, attr.value);
    });

    // Copy classes
    clone.className = element.className;

    // Special styling for code elements
    if (element.tagName === 'CODE') {
      if (element.classList.contains('inline-code')) {
        clone.style.padding = '2px 4px';
        clone.style.borderRadius = '4px';
        clone.style.fontFamily = 'monospace';
      }
    }

    // Special handling for tables
    if (element.tagName === 'TABLE') {
      clone.style.borderCollapse = 'collapse';
      clone.style.width = '100%';
      clone.style.margin = '10px 0';
    }

    return clone;
  }

  function processElementNode(node) {
    const clone = cloneElement(node);
    currentParent.appendChild(clone);

    // Handle links to open in new tab
    if (clone.tagName === 'A') {
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(clone.href, '_blank');
      });
    }

    // Handle lists to maintain proper indentation
    if (clone.tagName === 'UL' || clone.tagName === 'OL') {
      clone.style.listStylePosition = 'inside';
      clone.style.paddingLeft = '20px';
      clone.style.margin = '5px 0';
    }

    // Process child nodes recursively if they exist
    if (node.childNodes.length > 0) {
      nodeStack.push({
        parent: currentParent,
        nodes: nodes,
        index: currentNodeIndex + 1
      });
      
      currentParent = clone;
      nodes = Array.from(node.childNodes);
      currentNodeIndex = 0;
      processNode();
    } else {
      currentNodeIndex++;
      processNode();
    }
  }

  function processNode() {
    if (currentNodeIndex >= nodes.length) {
      if (nodeStack.length > 0) {
        const stackItem = nodeStack.pop();
        currentParent = stackItem.parent;
        nodes = stackItem.nodes;
        currentNodeIndex = stackItem.index;
        processNode();
      }
      return;
    }

    const node = nodes[currentNodeIndex];
    
    if (node.nodeType === Node.TEXT_NODE) {
      processTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      processElementNode(node);
    }
  }

  // Start the typing animation
  processNode();
}

// Add this new function to handle table animation
function animateTable(tableElement) {
  // Create a clone of the table to animate
  const animatedTable = tableElement.cloneNode(true);
  tableElement.replaceWith(animatedTable);

  // Set initial state
  animatedTable.style.opacity = '0';
  animatedTable.style.transform = 'translateY(20px)';
  animatedTable.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

  // Hide all cells initially
  const cells = animatedTable.querySelectorAll('td, th');
  cells.forEach(cell => {
    cell.style.opacity = '0';
    cell.style.transform = 'translateY(10px)';
    cell.style.transition = 'all 0.3s ease';
  });

  // Animate table entrance
  setTimeout(() => {
    animatedTable.style.opacity = '1';
    animatedTable.style.transform = 'translateY(0)';

    // Animate cells sequentially
    let delay = 0;
    cells.forEach((cell, index) => {
      setTimeout(() => {
        cell.style.opacity = '1';
        cell.style.transform = 'translateY(0)';
        
        // Add typing animation to cell content
        const originalContent = cell.innerHTML;
        cell.innerHTML = '';
        typeCellContent(cell, originalContent, 5);
      }, delay);
      
      // Increase delay for next cell
      delay += 50 + (index % 3) * 30;
    });
  }, 200);
}

// Helper function for cell content typing
function typeCellContent(cell, content, speed) {
  let index = 0;
  const typingInterval = setInterval(() => {
    if (index < content.length) {
      cell.innerHTML += content[index];
      index++;
    } else {
      clearInterval(typingInterval);
    }
  }, speed);
}

// Function to generate bot response with proper HTML rendering
const generateBotResponse = async (thinkingDiv) => {
  try {
    // Prepare the API request body with proper file handling
    const apiRequestBody = {
      contents: await Promise.all(currentSession.map(async (msg) => {
        const parts = await Promise.all(msg.parts.flatMap(async (part) => {
          if (part.file_data) {
            // List of unsupported file types that should be converted to text
            const unsupportedTypes = [
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
              'application/vnd.ms-excel', // XLS
              'application/msword' // DOC
            ];
            
            if (unsupportedTypes.includes(part.file_data.mime_type)) {
              // For unsupported office docs, use the extracted text content
              return { text: part.file_data.textContent || '[Document content]' };
            } else if (part.file_data.mime_type.startsWith("image/") || part.file_data.mime_type.startsWith("video/")) {
              // For images and videos, use the proper inline_data format
              return [ 
                { text: part.file_data.textContent || '' }, // Optional text description
                { 
                  inline_data: {
                    mime_type: part.file_data.mime_type,
                    data: part.file_data.data
                  }
                }
              ];
            } else {
              // For other files (PDF, text files), use their text content
              return { text: part.file_data.textContent || '' };
            }
          }
          return { text: part.text };
        }));
        return {
          role: msg.role,
          parts: parts.flat()
        };
      }))
    };


    // Fetch bot response from API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiRequestBody),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Extract the bot's response text
    let apiResponseText = data.candidates[0].content.parts[0].text;

    // Remove the thinking indicator but keep the bot logo
    const botLogo = thinkingDiv.querySelector(".bot-avatar");
    thinkingDiv.remove();

    // Process response for code blocks, tables, and regular text
    const lines = apiResponseText.split('\n');
    let inCodeBlock = false;
    let codeContent = [];
    let currentLanguage = '';
    const processedParts = [];
    let currentText = [];

    lines.forEach(line => {
      if (line.trim().startsWith('```') && !inCodeBlock) {
        // Start of code block
        if (currentText.length > 0) {
          processedParts.push(currentText.join('\n'));
          currentText = [];
        }
        inCodeBlock = true;
        currentLanguage = line.trim().slice(3).trim();
      } else if (line.trim().startsWith('```') && inCodeBlock) {
        // End of code block
        processedParts.push({
          type: 'code',
          content: codeContent.join('\n'),
          language: currentLanguage
        });
        inCodeBlock = false;
        currentLanguage = '';
        codeContent = [];
      } else if (inCodeBlock) {
        codeContent.push(line);
      } else {
        currentText.push(line);
      }
    });

    // Add any remaining text after code blocks
    if (currentText.length > 0) {
      processedParts.push(currentText.join('\n'));
    }

    // Handle unclosed code block
    if (inCodeBlock && codeContent.length > 0) {
      processedParts.push({
        type: 'code',
        content: codeContent.join('\n'),
        language: currentLanguage
      });
    }

    // Process all parts (code blocks, tables, and regular text)
    processedParts.forEach(part => {
      if (typeof part === 'object' && part.type === 'code') {
        // Process code blocks
        const language = part.language || "plaintext";
        const code = part.content.trim();
        const escapedCode = escapeHtml(code);
        
        const codeBlock = `
          <div class="code-block">
            <div class="code-header">
              <span>${language}</span>
              <button class="copy-code-btn material-symbols-rounded">content_copy</button>
            </div>
            <pre><code class="language-${language}">${escapedCode}</code></pre>
          </div>
        `;

        const codeMessageDiv = createMessageElement(codeBlock, "bot-message");
        chatBody.appendChild(codeMessageDiv);
        Prism.highlightAllUnder(codeMessageDiv);

        // Add copy functionality
        const copyButton = codeMessageDiv.querySelector(".copy-code-btn");
        copyButton.addEventListener("click", () => {
          navigator.clipboard.writeText(code).then(() => {
            copyButton.textContent = "Copied!";
            setTimeout(() => {
              copyButton.textContent = "content_copy";
            }, 2000);
          });
        });

        // Animate code typing
        const codeElement = codeMessageDiv.querySelector("code");
        const originalCode = codeElement.innerText;
        codeElement.innerText = "";

        let charIndex = 0;
        const codeTypingInterval = setInterval(() => {
          if (charIndex < originalCode.length) {
            const currentCode = originalCode.substring(0, charIndex + 1);
            const highlightedCode = Prism.highlight(currentCode, Prism.languages[language], language);
            codeElement.innerHTML = highlightedCode;
            codeElement.scrollTop = codeElement.scrollHeight;
            charIndex++;
          } else {
            clearInterval(codeTypingInterval);
            const highlightedCode = Prism.highlight(originalCode, Prism.languages[language], language);
            codeElement.innerHTML = highlightedCode;
          }
        }, 0.1);

        currentSession.push({
          role: "model",
          parts: [{ text: codeBlock }],
        });
      } else {
        // Process regular text and tables
        const text = typeof part === 'string' ? part : part.content;
        
        // Detect tables in non-code parts
        const subParts = text.split(/((?:\|.+\|.+\n)(?:\|[-: ]+)+\n(?:(?:\|.+\s*)+))/g);
        
        subParts.forEach(subPart => {
          if (!subPart.trim()) return;

          if (subPart.includes("|") && subPart.includes("-") && subPart.includes("\n")) {
            // Process tables
            const formattedTable = formatBotResponse(subPart);
            const tableContainer = document.createElement('div');
            tableContainer.innerHTML = formattedTable;
            
            const tableMessageDiv = createMessageElement(
              '<div class="message-text"></div>',
              "bot-message"
            );
            tableMessageDiv.querySelector('.message-text').appendChild(tableContainer);
            tableMessageDiv.insertBefore(botLogo.cloneNode(true), tableMessageDiv.firstChild);
            chatBody.appendChild(tableMessageDiv);
            
            // Animate table
            setTimeout(() => {
              const table = tableMessageDiv.querySelector('table');
              if (table) animateTable(table);
            }, 100);

            currentSession.push({
              role: "model",
              parts: [{ text: formattedTable }],
            });
          } else if (subPart.trim()) {
            // Process regular text
            const textContent = trimLineBreaks(subPart);
            const textMessageDiv = createMessageElement(
              '<div class="message-text"></div>',
              "bot-message"
            );
            textMessageDiv.insertBefore(botLogo.cloneNode(true), textMessageDiv.firstChild);
            chatBody.appendChild(textMessageDiv);
            
            // Animate text typing
            typeWriter(textContent, 0.1, textMessageDiv.querySelector('.message-text'));

            currentSession.push({
              role: "model",
              parts: [{ text: textContent }],
            });
          }
        });
      }
    });

    // Update the chat session
    if (currentSessionIndex !== -1) {
      chatSessions[currentSessionIndex].messages = [...currentSession];
    }

    saveChatSessions();
  } catch (error) {
    console.error("Error generating bot response:", error);
    const errorMessageDiv = createMessageElement(
      `<div class="message-text">Error: ${error.message}</div>`,
      "bot-message"
    );
    chatBody.appendChild(errorMessageDiv);
  } finally {
    userData.file = {};
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

async function extractTextFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // For images, just resolve with null (we'll handle them separately)
    if (file.type.startsWith("image/")) {
      resolve(null);
      return;
    }

    // For videos, just resolve with null (we'll handle them separately)
    if (file.type.startsWith("video/")) {
      resolve(null);
      return;
    }
    
    if (file.type === "application/pdf") {
      // Handle PDF files (keep existing code)
      reader.onload = async function(e) {
        try {
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          
          const loadingTask = pdfjsLib.getDocument(e.target.result);
          const pdf = await loadingTask.promise;
          let fullText = "";
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + "\n";
          }
          
          resolve(fullText);
        } catch (error) {
          console.error("Error extracting text from PDF:", error);
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    } 
    else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Handle DOCX files
      reader.onload = async function(e) {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
          resolve(result.value);
        } catch (error) {
          console.error("Error extracting text from DOCX:", error);
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    else if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
             file.type === "application/vnd.ms-excel") {
      // Handle Excel files
      reader.onload = async function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          let fullText = "";
          
          // Process each sheet
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Convert each row to text
            jsonData.forEach(row => {
              fullText += row.join('\t') + '\n';
            });
          });
          
          resolve(fullText);
        } catch (error) {
          console.error("Error extracting text from Excel:", error);
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    else if (file.type.startsWith("text/") || 
             file.name.endsWith(".txt") || 
             file.name.endsWith(".js") || 
             file.name.endsWith(".py") || 
             file.name.endsWith(".java") || 
             file.name.endsWith(".html") || 
             file.name.endsWith(".css")) {
      // Handle plain text and code files
      reader.onload = function(e) {
        resolve(e.target.result);
      };
      reader.readAsText(file);
    }
    else {
      // For unsupported file types or images, just return null
      resolve(null);
    }
  });
}

// Function to update file preview
function updateFilePreview(file) {
  const filePreview = document.createElement("div");
  filePreview.className = "file-preview show";
  
  // Determine file type for icon
  let fileType = "file";
  if (file.type === "application/pdf") fileType = "pdf";
  else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") fileType = "doc";
  else if (file.type.startsWith("text/") || 
           file.name.endsWith(".js") || 
           file.name.endsWith(".py") || 
           file.name.endsWith(".java") || 
           file.name.endsWith(".html") || 
           file.name.endsWith(".css")) fileType = "code";
  else if (file.type.startsWith("video/")) fileType = "video";
  
  // Create file preview HTML
  filePreview.innerHTML = `
    <span class="file-icon" data-type="${fileType}"></span>
    <span class="file-name">${file.name}</span>
    <button type="button" id="file-cancel" class="material-symbols-rounded">close</button>
  `;
  
  // Insert the preview before the message input
  document.querySelector(".chat-form").insertBefore(filePreview, messageInput);
  
  // Add event listener for cancel button
  filePreview.querySelector("#file-cancel").addEventListener("click", () => {
    fileInput.value = "";
    userData.file = {};
    filePreview.remove();
  });
  
  return filePreview;
}

// Handle file input change and preview the selected file
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  
  // Remove any existing preview
  const existingPreview = document.querySelector(".file-preview");
  if (existingPreview) existingPreview.remove();
  
  // Create and show file preview
  const filePreview = updateFilePreview(file);
  
  try {
    // Extract text from the file (for supported types)
    const fileText = await extractTextFromFile(file);
    
    // Store file data in userData
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result.split(",")[1];
      userData.file = {
        data: base64String,
        mime_type: file.type,
        name: file.name,
        textContent: fileText
      };
    };
    
    if (file.type.startsWith("image/")) {
      // For images, read as data URL
      reader.readAsDataURL(file);
    } else {
      // For other files, read as text (but we already have the text)
      reader.readAsDataURL(new Blob([file])); // Still need to store as base64 for display
    }
  } catch (error) {
    console.error("Error processing file:", error);
    fileInput.value = "";
    filePreview.remove();
  }
});

const handleOutgoingMessage = async (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  
  // Remove file preview if exists
  const filePreview = document.querySelector(".file-preview");
  if (filePreview) filePreview.remove();
  
  // Create and display user message
  let messageContent = '';
  
  // Add file preview for non-media files
  if (userData.file.data && !userData.file.mime_type.startsWith("image/") && !userData.file.mime_type.startsWith("video/")) {
    messageContent += `
      <div class="message-preview">
        <span class="file-icon" data-type="${getFileType(userData.file)}"></span>
        <span class="file-name">${userData.file.name}</span>
      </div>`;
  }
  
  // Add the text message if exists
  if (userData.message) {
    messageContent += `<div class="message-text">${formatBotResponse(userData.message)}</div>`;
  }
  
  // Add image/video attachment if exists
  if (userData.file.data) {
    if (userData.file.mime_type.startsWith("image/")) {
      messageContent += `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`;
    } else if (userData.file.mime_type.startsWith("video/")) {
      messageContent += `
        <div class="video-container">
          <video controls class="attachment">
            <source src="data:${userData.file.mime_type};base64,${userData.file.data}" type="${userData.file.mime_type}">
            Your browser does not support the video tag.
          </video>
        </div>`;
    }
  }

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Prepare the parts array for storage
  const parts = [];
  
  // Store file data if exists
  if (userData.file.data) {
    parts.push({
      file_data: {
        data: userData.file.data,
        mime_type: userData.file.mime_type,
        name: userData.file.name,
        textContent: userData.file.textContent
      }
    });
  }
  
  // Store text message if exists (as separate part)
  if (userData.message) {
    parts.push({ text: userData.message });
  }

  // Add user message to the current session
  currentSession.push({
    role: "user",
    parts: parts
  });

  // Update the chat session
  if (currentSessionIndex !== -1) {
    chatSessions[currentSessionIndex].messages = [...currentSession];
  }

  // Update the chat title with the first user message
  if (currentSessionIndex !== -1 && chatSessions[currentSessionIndex].messages.length === 2) {
    const userMessage = userData.message ? userData.message.substring(0, 30) : userData.file.name.substring(0, 30);
    chatSessions[currentSessionIndex].title = `${userMessage}...`;
    loadChatHistory();
  }

  // Save chat sessions to localStorage
  saveChatSessions();

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const thinkingDiv = document.createElement("div");
    thinkingDiv.classList.add("bot-message", "thinking");
    thinkingDiv.innerHTML = `
      <div class="message">
        <div class="bot-avatar">
          <img class="bot-avatar" src="./assets/my-logo.svg" alt="Bot Avatar" width="50" height="50" />
        </div>
        <div class="message-text">
          <div class="thinking-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
    `;
    chatBody.appendChild(thinkingDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(thinkingDiv);
  }, 600);
  
  // Reset file data
  userData.file = {};
};

// Add this helper function
function getFileType(file) {
  if (file.mime_type === "application/pdf") return "pdf";
  if (file.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "doc";
  if (file.mime_type.startsWith("text/") || 
      file.name.endsWith(".js") || 
      file.name.endsWith(".py") || 
      file.name.endsWith(".java") || 
      file.name.endsWith(".html") || 
      file.name.endsWith(".css")) return "code";
  return "file";
}

function getFileType(fileData) {
  if (fileData.mime_type === "application/pdf") return "pdf";
  if (fileData.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "doc";
  if (fileData.mime_type.startsWith("text/") || 
      fileData.name.endsWith(".js") || 
      fileData.name.endsWith(".py") || 
      fileData.name.endsWith(".java") || 
      fileData.name.endsWith(".html") || 
      fileData.name.endsWith(".css")) return "code";
  if (fileData.mime_type.startsWith("video/")) return "video";
  if (fileData.mime_type.startsWith("image/")) return "image";
  return "file";
}

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && !e.shiftKey && (userMessage || userData.file.data) && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  const filePreview = document.querySelector(".file-preview");
  if (filePreview) filePreview.remove();
});

// Handle paste event for clipboard images
messageInput.addEventListener("paste", (e) => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const blob = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result.split(",")[1];
        userData.file = {
          data: base64String,
          mime_type: blob.type,
          name: "pasted-image.png"
        };
        // Show preview for pasted image
        updateFilePreview(blob);
      };
      reader.readAsDataURL(blob);
    }
  }
});

// Initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});
document.querySelector(".chat-form").appendChild(picker);

sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

// History Sidebar Functionality
toggleSidebar.addEventListener("click", () => {
  historySidebar.classList.toggle("open");
});

closeSidebar.addEventListener("click", () => {
  historySidebar.classList.remove("open");
});

// New Chat Button
newChatBtn.addEventListener("click", () => {
  // Stop any currently playing TTS audio
  stopAllTTS();

  // Save the current session to chatSessions if it exists
  if (currentSession.length > 0 && currentSessionIndex !== -1) {
    chatSessions[currentSessionIndex].messages = [...currentSession];
  }

  // Create a new session
  const newSession = {
    title: `Chat ${chatSessions.length + 1}`,
    messages: [
      {
        role: "model",
        parts: [{ text: "Hey there, <br /> How can I help you today?" }],
      },
    ],
    favorite: false,
  };
  chatSessions.push(newSession);
  currentSessionIndex = chatSessions.length - 1; // Set the current session index to the new session
  currentSession = [...newSession.messages]; // Reset the current session

  // Save chat sessions to localStorage
  saveChatSessions();

  // Clear current chat and start a new one
  chatBody.innerHTML = "";

  // Add the initial bot message
  const initialBotMessage = createMessageElement(
    `<img class="bot-avatar" src="./assets/my-logo.svg" alt="Bot Avatar" width="50" height="50" />
      <div class="message-text"> Hey there, <br /> How can I help you today? </div>`,
    "bot-message"
  );
  chatBody.appendChild(initialBotMessage);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Update the history sidebar
  loadChatHistory();
  historySidebar.classList.remove("open");
});

// Load Chat History
function loadChatHistory() {
  chatList.innerHTML = ""; // Clear existing list

  chatSessions.forEach((session, index) => {
    const chatItem = document.createElement("div");
    chatItem.className = `chat-item ${session.favorite ? 'favorite' : ''}`;
    chatItem.innerHTML = `
      <div class="title-wrapper">
        <input type="text" class="chat-title" value="${session.title}" placeholder="Chat ${index + 1}" />
      </div>
      <span class="menu-trigger">⋮</span>
    `;

    // Make the title editable
    const titleInput = chatItem.querySelector("input");
    titleInput.addEventListener("input", (e) => {
      chatSessions[index].title = e.target.value;
      saveChatSessions(); // Save the updated title
    });

    // Add menu functionality
    const menuTrigger = chatItem.querySelector(".menu-trigger");
    const menu = document.querySelector(".chat-menu").cloneNode(true);
    menu.style.display = 'none';
    
    menu.querySelector(".delete-chat-option").addEventListener("click", () => showConfirmationDialog(index));
    menu.querySelector(".favorite-chat-option").addEventListener("click", () => {
      chatSessions[index].favorite = !chatSessions[index].favorite;
      chatItem.classList.toggle("favorite", chatSessions[index].favorite);
      menu.style.display = 'none';
      saveChatSessions(); // Save the updated favorite status
    });
    
    chatItem.appendChild(menu);
    
    menuTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const allMenus = document.querySelectorAll(".chat-menu");
      allMenus.forEach(m => m.style.display = 'none');
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!chatItem.contains(e.target)) {
        menu.style.display = 'none';
      }
    });

    chatItem.addEventListener("click", () => loadChat(index));
    chatList.appendChild(chatItem);
  });
}

// Show Confirmation Dialog
function showConfirmationDialog(index) {
  const confirmationDialog = document.querySelector(".confirmation-dialog");
  confirmationDialog.style.display = "block";

  document.querySelector("#confirm-delete").onclick = () => {
    deleteChat(index);
    confirmationDialog.style.display = "none";
  };

  document.querySelector("#cancel-delete").onclick = () => {
    confirmationDialog.style.display = "none";
  };
}

// Delete Chat
function deleteChat(index) {
  chatSessions.splice(index, 1);
  saveChatSessions(); // Save the updated chat sessions
  loadChatHistory(); // Refresh the history sidebar

  // If the deleted chat was the current session, reset the current session
  if (currentSessionIndex === index) {
    currentSessionIndex = -1;
    currentSession = [];
    chatBody.innerHTML = ""; // Clear the chat body
  }
}

// Load Chat
function loadChat(index) {
  // Stop any currently playing TTS audio
  stopAllTTS();

  // Save the current session before switching
  if (currentSessionIndex !== -1) {
    chatSessions[currentSessionIndex].messages = [...currentSession];
    saveChatSessions(); // Save the updated chat sessions
  }

  const session = chatSessions[index];
  chatBody.innerHTML = ""; // Clear current chat

  // Set the current session to the loaded chat's messages
  currentSessionIndex = index;
  currentSession = session.messages;

  // Display all messages in the chat with proper formatting
  loadChatMessages(session.messages);

  historySidebar.classList.remove("open");
}

// Initialize the history sidebar
loadChatHistory();

// Search functionality
searchChats.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    const chatTitle = item.querySelector("input").value.toLowerCase();
    if (chatTitle.includes(searchTerm)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
});

// Open Game Menu
gameButton.addEventListener("click", () => {
  gameMenu.style.display = "block";
});

// Close Game Menu when clicking outside
document.addEventListener("click", (e) => {
  if (!gameMenu.contains(e.target) && !gameButton.contains(e.target)) {
    gameMenu.style.display = "none";
  }
});

// Close Game Menu
closeGameMenu.addEventListener("click", () => {
  gameMenu.style.display = "none";
});

// Handle Game Selection
gameList.addEventListener("click", (e) => {
  const gameOption = e.target.closest(".game-option");
  if (gameOption) {
    const gameName = gameOption.getAttribute("data-game");
    openGame(gameName);
    gameMenu.style.display = "none";
  }
});

// Function to Open Game with Animation
function openGame(gameName) {
  // Create a blurred background
  const blurOverlay = document.createElement("div");
  blurOverlay.classList.add("blur-overlay");
  document.body.appendChild(blurOverlay);

  // Create a game container
  const gameContainer = document.createElement("div");
  gameContainer.classList.add("game-container");

  // Load the game based on the selected game
  if (gameName === "tic-tac-toe") {
    gameContainer.innerHTML = `
      <iframe src="/AI-Games/tictac.html" style="width: 100%; height: 100%; border: none;"></iframe>
    `;
  }

  // Add close button
  const closeButton = document.createElement("button");
  closeButton.classList.add("close-game-button");
  closeButton.innerHTML = '<span class="material-symbols-rounded">close</span>';
  closeButton.addEventListener("click", closeGame);

  gameContainer.appendChild(closeButton);
  document.body.appendChild(gameContainer);

  // Activate the blur overlay and game container with animation
  setTimeout(() => {
    blurOverlay.classList.add("active");
    gameContainer.classList.add("active");
  }, 10); // Small delay to trigger the transition
}

// Function to Close Game with Animation
function closeGame() {
  const blurOverlay = document.querySelector(".blur-overlay");
  const gameContainer = document.querySelector(".game-container");

  // Reverse the animation
  if (blurOverlay && gameContainer) {
    blurOverlay.classList.remove("active");
    gameContainer.classList.remove("active");

    // Remove elements after the animation completes
    setTimeout(() => {
      document.body.removeChild(blurOverlay);
      document.body.removeChild(gameContainer);
    }, 300); // Match the duration of the transition
  }
}

// STT Button Logic
let isRecording = false;
let recognition;

// Initialize Speech Recognition
function initializeSpeechRecognition() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true; // Keep listening continuously
  recognition.interimResults = true; // Get interim results
  recognition.lang = "en-US"; // Set language

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    messageInput.value = transcript; // Update the input field with the transcript
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (event.error === "no-speech" || event.error === "audio-capture") {
      // If there's no speech or audio capture error, restart recognition
      setTimeout(() => {
        if (isRecording) {
          recognition.start();
        }
      }, 1000); // Restart after 1 second
    }
  };

  recognition.onend = () => {
    if (isRecording) {
      // If recording is still active, restart recognition
      setTimeout(() => {
        recognition.start();
      }, 1000); // Restart after 1 second
    }
  };
}

// Start Recording
function startRecording() {
  if (!recognition) initializeSpeechRecognition();
  recognition.start();
  isRecording = true;
  sttButton.classList.add("recording");
  waveformContainer.classList.add("active");
  drawWaveform();
}

// Stop Recording
function stopRecording() {
  if (recognition) recognition.stop();
  isRecording = false;
  sttButton.classList.remove("recording");
  waveformContainer.classList.remove("active");
}

// Toggle Recording
sttButton.addEventListener("click", () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

// Draw Waveform
function drawWaveform() {
  if (!isRecording) return;

  const analyser = new AudioAnalyser();
  analyser.start();

  function draw() {
    requestAnimationFrame(draw);
    const dataArray = analyser.getFrequencyData();
    waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    waveformCtx.fillStyle = "#5350C4";
    waveformCtx.beginPath();

    const bufferLength = dataArray.length;
    const barWidth = (waveformCanvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      waveformCtx.fillRect(x, waveformCanvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  draw();
}

// Audio Analyser for Waveform
class AudioAnalyser {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.source = null;
  }

  start() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
    });
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}