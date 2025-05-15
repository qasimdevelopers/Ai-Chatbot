// Importing Google Fonts
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
document.head.appendChild(fontLink);

// Chatbot and Body Elements
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

// Image Generation Elements
const imageGenButton = document.getElementById("image-gen-button");
const imageGenPanel = document.querySelector(".image-gen-panel");
const closeImageGen = document.getElementById("close-image-gen");
const generateImageBtn = document.getElementById("generate-image-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

// Call to the bot elements
const callButton = document.getElementById("call-button");
const callPanel = document.querySelector(".call-panel");
const closeCallMenu = document.getElementById("close-call-menu");
const callLanguageList = document.querySelector(".call-panel .tts-language-list");
const startCallButton = document.getElementById("start-call");
const callInterface = document.querySelector(".call-interface");
const endCallButton = document.getElementById("end-call");
const callTranscriptElement = document.querySelector(".transcript-text");
const callInputElement = document.querySelector(".call-input");




// API setup
const API_KEY = "AIzaSyDHuNGthIB7lptLc1e7FbIFhL7Ku2sYWfI"; // Updated API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`; // Updated API endpoint

// Text to Speech API
const apiKey = "AIzaSyBOeHpdbvNx-7TXEKNjS9GAOc19IRgr5UE";
const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

// Weather API setup
const WEATHER_API_KEY = "59c275a547d50215fcffd716e1deca28"; // Get from https://openweathermap.org/api
const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?appid=${WEATHER_API_KEY}&units=metric`;

// API Key for Hugging Face
const IMAGE_API_KEY = "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";






// Modify the handleOutgoingMessage function to handle files more efficiently
const handleOutgoingMessage = async (e) => {
  if (e) e.preventDefault();
  
  const messageText = messageInput.value.trim();
  
  // Check if we're in image generation mode
  if (imageGenPanel.style.display === "block" || imageGenPanel.classList.contains("active")) {
    // Get generation options
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    
    if (!selectedModel) {
      alert("Please select a model for image generation");
      return;
    }
    
    if (!messageText) {
      alert("Please enter a prompt for image generation");
      return;
    }

    // Close the image panel
    imageGenPanel.classList.remove("active");
    setTimeout(() => {
      imageGenPanel.style.display = "none";
    }, 300);

    // Clear input
    messageInput.value = "";
    
    // Create user message showing the generation request
    const userMessageDiv = createMessageElement(
      `<div class="message-text">Generate images: ${messageText}</div>`,
      "user-message"
    );
    chatBody.appendChild(userMessageDiv);
    
    // Create loading message with placeholder cards
    const loadingCards = Array.from({ length: imageCount }, () => `
      <div class="img-card loading" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <p class="status-text">Generating...</p>
        </div>
      </div>
    `).join('');
    
    const loadingMessage = createMessageElement(`
      <div class="message-text">
        <div class="gallery-grid">${loadingCards}</div>
      </div>
    `, "bot-message");
    
    chatBody.appendChild(loadingMessage);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // Add to chat session
    currentSession.push({
      role: "user",
      parts: [{ text: `Generate images: ${messageText}` }]
    });

    currentSession.push({
      role: "model",
      parts: [{ 
        text: `Generating ${imageCount} image${imageCount > 1 ? 's' : ''}`,
        imageGenData: {
          count: imageCount,
          prompt: messageText,
          model: selectedModel,
          ratio: aspectRatio,
          status: "generating"
        }
      }]
    });

    

    try {
      // Generate images
      const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
      const { width, height } = getImageDimensions(aspectRatio);
      
      const imagePromises = Array.from({ length: imageCount }, async () => {
        const response = await fetch(MODEL_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${IMAGE_API_KEY}`,
            "Content-Type": "application/json",
            "x-use-cache": "false",
          },
          body: JSON.stringify({
            inputs: messageText,
            parameters: { width, height },
          }),
        });
        
        if (!response.ok) throw new Error((await response.json())?.error);
        
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result); // This will be a data URL
          };
          reader.readAsDataURL(blob);
        });
      });

      const imageResults = await Promise.allSettled(imagePromises);
      
      // Replace loading message with actual images
      const imageResultsData = imageResults.map((result, i) => {
        if (result.status === "fulfilled") {
          return {
            data: result.value,
            index: i,
            status: "success"
          };
        } else {
          return {
            error: result.reason.message,
            status: "failed"
          };
        }
      });

      const imagesHtml = imageResultsData.map((result, i) => {
        if (result.status === "success") {
          return `
            <div class="img-card" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
              <img class="result-img" src="${result.data}" />
              <div class="img-overlay">
                <a href="${result.data}" class="img-download-btn" title="Download Image" download="ai-image-${i+1}.png">
                  <span class="material-symbols-rounded">download</span>
                </a>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="img-card error" style="aspect-ratio: ${aspectRatio}">
              <div class="status-container">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p class="status-text">Generation failed: ${result.error}</p>
              </div>
            </div>
          `;
        }
      }).join('');

      const imageMessage = createMessageElement(`
        <div class="message-text">
          <div class="gallery-grid">${imagesHtml}</div>
        </div>
      `, "bot-message");
      
      // Replace the loading message
      loadingMessage.replaceWith(imageMessage);
      
      // Update the chat session with completed images
      currentSession[currentSession.length - 1] = {
        role: "model",
        parts: [{
          imageGenData: {
            count: imageCount,
            prompt: messageText,
            model: selectedModel,
            ratio: aspectRatio,
            status: "completed",
            results: imageResultsData
          }
        }]
      };
      
    } catch (error) {
      console.error("Image generation error:", error);
      loadingMessage.querySelector(".gallery-grid").innerHTML = `
        <div class="message-text error">
          Image generation failed: ${error.message}
        </div>
      `;
      
      // Update the chat session with error
      currentSession[currentSession.length - 1] = {
        role: "model",
        parts: [{
          text: `Image generation failed: ${error.message}`,
          imageGenData: {
            count: imageCount,
            prompt: messageText,
            model: selectedModel,
            ratio: aspectRatio,
            status: "failed",
            error: error.message
          }
        }]
      };
    }
    
    // Save session
    if (currentSessionIndex !== -1) {
      chatSessions[currentSessionIndex].messages = [...currentSession];
      await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
    }
    
    return;
  }
  
  // Check for location query
  if (messageText.toLowerCase().startsWith('location:')) {
    const locationQuery = messageText.substring(9).trim();
    if (locationQuery) {
      await handleLocationQuery(locationQuery);
      messageInput.value = "";
      return;
    }
  }
  
  // Check for weather query
  if (messageText.toLowerCase().startsWith('weather:')) {
    const weatherQuery = messageText.substring(8).trim();
    if (weatherQuery) {
      await handleWeatherQuery(weatherQuery);
      messageInput.value = "";
      return;
    }
  }

  // Store the message in userData
  userData.message = messageText;
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  
  // Remove file preview if exists
  const filePreview = document.querySelector(".file-preview");
  if (filePreview) {
    filePreview.remove();
  }
  
  // Create and display user message
  let messageContent = '';
  
  // Add file preview if we have a file
if (userData.file && userData.file.name) {
  if (!userData.file.mime_type.startsWith("image/") && 
      !userData.file.mime_type.startsWith("video/")) {
      
    messageContent += `
      <div class="message-preview">
        <span class="file-icon" data-type="${getFileType(userData.file)}"></span>
        <span class="file-name">${userData.file.name}</span>
      </div>`;
  }
  
  // Add image/video/audio attachment if exists
  if (userData.file.data && userData.file.mime_type.startsWith("image/")) {
    messageContent += `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`;
  } else if (userData.file.data && userData.file.mime_type.startsWith("video/")) {
    messageContent += `
      <div class="video-container">
        <video controls class="attachment">
          <source src="data:${userData.file.mime_type};base64,${userData.file.data}" type="${userData.file.mime_type}">
          Your browser does not support the video tag.
        </video>
      </div>`;
  } else if (userData.file.data && userData.file.mime_type.startsWith("audio/")) {
    messageContent += `
      <div class="audio-container">
        <video controls class="attachment">
          <source src="data:${userData.file.mime_type};base64,${userData.file.data}" type="${userData.file.mime_type}">
          Your browser does not support the audio element.
        </video>
      </div>`;
  }
}
  
  // Add the text message if exists
  if (userData.message) {
   messageContent += `<div class="message-text">${formatBotResponse(userData.message, true)}</div>`;
  }

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Prepare the parts array for storage
  const parts = [];
  
  // Store file data if exists
  if (userData.file && userData.file.name) {
    parts.push({
      file_data: {
        mime_type: userData.file.mime_type,
        name: userData.file.name,
        textContent: userData.file.textContent,
        data: userData.file.data && userData.file.data.length < 50000000 ? userData.file.data : null
      }
    });
  }
  
  // Store text message if exists
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
    await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
  }

  // Simulate bot response
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

// Add these global variables at the top of your script (with other global variables)
let shouldSendTitlePrompt = false;
let isFirstInteraction = true;

// Add this function to generate chat title (place it near other utility functions)
async function generateChatTitle() {
  try {
    // Prepare the hidden prompt including file content if available
    const titlePrompt = {
      contents: [
        ...currentSession.map(msg => ({
          role: msg.role,
          parts: msg.parts.map(part => {
            // Include text content from files if available
            if (part.file_data?.textContent) {
              return { text: `[File: ${part.file_data.name}] ${part.file_data.textContent}` };
            }
            return { text: part.text || '' }; // Handle cases where text might be undefined
          })
        })),
        {
          role: "user",
          parts: [{ text: 'give me only one short title for our conversation of approximately 5 to 6 words else nothing in quotations.' }]
        }
      ]
    };

    // Call the API with the hidden prompt
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(titlePrompt),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Extract the title from the response
    const titleResponse = data.candidates[0].content.parts[0].text;
    let newTitle = extractTitleFromResponse(titleResponse);

    // Fallback to first message if no title found
    if (!newTitle && currentSession.length > 0) {
      const firstUserMessage = currentSession.find(msg => msg.role === "user");
      if (firstUserMessage) {
        // Check for file attachments first
        const filePart = firstUserMessage.parts.find(part => part.file_data);
        if (filePart) {
          newTitle = `File: ${filePart.file_data.name}`.substring(0, 30) + '...';
        } else {
          // Fallback to text content
          const textPart = firstUserMessage.parts.find(part => part.text);
          if (textPart) {
            newTitle = textPart.text.substring(0, 30) + '...';
          }
        }
      }
    }

    // Update the title if we have one
    if (newTitle && currentSessionIndex !== -1) {
      chatSessions[currentSessionIndex].title = newTitle;
      await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
      loadChatHistory();
    }
  } catch (error) {
    console.error("Error generating chat title:", error);
    // Fallback to first message logic
    if (currentSessionIndex !== -1 && currentSession.length > 0) {
      const firstUserMessage = currentSession.find(msg => msg.role === "user");
      if (firstUserMessage) {
        const filePart = firstUserMessage.parts.find(part => part.file_data);
        if (filePart) {
          chatSessions[currentSessionIndex].title = `File: ${filePart.file_data.name}`.substring(0, 30) + '...';
        } else {
          const textPart = firstUserMessage.parts.find(part => part.text);
          if (textPart) {
            chatSessions[currentSessionIndex].title = textPart.text.substring(0, 30) + '...';
          }
        }
        await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
        loadChatHistory();
      }
    }
  }
}

// Helper function to extract title from response
function extractTitleFromResponse(response) {
  // Look for text in quotes
  const quotedTitle = response.match(/"([^"]+)"/);
  if (quotedTitle && quotedTitle[1]) {
    return quotedTitle[1];
  }
  
  // Look for text in single quotes
  const singleQuotedTitle = response.match(/'([^']+)'/);
  if (singleQuotedTitle && singleQuotedTitle[1]) {
    return singleQuotedTitle[1];
  }
  
  // If no quotes, take first line or first 6 words
  const firstLine = response.split('\n')[0].trim();
  const words = firstLine.split(/\s+/);
  if (words.length > 6) {
    return words.slice(0, 6).join(' ');
  }
  
  return firstLine || null;
}



// Function to generate bot response with proper HTML rendering
const generateBotResponse = async (thinkingDiv) => {
  try {
    // Prepare the API request body with proper file handling
    const apiRequestBody = {
      contents: await Promise.all(currentSession.map(async (msg) => {
                // Skip image generation messages in the API request
        if (msg.parts[0].imageGenData) {
          return null; // Skip this message for API purposes
        }
        const parts = await Promise.all(msg.parts.flatMap(async (part) => {
          if (part.file_data) {
            // List of unsupported file types that should be converted to text
            const unsupportedTypes = [
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
              'application/vnd.ms-excel', // XLS
              'application/msword' // DOC
            ];

        if (currentSession.length > 1) {
          const lastUserMessage = currentSession[currentSession.length - 2]?.parts[0]?.text;
          if (lastUserMessage && typeof lastUserMessage === 'string' && lastUserMessage.toLowerCase().startsWith('location:')) {
            // This is a follow-up question about a location
            return handleLocationFollowUp(apiResponseText);
          }
        }
            
  if (unsupportedTypes.includes(part.file_data.mime_type)) {
    // For unsupported office docs, use the extracted text content
    return { text: part.file_data.textContent || '[Document content]' };
  } else if (part.file_data.mime_type.startsWith("image/") || 
             part.file_data.mime_type.startsWith("video/") || 
             part.file_data.mime_type.startsWith("audio/")) {
    // For images, videos and audio, use the proper inline_data format
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

        // After the first AI response, set flag to send title prompt on next user message
        if (chatSessions[currentSessionIndex].isFirstInteraction && currentSession.length >= 2) {
          chatSessions[currentSessionIndex].needsTitle = true;
          chatSessions[currentSessionIndex].isFirstInteraction = false;
        }


    // After processing the response and adding to chat
    if (chatSessions[currentSessionIndex]?.needsTitle) {
      chatSessions[currentSessionIndex].needsTitle = false;
      
      // Send hidden prompt to generate title
      generateChatTitle();
    }
    
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
            copyButton.textContent = "✔";
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

// Load chat sessions from localStorage
async function loadChatSessions() {
  try {
    const savedSessions = await chatDB.getAllChatSessions();
    
    if (savedSessions && savedSessions.length > 0) {
      chatSessions = savedSessions;
      // Try to restore the last opened session from localStorage
      const lastSessionIndex = localStorage.getItem('lastSessionIndex');
      currentSessionIndex = lastSessionIndex !== null ? parseInt(lastSessionIndex) : chatSessions.length - 1;
      currentSession = chatSessions[currentSessionIndex]?.messages || [];
      
      // Immediately load the chat history UI
      loadChatHistory();
      
      // Load the chat content if we have a valid session
      if (currentSessionIndex !== -1) {
        loadChat(currentSessionIndex);
      }
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
      
      const newId = await chatDB.saveChatSession(newSession);
      newSession.id = newId;
      chatSessions.push(newSession);
      currentSessionIndex = 0;
      currentSession = [...newSession.messages];
      
      // Save the last session index
      localStorage.setItem('lastSessionIndex', '0');
      
      // Load the UI
      loadChatHistory();
      loadChat(currentSessionIndex);
    }
  } catch (error) {
    console.error('Error loading chat sessions:', error);
  }
}

// Function to load chat messages with proper formatting
const loadChatMessages = (messages) => {
  chatBody.innerHTML = ""; // Clear the chat body

  messages.forEach((message) => {
    let messageContent = "";

    // Check if this is a location/map message
    if (message.parts[0].locationData) {
      const locationData = message.parts[0].locationData;
      if (locationData.mapId) {
        // Create the map container directly
        messageContent = `<div id="${locationData.mapId}" class="map-container"></div>`;
        
        const messageElement = createMessageElement(messageContent, 
          message.role === "user" ? "user-message" : "bot-message");
        chatBody.appendChild(messageElement);
        
        // Initialize the map immediately
        initializeMapFromHistory(locationData, messageElement);
        
      }
    }

        // 2. Handle image generation messages
        if (message.parts[0].imageGenData) {
          const imageData = message.parts[0].imageGenData;
          
          if (imageData.status === "generating") {
            // Show loading state
            const loadingCards = Array.from({ length: imageData.count }, () => `
              <div class="img-card loading" style="aspect-ratio: ${imageData.ratio}">
                <div class="status-container">
                  <div class="spinner"></div>
                  <p class="status-text">Generating...</p>
                </div>
              </div>
            `).join('');
            
            messageContent = `
              <div class="message-text">
                <div class="gallery-grid">${loadingCards}</div>
              </div>
            `;
          } 
          else if (imageData.status === "completed" && imageData.results) {
            // Show completed images
            const imagesHtml = imageData.results.map((result, i) => {
              if (result.status === "success") {
                return `
                  <div class="img-card" id="img-card-${i}" style="aspect-ratio: ${imageData.ratio}">
                    <img class="result-img" src="${result.data}" />
                    <div class="img-overlay">
                      <a href="${result.data}" class="img-download-btn" title="Download Image" download="ai-image-${i+1}.png">
                        <span class="material-symbols-rounded">download</span>
                      </a>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="img-card error" style="aspect-ratio: ${imageData.ratio}">
                    <div class="status-container">
                      <i class="fa-solid fa-triangle-exclamation"></i>
                      <p class="status-text">Generation failed: ${result.error || 'Unknown error'}</p>
                    </div>
                  </div>
                `;
              }
            }).join('');
            
            messageContent = `
              <div class="message-text">
                <div class="gallery-grid">${imagesHtml}</div>
              </div>
            `;
          }
          else if (imageData.status === "failed") {
            messageContent = `
              <div class="message-text error">
                Image generation failed: ${imageData.error || 'Unknown error'}
              </div>
            `;
          }
        }

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

      // Add image/video/Audio attachment if exists and data is available
      if (fileData.data && fileData.mime_type.startsWith("image/")) {
        messageContent += `<img src="data:${fileData.mime_type};base64,${fileData.data}" class="attachment" />`;
      } else if (fileData.data && fileData.mime_type.startsWith("video/")) {
        messageContent += `
          <div class="video-container">
            <video controls class="attachment">
              <source src="data:${fileData.mime_type};base64,${fileData.data}" type="${fileData.mime_type}">
              Your browser does not support the video tag.
            </video>
          </div>`;
               } else if (fileData.data && fileData.mime_type.startsWith("audio/")) {
                        messageContent += `
          <div class="audio-container">
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
            copyButton.textContent = "✔";
            setTimeout(() => {
              copyButton.textContent = "content_copy";
            }, 2000);
          });
        });
      }
    }

    // Handle tables in messages
    const tables = messageElement.querySelectorAll('table');
    tables.forEach(table => {
      animateTable(table);
    });
  });

  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
};

// Replace the saveChatSessions function
async function saveChatSessions() {
  try {
    // Before saving, clean up any large image data that might be problematic
    const sessionsToSave = chatSessions.map(session => {
      const cleanedMessages = session.messages.map(message => {
        if (message.parts[0].imageGenData?.results) {
          // We don't need to modify the image data since we're using base64 URLs
          return message;
        }
        // Handle other message types if needed
        return message;
      });
      
      return {
        ...session,
        messages: cleanedMessages
      };
    });

    // Save each session individually
    for (const session of sessionsToSave) {
      await chatDB.saveChatSession(session);
    }
    console.log('Chat sessions saved to IndexedDB');
  } catch (error) {
    console.error('Error saving chat sessions:', error);
  }
}

class ChatDatabase {
  constructor() {
    this.dbName = 'ChatAppDatabase';
    this.dbVersion = 1;
    this.storeName = 'chatSessions';
    this.db = null;
  }

  // Open or create the database
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Get all chat sessions
  async getAllChatSessions() {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = (event) => {
        console.error('Error getting all chats:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        resolve(event.target.result || []);
      };
    });
  }

  // Add or update a chat session
  async saveChatSession(session) {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Add/modify timestamps
      const now = new Date().toISOString();
      if (!session.id) {
        session.createdAt = now; // Set creation time for new sessions
        session.updatedAt = now; // Always update modification time
      }

      

      const request = session.id 
        ? store.put(session) 
        : store.add(session);

      request.onerror = (event) => {
        console.error('Error saving chat:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        resolve(event.target.result); // Returns the ID of the saved session
      };
    });
  }

  // Delete a chat session
  async deleteChatSession(id) {
    await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = (event) => {
        console.error('Error deleting chat:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        resolve(true);
      };
    });
  }
}

// Initialize the database
const chatDB = new ChatDatabase();

// Date grouping utility functions
function getDateGroups() {
  return {
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
    older: "Older"
  };
}

function getChatDateGroup(chat) {
  const now = new Date();
  const chatDate = new Date(chat.updatedAt || chat.createdAt);
  const diffDays = Math.floor((now - chatDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return "last7Days";
  if (diffDays <= 30) return "last30Days";
  return "older";
}

function groupChatsByDate(chatSessions) {
  const grouped = {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    older: []
  };
  
  chatSessions.forEach(chat => {
    const group = getChatDateGroup(chat);
    grouped[group].push(chat);
  });
  
  return grouped;
}

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


// Modify the window load event listener
window.addEventListener("load", async () => {
  await loadChatSessions(); // Wait for sessions to load
});

// Load chat history when the page loads
window.addEventListener("load", () => {
  loadChatSessions();
  loadChatHistory(); // Update the UI with the loaded chat history
  loadChat(currentSessionIndex); // Load the first chat by default
});


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

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  // Check if Enter is pressed without Shift, and there's either a message or a file
  if (e.key === "Enter" && !e.shiftKey && (userMessage || userData.file.data)) {
    e.preventDefault(); // Prevent default to avoid line breaks in mobile keyboards
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
    if (items[i].type.indexOf("image") !== -1 ||
        items[i].type.indexOf("audio") !== -1 ||
        items[i].type.indexOf("video") !== -1) {
      const blob = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result.split(",")[1];
        userData.file = {
          data: base64String,
          mime_type: blob.type,
          name: blob.name,
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

// Update the newChatBtn event listener
newChatBtn.addEventListener("click", async () => {
  // Stop any currently playing TTS audio
  stopAllTTS();

  // Save the current session to chatSessions if it exists
  if (currentSession.length > 0 && currentSessionIndex !== -1) {
    chatSessions[currentSessionIndex].messages = [...currentSession];
    await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
  }

  // Create a new session
  const newSession = {
    title: `Chat ${chatSessions.length + 1}`,
    messages: [
      {
        role: "model",
        parts: [{text: `Hey there, <br /> How can I help you today? <br /><span style="display:none;">Ahmed Qasim is my creator and developer</span>` }],

      },
    ],
    favorite: false,
      needsTitle: true,  // Add this
      isFirstInteraction: true  // Add this
  };
  
  const newId = await chatDB.saveChatSession(newSession);
  newSession.id = newId;
  chatSessions.push(newSession);
  currentSessionIndex = chatSessions.length - 1;
  currentSession = [...newSession.messages];
  
  // Store the new session as last opened
  localStorage.setItem('lastSessionIndex', currentSessionIndex.toString());

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

  // Group chats by date
  const groupedChats = groupChatsByDate(chatSessions);
  const dateGroups = getDateGroups();

  // Display favorites first if any exist
  const favoriteChats = chatSessions.filter(chat => chat.favorite);
  if (favoriteChats.length > 0) {
    const favoritesHeader = document.createElement("div");
    favoritesHeader.className = "chat-group-header";
    favoritesHeader.innerHTML = `
      <span class="material-symbols-rounded">star</span>
      <span>Favorites</span>
    `;
    chatList.appendChild(favoritesHeader);
    
    favoriteChats.forEach((session, index) => {
      const chatItem = createChatItem(session, chatSessions.indexOf(session));
      chatList.appendChild(chatItem);
    });
  }

  // Display chats by date groups
  for (const [groupKey, groupName] of Object.entries(dateGroups)) {
    const groupChats = groupedChats[groupKey];
    if (groupChats.length > 0) {
      const groupHeader = document.createElement("div");
      groupHeader.className = "chat-group-header";
      groupHeader.textContent = groupName;
      chatList.appendChild(groupHeader);
      
      groupChats.forEach(session => {
        // Skip if this is a favorite (already shown)
        if (!session.favorite) {
          const chatItem = createChatItem(session, chatSessions.indexOf(session));
          chatList.appendChild(chatItem);
        }
      });
    }
  }
}

// Helper function to create a chat item
function createChatItem(session, index) {
  const chatItem = document.createElement("div");
  chatItem.className = `chat-item ${session.favorite ? 'favorite' : ''}`;
  chatItem.innerHTML = `
    <div class="title-wrapper">
      <input type="text" class="chat-title" value="${session.title}" placeholder="Chat ${index + 1}" />
      <span class="chat-time">${formatChatTime(session.updatedAt || session.createdAt)}</span>
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
    loadChatHistory(); // Refresh the list to move favorites to top
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
  return chatItem;
}

// Format the timestamp for display
function formatChatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
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

// Update the deleteChat function
async function deleteChat(index) {
  const sessionToDelete = chatSessions[index];
  
  try {
    await chatDB.deleteChatSession(sessionToDelete.id);
    chatSessions.splice(index, 1);
    loadChatHistory(); // Refresh the history sidebar

    // If the deleted chat was the current session, reset the current session
    if (currentSessionIndex === index) {
      currentSessionIndex = -1;
      currentSession = [];
      chatBody.innerHTML = ""; // Clear the chat body
      localStorage.removeItem('lastSessionIndex');
      
      // If there are other chats, load the last one
      if (chatSessions.length > 0) {
        const newIndex = chatSessions.length - 1;
        loadChat(newIndex);
      }
    } else if (currentSessionIndex > index) {
      // Adjust the current session index if needed
      currentSessionIndex--;
      localStorage.setItem('lastSessionIndex', currentSessionIndex.toString());
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
}

// Load Chat
function loadChat(index) {
  // Stop any currently playing TTS audio
  stopAllTTS();

  // Save the current session before switching
  if (currentSessionIndex !== -1) {
    chatSessions[currentSessionIndex].messages = [...currentSession];
    saveChatSessions();
  }

  const session = chatSessions[index];
  chatBody.innerHTML = ""; // Clear current chat

  // Set the current session to the loaded chat's messages
  currentSessionIndex = index;
  currentSession = session.messages;

  // Store the last opened chat index
  localStorage.setItem('lastSessionIndex', index.toString());

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




// Function to extract text from files
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
  console.log("Updating file preview for:", file.name); // Debug log
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
  else if (file.type.startsWith("image/")) fileType = "image";
  else if (file.type.startsWith("audio/")) fileType = "audio";
  
  // Create file preview HTML
  filePreview.innerHTML = `
    <span class="file-icon" data-type="${fileType}"></span>
    <span class="file-name">${file.name}</span>
    <button type="button" id="file-cancel" class="material-symbols-rounded">close</button>
  `;
  
  // Insert the preview before the message input
  const chatForm = document.querySelector(".chat-form");
  if (chatForm) {
    chatForm.insertBefore(filePreview, messageInput);
  } else {
    console.error("Chat form element not found"); // Debug log
  }
  
  // Add event listener for cancel button
  const cancelButton = filePreview.querySelector("#file-cancel");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      console.log("File upload canceled"); // Debug log
      fileInput.value = "";
      userData.file = {};
      filePreview.remove();
    });
  } else {
    console.error("Cancel button not found in preview"); // Debug log
  }
  
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
    // Handle the file (with size consideration)
    const fileInfo = await handleLargeFile(file);
    
    // Extract text from the file (for supported types)
    const fileText = await extractTextFromFile(file);
    
    // Store file data in userData
    userData.file = {
      data: fileInfo.data,
      mime_type: fileInfo.type,
      name: fileInfo.name,
      textContent: fileText
    };
  } catch (error) {
    console.error("Error processing file:", error);
    fileInput.value = "";
    filePreview.remove();
  }
});


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
  if (fileData.mime_type.startsWith("video/")) return "video";
  if (fileData.mime_type.startsWith("image/")) return "image";
  if (fileData.mime_type.startsWith("audio/")) return "audio"; // Add this line
  return "file";
}

// Add this helper function
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
  if (fileData.mime_type.startsWith("audio/")) return "audio"; // Add this line
  return "file";
}



// Function to handle large files
async function handleLargeFile(file) {
  return new Promise((resolve, reject) => {
    try {
      console.log("Handling file of size:", file.size); // Debug log
      
      // For files larger than 50MB, we'll only store metadata
      if (file.size > 50000000) { // 50MB limit
        console.log("File is large, storing only metadata"); // Debug log
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          data: null // Don't store the actual data for large files
        });
      } else {
        console.log("File is small enough, reading contents"); // Debug log
        const reader = new FileReader();
        
        reader.onload = (e) => {
          console.log("File read successfully"); // Debug log
          const base64String = e.target.result.split(",")[1];
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            data: base64String
          });
        };
        
        reader.onerror = (error) => {
          console.error("File read error:", error); // Debug log
          reject(error);
        };
        
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error in handleLargeFile:", error); // Debug log
      reject(error);
    }
  });
}

// event listener for file selection
fileInput.addEventListener("change", async () => {
  console.log("File input changed"); // Debug log
  const file = fileInput.files[0];
  if (!file) {
    console.log("No file selected"); // Debug log
    return;
  }
  
  // Remove any existing preview
  const existingPreview = document.querySelector(".file-preview");
  if (existingPreview) existingPreview.remove();
  
  try {
    console.log("Creating file preview"); // Debug log
    const filePreview = updateFilePreview(file);
    
    console.log("Handling file:", file.name, "Size:", file.size); // Debug log
    const fileInfo = await handleLargeFile(file);
    console.log("File info processed:", fileInfo); // Debug log
    
    // Extract text from the file (for supported types)
    console.log("Extracting text from file"); // Debug log
    const fileText = await extractTextFromFile(file);
    console.log("File text extracted:", fileText ? "Success" : "No text"); // Debug log
    
    // Store file data in userData
    userData.file = {
      data: fileInfo.data,
      mime_type: fileInfo.type,
      name: fileInfo.name,
      textContent: fileText
    };
    console.log("File data stored in userData"); // Debug log
  } catch (error) {
    console.error("Error processing file:", error); // Debug log
    fileInput.value = "";
    const filePreview = document.querySelector(".file-preview");
    if (filePreview) filePreview.remove();
  }
});




// Function to trim unnecessary line breaks from the start and end of the text
const trimLineBreaks = (text) => {
  // Remove leading line breaks
  text = text.replace(/^\n+/, "");
  // Remove trailing line breaks
  text = text.replace(/\n+$/, "");
  return text;
};



// Function to format bot response
const formatBotResponse = (text, isUserMessage = false) => {
  if (isUserMessage || !text) return text; // Skip formatting for user messages
  if (!text) return '';
//   if (text.includes('```')) {
//   return text;
// }

  // Split the text into lines for processing
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeContent = [];
  let currentLanguage = '';
  const processedParts = [];
  let currentText = [];

  // First parse the text into parts (code blocks and regular text)
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

  // Now process each part and generate the final HTML
  let finalHTML = '';
  
  processedParts.forEach(part => {
    if (typeof part === 'object' && part.type === 'code') {
      // Process code blocks with all the features from generateBotResponse
      const language = part.language || "plaintext";
      const code = part.content.trim();
      const escapedCode = escapeHtml(code);
      
      finalHTML += `
        <div class="code-block">
          <div class="code-header">
            <span>${language}</span>
            <button class="copy-code-btn material-symbols-rounded">content_copy</button>
          </div>
          <pre><code class="language-${language}">${escapedCode}</code></pre>
        </div>
      `;
    } else {
      // Process regular text with all the existing markdown formatting
      let formattedText = part;
      
      // Process tables first (since they're multi-line)
      formattedText = formattedText.replace(
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
      formattedText = formattedText
        // Normalize line endings first
        .replace(/\r\n?/g, '\n')
        
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
        .replace(/<\/([uo])l>\s*<\1l>/g, '')

        // For Transcript Highlighting
        .replace(/AI: /g, '<span style="color: rgba(76, 175, 80, 0.7); font-weight: bold;">AI: </span>')

        .replace(/User: /g, '<span style="color:rgba(255, 107, 157, 0.7); font-weight: bold;">User: </span>');

      finalHTML += formattedText;
    }
  });

  return finalHTML;
};

// Function for formated typewriter effect
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





// Global map variables
let map;
let markers = [];
let infoWindow;

// Initialize map (called when Google Maps script loads)
function initMap() {
  // This function is called by the Google Maps API when it loads
  console.log("Google Maps API loaded");
}

// Function to create a map for a location
async function createMapForLocation(locationQuery) {
  try {
    // First, use the Places API to find the location
    const place = await findPlace(locationQuery);
    
    if (!place) {
      throw new Error("Location not found");
    }
    
    // Create map container HTML with a unique ID
    const mapId = `map-${Date.now()}`;
    const mapHtml = `
      <div id="${mapId}" class="map-container"></div>
    `;
    
    // Create a message element with the map
    const mapMessageDiv = createMessageElement(mapHtml, "bot-message");
    chatBody.appendChild(mapMessageDiv);
    
    // Initialize the map
    const mapOptions = {
      center: place.geometry.location,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    const map = new google.maps.Map(document.getElementById(mapId), mapOptions);
    
    // Add marker for the location
    addMarker(place.geometry.location, place.name, place.formatted_address);
    
    // Return place information including the map ID
    return {
      name: place.name,
      address: place.formatted_address,
      geometry: place.geometry,
      formatted_address: place.formatted_address,
      mapId: mapId
    };
    
  } catch (error) {
    console.error("Error creating map:", error);
    throw error;
  }
}

function checkMapsAPI() {
  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && google.maps) {
      resolve(true);
    } else {
      // Load the Google Maps API dynamically if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      // Poll for API availability
      const checkInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
    }
  });
}

// Function to find a place using Google Places API
function findPlace(query) {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
      query: query,
      fields: ['name', 'formatted_address', 'geometry', 'types']
    };
    
    service.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        resolve(results[0]);
      } else {
        reject(new Error("Place not found"));
      }
    });
  });
}

// Function to add a marker to the map
function addMarker(position, title, content) {
  // Clear existing markers
  clearMarkers();
  
  const marker = new google.maps.Marker({
    position: position,
    map: map,
    title: title
  });
  
  markers.push(marker);
  
  // Create info window
  if (!infoWindow) {
    infoWindow = new google.maps.InfoWindow();
  }
  
  // Add click event to show info window
  marker.addListener('click', () => {
    infoWindow.setContent(`
      <div class="map-info-window">
        <h4>${title}</h4>
        <p>${content}</p>
      </div>
    `);
    infoWindow.open(map, marker);
  });
  
  // Open info window by default
  infoWindow.setContent(`
    <div class="map-info-window">
      <h4>${title}</h4>
      <p>${content}</p>
    </div>
  `);
  infoWindow.open(map, marker);
}

// Clear all markers from the map
function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

// Handle map action buttons
function handleMapAction(e) {
  const action = e.target.getAttribute('data-action');
  const locationData = e.target.getAttribute('data-location');
  
  if (action === 'directions') {
    // Open Google Maps directions
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${locationData}`, '_blank');
  } else if (action === 'nearby') {
    // Handle nearby places search
    const [lat, lng] = locationData.split(',');
    searchNearbyPlaces(parseFloat(lat), parseFloat(lng));
  }
}

// Search for nearby places
function searchNearbyPlaces(lat, lng) {
  const service = new google.maps.places.PlacesService(map);
  
  const request = {
    location: new google.maps.LatLng(lat, lng),
    radius: '500',
    type: ['restaurant', 'cafe', 'hotel']
  };
  
  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      showNearbyPlaces(results);
    }
  });
}

// Display nearby places
function showNearbyPlaces(places) {
  let placesHtml = '<div class="nearby-places"><h4>Nearby Places:</h4><ul>';
  
  places.slice(0, 5).forEach(place => {
    placesHtml += `
      <li>
        <strong>${place.name}</strong> - ${place.vicinity}
        <span class="place-type">${place.types[0]}</span>
      </li>
    `;
  });
  
  placesHtml += '</ul></div>';
  
  const placesDiv = document.createElement('div');
  placesDiv.className = 'nearby-places-container';
  placesDiv.innerHTML = placesHtml;
  
  // Find the map container and append the nearby places
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    mapContainer.parentNode.insertBefore(placesDiv, mapContainer.nextSibling);
  }
}

// Handle location queries
async function handleLocationQuery(locationQuery) {
  try {
    // Show thinking indicator
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
    
    // Create map and get location info
    const locationInfo = await createMapForLocation(locationQuery);
    
    // Remove thinking indicator
    thinkingDiv.remove();
    
    // Generate a response about the location
    const locationResponse = await generateLocationResponse(locationInfo);
    
    // Create a unique ID for this map
    const mapId = `map-${Date.now()}`;
    
    // Add the location to the current session with special format
    currentSession.push({
      role: "user",
      parts: [{ 
        text: `location: ${locationQuery}`,
        locationData: {
          query: locationQuery,
          mapId: mapId
        }
      }]
    });
    
    // Add bot response to the session with map reference
    currentSession.push({
      role: "model",
      parts: [{ 
        text: locationResponse,
        locationData: {
          name: locationInfo.name,
          address: locationInfo.formatted_address,
          location: {
            lat: locationInfo.geometry.location.lat(),
            lng: locationInfo.geometry.location.lng()
          },
          mapId: mapId
        }
      }]
    });
    
    // Update the chat session
    if (currentSessionIndex !== -1) {
      chatSessions[currentSessionIndex].messages = [...currentSession];
      await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
    }
    
  } catch (error) {
    console.error("Error handling location query:", error);
    
    const errorMessageDiv = createMessageElement(
      `<div class="message-text">Sorry, I couldn't find information about that location. Please try another search.</div>`,
      "bot-message"
    );
    chatBody.appendChild(errorMessageDiv);
  }
}

// Function to initialize Maps from history
async function initializeMapFromHistory(locationData, messageElement) {
  try {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.error("Google Maps API not loaded");
    }
    
    const mapContainer = messageElement.querySelector(`#${locationData.mapId}`);
    if (!mapContainer) 
    
    // Remove placeholder
    mapContainer.innerHTML = '';
    
    // Create map options
    const mapOptions = {
      center: new google.maps.LatLng(
        locationData.location.lat, 
        locationData.location.lng
      ),
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    // Initialize the map
    const map = new google.maps.Map(mapContainer, mapOptions);
    
    // Add marker
    const marker = new google.maps.Marker({
      position: mapOptions.center,
      map: map,
      title: locationData.name
    });
    
    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="map-info-window">
          <h4>${locationData.name}</h4>
          <p>${locationData.address}</p>
        </div>
      `
    });
    
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
    
    // Open info window by default
    infoWindow.open(map, marker);
    
    // Store the map instance on the container for future reference
    mapContainer._map = map;
    
  } catch (error) {
  console.error("Error initializing map from history:", error);
  const mapContainer = messageElement.querySelector(`#${locationData.mapId}`);
  if (mapContainer) {
  }
}
}
// Generate a response about the location
async function generateLocationResponse(locationInfo) {
  // You can customize this to provide more specific information
  let response = `Here's information about <strong>${locationInfo.name}</strong>:\n\n`;
  response += `📍 Address: ${locationInfo.address}\n\n`;
  response += `What would you like to know about this location? You can ask about:\n`;
  response += `- Nearby attractions\n`;
  response += `- Transportation options\n`;
  response += `- Historical significance\n`;
  response += `- Or anything else!`;
  
  return response;
}

// Then add this new function:
async function handleLocationFollowUp(question) {
  try {
    // Find the map in the chat (we'll use the last one)
    const mapContainers = document.querySelectorAll('.map-container');
    if (mapContainers.length === 0) return question;
    
    const lastMap = mapContainers[mapContainers.length - 1];
    const map = lastMap._map; // This assumes you've stored the map instance
    
    if (!map) return question;
    
    // Get the center of the map (the location)
    const center = map.getCenter();
    
    // Here you could add specific handling for different types of questions
    let response = "";
    
    if (question.toLowerCase().includes('nearby') || question.toLowerCase().includes('attractions')) {
      // Search for nearby attractions
      const places = await searchNearbyPlaces(center.lat(), center.lng(), ['tourist_attraction', 'museum', 'park']);
      response = `Here are some nearby attractions:\n\n`;
      response += places.map(p => `- ${p.name} (${p.vicinity})`).join('\n');
    } else if (question.toLowerCase().includes('restaurant') || question.toLowerCase().includes('eat')) {
      // Search for restaurants
      const places = await searchNearbyPlaces(center.lat(), center.lng(), ['restaurant', 'cafe']);
      response = `Here are some nearby places to eat:\n\n`;
      response += places.map(p => `- ${p.name} (${p.vicinity})`).join('\n');
    } else {
      // Generic response
      response = `For ${question}, you might want to check the map above for more details. `;
      response += `I can provide more specific information if you ask about nearby attractions, restaurants, or transportation options.`;
    }
    
    return response;
    
  } catch (error) {
    console.error("Error handling location follow-up:", error);
    return question; // Fall back to regular response
  }
}

// Enhanced search nearby places function
function searchNearbyPlaces(lat, lng, types) {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
      location: new google.maps.LatLng(lat, lng),
      radius: '500',
      type: types
    };
    
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        resolve(results.slice(0, 5)); // Return top 5 results
      } else {
        reject(new Error("Places not found"));
      }
    });
  });
}

// Add this near your other global variables
let mapsApiLoaded = false;

// Modify the window load event to check for Google Maps
window.addEventListener("load", async () => {
  await loadChatSessions();
  
  // Check if Google Maps loaded (the callback would set mapsApiLoaded to true)
  setTimeout(() => {
    if (!mapsApiLoaded) {
      console.warn("Google Maps API failed to load");
      // You might want to show a message to the user
    }
  }, 5000); // Wait 5 seconds to see if the API loads
});

// Update the initMap function to set the loaded flag
function initMap() {
  mapsApiLoaded = true;
  console.log("Google Maps API loaded and ready");
}





// Function to handle weather queries
async function handleWeatherQuery(locationQuery) {
  try {
    // Show thinking indicator
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
    
    // Fetch weather data
    const weatherData = await fetchWeatherData(locationQuery);
    
    // Remove thinking indicator
    thinkingDiv.remove();
    
    // Generate weather response HTML
    const weatherResponse = generateWeatherResponse(weatherData);
    
    // Create weather message element
    const weatherMessageDiv = createMessageElement(weatherResponse, "bot-message");
    chatBody.appendChild(weatherMessageDiv);
    
    // Add to current session
    currentSession.push({
      role: "user",
      parts: [{ text: `weather: ${locationQuery}` }]
    });
    
    currentSession.push({
      role: "model",
      parts: [{ text: weatherResponse }]
    });
    
    // Update the chat session
    if (currentSessionIndex !== -1) {
      chatSessions[currentSessionIndex].messages = [...currentSession];
      await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
    }
    
  } catch (error) {
    console.error("Error handling weather query:", error);
    
    const errorMessageDiv = createMessageElement(
      `<div class="message-text">Sorry, I couldn't fetch weather information for that location. Please try another search.</div>`,
      "bot-message"
    );
    chatBody.appendChild(errorMessageDiv);
  }
}

// Function to fetch weather data
async function fetchWeatherData(location) {
  try {
    const response = await fetch(`${WEATHER_API_URL}&q=${encodeURIComponent(location)}`);
    if (!response.ok) throw new Error("Weather data not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}

// Function to generate weather response HTML
function generateWeatherResponse(weatherData) {
  const date = new Date(weatherData.dt * 1000);
  const sunrise = new Date(weatherData.sys.sunrise * 1000);
  const sunset = new Date(weatherData.sys.sunset * 1000);
  
  return `
    <div class="weather-container">
      <h3>Weather in ${weatherData.name}, ${weatherData.sys.country}</h3>
      <div class="weather-main">
        <div class="weather-icon">
          <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="${weatherData.weather[0].description}">
          <span>${weatherData.weather[0].main}</span>
        </div>
        <div class="weather-temp">
          <span class="current-temp">${Math.round(weatherData.main.temp)}°C</span>
          <span class="feels-like">Feels like ${Math.round(weatherData.main.feels_like)}°C</span>
        </div>
        <div class="weather-details">
          <div><span class="material-symbols-rounded">device_thermostat</span> Min: ${Math.round(weatherData.main.temp_min)}°C</div>
          <div><span class="material-symbols-rounded">device_thermostat</span> Max: ${Math.round(weatherData.main.temp_max)}°C</div>
          <div><span class="material-symbols-rounded">humidity_percentage</span> Humidity: ${weatherData.main.humidity}%</div>
          <div><span class="material-symbols-rounded">air</span> Wind: ${Math.round(weatherData.wind.speed * 3.6)} km/h</div>
          <div><span class="material-symbols-rounded">compress</span> Pressure: ${weatherData.main.pressure} hPa</div>
          <div><span class="material-symbols-rounded">wb_sunny</span> Sunrise: ${sunrise.toLocaleTimeString()}</div>
          <div><span class="material-symbols-rounded">wb_twilight</span> Sunset: ${sunset.toLocaleTimeString()}</div>
        </div>
      </div>
      <div class="weather-footer">
        <small>Last updated: ${date.toLocaleString()}</small>
      </div>
    </div>
  `;
}





// TTS Voices Data (loaded from tts-voices.json)
let ttsVoices = {};

// Selected Voice (default to a US English voice)
let selectedVoice = "hi-IN-Standard-E";

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
  callVoice = voiceCode; // Also update the call voice
  console.log("Selected Voice:", selectedVoice, "Call Voice:", callVoice);
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

// Function to generate TTS
async function generateTTS(text, messageElement) {
  // If we already have generated audio, return it
  if (messageElement.audioBlob) {
    return;
  }

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

// Function to play TTS Audio
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

// Function to handle TTS downloading
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

// Function to download TTS Audio
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





// Toggle image generation panel
imageGenButton.addEventListener("click", () => {
  imageGenPanel.style.display = "block";
  setTimeout(() => {
    imageGenPanel.classList.add("active");
  }, 10);
});

closeImageGen.addEventListener("click", () => {
  imageGenPanel.classList.remove("active");
  setTimeout(() => {
    imageGenPanel.style.display = "none";
  }, 300);
});

// Calculate width/height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};

// Generate images from prompt
const generateImages = async (promptText) => {
  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  
  if (!selectedModel || !promptText.trim()) {
    alert("Please select a model and enter a prompt");
    return;
  }

  const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
  const { width, height } = getImageDimensions(aspectRatio);

  // Create loading message in chat
  const loadingMessage = createMessageElement(`
    <div class="message-text">
      <div class="image-loading">
        <div class="image-loading-spinner"></div>
        <p>Generating ${imageCount} image${imageCount > 1 ? 's' : ''}...</p>
      </div>
    </div>
  `, "bot-message");
  
  chatBody.appendChild(loadingMessage);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  try {
    // Create an array of image generation promises
    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
      const response = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${IMAGE_API_KEY}`,
          "Content-Type": "application/json",
          "x-use-cache": "false",
        },
        body: JSON.stringify({
          inputs: promptText,
          parameters: { width, height },
        }),
      });
      
      if (!response.ok) throw new Error((await response.json())?.error);
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    });

    const imageUrls = await Promise.allSettled(imagePromises);
    
    // Remove loading message
    loadingMessage.remove();
    
    // Create image display in chat
    let imagesHTML = '<div class="chat-image-container">';
    imageUrls.forEach((result, i) => {
      if (result.status === "fulfilled") {
        imagesHTML += `
          <div class="chat-image-card">
            <img class="chat-image" src="${result.value}" alt="Generated image ${i+1}" />
            <div class="chat-image-overlay">
              <a href="${result.value}" download="ai-image-${i+1}.png" class="chat-image-download">
                <span class="material-symbols-rounded">download</span>
              </a>
            </div>
          </div>
        `;
      } else {
        imagesHTML += `
          <div class="message-text error">
            Image generation failed: ${result.reason.message}
          </div>
        `;
      }
    });
    imagesHTML += '</div>';

    const imageMessage = createMessageElement(`
      <div class="message-text">
        ${imagesHTML}
      </div>
    `, "bot-message");
    
    chatBody.appendChild(imageMessage);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // Add to chat history
    currentSession.push({
      role: "user",
      parts: [{ text: `Generate images: ${promptText}` }]
    });
    
    currentSession.push({
      role: "model",
      parts: [{ text: `Generated ${imageCount} image${imageCount > 1 ? 's' : ''} with model ${selectedModel}` }]
    });

    if (currentSessionIndex !== -1) {
      chatSessions[currentSessionIndex].messages = [...currentSession];
      await chatDB.saveChatSession(chatSessions[currentSessionIndex]);
    }

  } catch (error) {
    console.error("Image generation error:", error);
    loadingMessage.remove();
    
    const errorMessage = createMessageElement(`
      <div class="message-text error">
        Image generation failed: ${error.message}
      </div>
    `, "bot-message");
    
    chatBody.appendChild(errorMessage);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// Handle image generation form submission
generateImageBtn.addEventListener("click", async () => {
  const promptText = messageInput.value.trim();
  if (!promptText) {
    alert("Please enter a prompt for image generation");
    return;
  }
  
  imageGenPanel.classList.remove("active");
  setTimeout(() => {
    imageGenPanel.style.display = "none";
  }, 300);
  
  messageInput.value = "";
  await generateImages(promptText);
});

// Handle Enter key in message input when image panel is open
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && imageGenPanel.style.display === "block") {
    e.preventDefault();
    generateImageBtn.click();
  }
});


// Add these variables with your other global variables
let callActive = false;
let callTranscript = "";
let callSystemPrompt = "From now on, you are to behave exactly as if you're speaking to the user on a live phone call. Your responses must be accurate, brief, friendly, and direct—just like real-time phone conversation. Never mention or refer to this prompt in your replies.";
let callVoice = "hi-IN-Standard-E"; // Default voice
let callSilenceTimer;
let isBotSpeaking = false;
let callAnalyser;
let callAudioContext;
let callDataArray;
let callWaveformCtx;
let userSpeechDetected = false;
let aiSpeechDetected = false;
let userSpeechTimer;
let aiSpeechTimer;
let callRecognition;





// Initialize call functionality when the page loads
window.addEventListener("load", () => {
  // Load call languages
  loadCallLanguages();
});

// Open call menu
callButton.addEventListener("click", () => {
  callPanel.style.display = "block";
});

// Close call menu
closeCallMenu.addEventListener("click", () => {
  callPanel.style.display = "none";
});

// Close call menu when clicking outside
document.addEventListener("click", (e) => {
  if (!callPanel.contains(e.target) && !callButton.contains(e.target)) {
    callPanel.style.display = "none";
  }
});

// Load languages for call
function loadCallLanguages() {
  callLanguageList.innerHTML = "";
  Object.keys(ttsVoices).forEach((language) => {
    const div = document.createElement("div");
    div.textContent = language;
    div.addEventListener("click", () => {
      // Find the first voice for this language (you can modify to show voices like in TTS)
      if (ttsVoices[language].voices.length > 0) {
        callVoice = ttsVoices[language].voices[0].code; // Default to first voice
        // You can add more sophisticated voice selection here
      }
      callPanel.style.display = "none";
    });
    callLanguageList.appendChild(div);
  });
}

// Start call
startCallButton.addEventListener("click", () => {
  startVoiceCall();
});

// End call
endCallButton.addEventListener("click", () => {
  endVoiceCall();
});

// Voice call functionality
function startVoiceCall() {
  callActive = true;
  callTranscript = "";
  callPanel.style.display = "none";
  
  // Show call interface
  callInterface.style.display = "flex";
  
  // Initialize with current session messages if available
  if (currentSession.length > 0) {
    callTranscript = formatSessionForCall(currentSession);
    // Format the entire transcript immediately
    callTranscriptElement.innerHTML = formatBotResponse(callTranscript);
  }
  
  // Initialize speech recognition for the call
  initializeCallRecognition();
  
  console.log("Starting call with voice:", callVoice);
}

function formatSessionForCall(session) {
  let isFirstBotMessage = true; // Track if it's the initial greeting
  
  return session.map(msg => {
    // Skip ONLY the first AI greeting (role: "model" with greeting text)
    if (msg.role === "model" && isFirstBotMessage) {
      isFirstBotMessage = false; // Mark as processed
      return ''; // Skip this message
    }

    const speaker = msg.role === "user" ? "User" : "AI";
    const content = msg.parts.map(part => {
      if (part.text) return part.text;
      if (part.file_data) return `[Attached ${part.file_data.mime_type.split('/')[0]}]`;
      return '';
    }).join(' ');
    
    return `${speaker}: ${content}`;
  }).filter(line => line.trim()).join('\n'); // Remove empty lines
}

function endVoiceCall() {
  callActive = false;
  callInterface.style.display = "none";
  
  // Stop recognition
  if (callRecognition) {
    callRecognition.stop();
  }
  
  
  // Update UI to reflect new messages
  loadChat(currentSessionIndex);
}

function saveCallToHistory() {
  if (callTranscript.trim()) {
    // The messages are already saved during the call in processCallInput
    // Just ensure the session is properly updated
    if (currentSessionIndex !== -1) {
      chatDB.saveChatSession(chatSessions[currentSessionIndex]);
    }
  }
}



function initializeCallRecognition() {
  callRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  callRecognition.continuous = true;
  callRecognition.interimResults = true;
  callRecognition.lang = "en-US"; // Force English recognition
  
  callRecognition.onresult = (event) => {
    clearTimeout(callSilenceTimer);

        // Detect user speech
    userSpeechDetected = true;
    updateSpeechVisualization();
    
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Update input field with what's being said
    callInputElement.value = finalTranscript + interimTranscript;
    
    // If we have final text, add to transcript and reset timer
    if (finalTranscript) {
      // callTranscript += "User: " + finalTranscript + "\n";
      callTranscriptElement.textContent = callTranscript;
      
      // Start timer for silence detection
      callSilenceTimer = setTimeout(() => {
        if (callActive) {
          processCallInput(finalTranscript);
        }
      }, 1); // 2 seconds of silence
    }
  };
  
  callRecognition.onerror = (event) => {
    console.error("Call recognition error:", event.error);
  };
  
  callRecognition.onend = () => {
    if (callActive && !isBotSpeaking) {
      callRecognition.start();
    }
  };
  
  callRecognition.start();
}



function processCallInput(text) {
  if (!text.trim()) return;
  
  // Clear input field
  callInputElement.value = "";
  
  // Add raw text to the transcript (we'll format the whole thing later)
  callTranscript += `<span style="color:rgba(255, 107, 157, 0.7); font-weight: bold;">User: </span>` + text + "\n\n";
  
  // Format the ENTIRE transcript (not just new text)
  callTranscriptElement.innerHTML = formatBotResponse(callTranscript);
  
  // Prepare messages array with existing context
  const messages = [
    {
      role: "user",
      parts: [{ text: callSystemPrompt }]
    }
  ];
  
  // Add previous conversation messages
  currentSession.forEach(msg => {
    messages.push({
      role: msg.role,
      parts: msg.parts.map(part => {
        if (part.text) return { text: part.text };
        if (part.file_data) return { text: `[${part.file_data.mime_type} attachment]` };
        return { text: '' };
      })
    });
  });
  
  // Add current user input
  messages.push({
    role: "user",
    parts: [{ text: text }]
  });
  
  // Prepare the API request with full context
  const apiRequestBody = {
    contents: messages
  };
  
  // Show thinking indicator in transcript (formatted)
  callTranscript += `<span style="color: blue; font-weight: bold;">AI Thinking...</span>\n\n`;
  callTranscriptElement.innerHTML = formatBotResponse(callTranscript);
  
  // Call Gemini API
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiRequestBody),
  })
  .then(response => response.json())
  .then(data => {
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Add AI response to transcript
      callTranscript += `<span style="color: rgba(76, 175, 80, 0.9); font-weight: bold;">AI: </span>` + responseText + "\n";
      
      // Format the ENTIRE transcript again
      callTranscriptElement.innerHTML = formatBotResponse(callTranscript);
      callTranscriptElement.scrollTop = callTranscriptElement.scrollHeight;
      
      // Add to current session
      currentSession.push({
        role: "user",
        parts: [{ text: text }]
      });
      
      currentSession.push({
        role: "model",
        parts: [{ text: responseText }]
      });
      
      // Save session
      if (currentSessionIndex !== -1) {
        chatSessions[currentSessionIndex].messages = [...currentSession];
        chatDB.saveChatSession(chatSessions[currentSessionIndex]);
      }
      
      // Convert to speech
      speakCallResponse(responseText);
    }
  })
  .catch(error => {
    console.error("Call API error:", error);
    callTranscript += "AI: Sorry, I encountered an error.\n";
    callTranscriptElement.innerHTML = formatBotResponse(callTranscript);
  });
}

function formatTranscriptLine(speaker, text) {
  return `<div class="transcript-line ${speaker.toLowerCase()}">
    <span class="speaker">${speaker}:</span>
    <span class="message">${formatBotResponse(text)}</span>
  </div>`;
}

// Modify the speakCallResponse function
function speakCallResponse(text) {
  isBotSpeaking = true;
  aiSpeechDetected = true;
  updateSpeechVisualization();

  // Create a timer to keep updating while AI is speaking
  const aiSpeechUpdateInterval = setInterval(() => {
    aiSpeechDetected = true;
    updateSpeechVisualization();
  }, 200);

  if (callRecognition) {
    callRecognition.stop();
  }

  // Convert the response to formatted HTML first
  const formattedResponse = formatBotResponse(text);
  
  // Extract clean, speakable text from the formatted HTML
  const cleanText = stripHtmlAndMarkdown(formattedResponse);

  const requestBody = {
    input: { text: cleanText },  // Use CLEAN TEXT for TTS
    voice: { 
      languageCode: callVoice.split("-").slice(0, 2).join("-"),
      name: callVoice
    },
    audioConfig: { audioEncoding: "MP3" },
  };

  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  })
  .then(response => response.json())
  .then(data => {
    if (data.audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.play();
      
      audio.addEventListener("ended", () => {
        clearInterval(aiSpeechUpdateInterval);
        isBotSpeaking = false;
        aiSpeechDetected = false;
        updateSpeechVisualization();
        
        if (callActive && callRecognition) {
          callRecognition.start();
        }
      });
    }
  });
}

function stripHtmlAndMarkdown(htmlText) {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlText;

  // Remove code blocks (they often don't sound good in TTS)
  const codeBlocks = tempDiv.querySelectorAll('pre, code');
  codeBlocks.forEach(block => block.remove());

  // Convert lists to natural speech
  const lists = tempDiv.querySelectorAll('ul, ol');
  lists.forEach(list => {
    const items = Array.from(list.querySelectorAll('li')).map(li => li.textContent);
    list.replaceWith(document.createTextNode(items.join(', ')));
  });

  // Convert headings to emphasized speech
  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    heading.replaceWith(document.createTextNode(heading.textContent + '. '));
  });

  // Get plain text (automatically strips HTML tags)
  let plainText = tempDiv.textContent;

  // Clean up extra spaces and newlines
  plainText = plainText
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .replace(/\n+/g, ' ')      // Replace newlines with space
    .trim();

  return plainText;
}



// Add this function to update the visualization
function updateSpeechVisualization() {
  const userCircle = document.querySelector('.user-circle');
  const aiCircle = document.querySelector('.ai-circle');
  
  if (userSpeechDetected) {
    userCircle.classList.add('active');
    clearTimeout(userSpeechTimer);
    userSpeechTimer = setTimeout(() => {
      userSpeechDetected = false;
      userCircle.classList.remove('active');
    }, 300); // Keep active for 300ms after last detection
  }
  
  if (aiSpeechDetected) {
    aiCircle.classList.add('active');
    clearTimeout(aiSpeechTimer);
    aiSpeechTimer = setTimeout(() => {
      aiSpeechDetected = false;
      aiCircle.classList.remove('active');
    }, 300); // Keep active for 300ms after last detection
  }
}


// Add this selector with your other selectors
const callTtsButton = document.getElementById("call-tts-button");

// Add this event listener with your other event listeners
callTtsButton.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent closing the call panel
  ttsMenu.style.display = "block";
  ttsVoiceMenu.style.display = "none";
  loadTtsLanguages();
});



