<?php
ob_start();
// Dashboard (SECURE VERSION) - JWT Protected

require_once __DIR__ . '/../jwt/jwt-session.php';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Assistant | LegalConnect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify@2.4.0/dist/purify.min.js"></script>


    <script>
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    'ai-primary': '#22C55E',
                    'ai-secondary': '#16A34A',
                    'ai-accent': '#4ade80',
                    'ai-dark': '#0f172a',
                    'ai-darker': '#020617',
                }
            }
        }
    }
    </script>


    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    body {
        font-family: 'Inter', sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
        color: #f8fafc;
        min-height: 100vh;
    }


    /* For Webkit browsers (Chrome, Safari, Edge) */
    .message-container-ai-chat-app-page::-webkit-scrollbar {
        width: 0px;
        /* hides the scrollbar */
        background: transparent;
        /* optional */
    }

    /* For Firefox */
    .message-container-ai-chat-app-page {
        scrollbar-width: none;
        /* hides scrollbar */
        -ms-overflow-style: none;
        /* for IE/Edge */
    }

    /* Optional: to ensure content is still scrollable */
    .message-container-ai-chat-app-page {
        overflow-y: auto;
        /* keep vertical scrolling */
        overflow-x: hidden;
    }


    /* For Firefox */
    .message-container-ai-chat-app-page {
        scrollbar-width: thin;
        scrollbar-color: #22C55E rgba(15, 23, 42, 0.3);
    }


    .main-container-ai-chat-app-page {
        display: flex;
        height: 100vh;
        flex-direction: column;
    }

    .chat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        border-bottom: 1px solid #1e293b;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
    }

    .message-container-ai-chat-app-page {
        flex: 1;
        overflow-y: scroll;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        scroll-behavior: smooth;
        padding: 15px;
    }

    .user-message-bubble {
        background: linear-gradient(90deg, rgba(99, 241, 139, 0.2) 0%, rgba(99, 241, 175, 0.4) 100%);
        color: #e2e8f0;
        border-top-left-radius: 15px;
        border-bottom-right-radius: 15px;
        border-top-right-radius: 15px;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid rgba(99, 241, 130, 0.3);
        align-self: flex-end;
        width: fit-content;

    }

    .ai-message-bubble {
        background: linear-gradient(90deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%);
        color: #f1f5f9;
        border-bottom-left-radius: 15px;
        border-bottom-right-radius: 15px;
        border-top-right-radius: 15px;
        padding: 1rem 1rem 3rem;
        margin-bottom: 1rem;
        border: 1px solid rgba(72, 236, 86, 0.3);
        width: fit-content;
        position: relative;

    }

    .ai-message-bubble p {
        margin-bottom: 1rem;
    }


    .ai-message-bubble ol {
        list-style-type: decimal;
        padding-left: 1.2rem;
        margin: 0 0 1rem 0;
    }



    .ai-message-bubble li {
        margin-bottom: 1rem;
    }





    .ai-message-bubble strong {
        color: #16ff97;
        font-weight: 600;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }

    .ai-message-bubble em {
        color: #fff309;

        margin-bottom: 0.5rem;
    }


    .ai-message-bubble a {
        color: #22C55E;
        /* matches your ai-primary color */
        text-decoration: none;
        /* remove underline */
        font-weight: 500;
        transition: color 0.2s, text-decoration 0.2s;
    }

    .ai-message-bubble a:hover {
        color: #16A34A;
        /* slightly darker on hover */
        text-decoration: underline;
        /* show underline on hover for clarity */
    }

    .ai-message-bubble a:active {
        color: #4ade80;
        /* bright accent when clicked */
    }

    /*indicator style starts here*/
    .typing-indicator-container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: 10px 0;
    }

    .typing-indicator-container .dots {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .typing-indicator-container .dots span {
        width: 8px;
        height: 8px;
        background-color: #4ade80;
        border-radius: 50%;
        animation: blink 1s infinite both;
    }

    .typing-indicator-container .dots span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-indicator-container .dots span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes blink {

        0%,
        80%,
        100% {
            opacity: 0;
        }

        40% {
            opacity: 1;
        }
    }

    .shimmer-text {
        font-family: "Montserrat", sans-serif;
        font-weight: 600;
        text-transform: uppercase;
        background: linear-gradient(135deg, #ffffff, #554f4fff, #ffffff);
        background-clip: text;
        color: transparent;
        background-size: 200% 100%;
        animation: shimmer 1s linear infinite;
    }

    @keyframes shimmer {
        0% {
            background-position: 200% 0;
        }

        100% {
            background-position: -200% 0;
        }
    }


    .input-wrapper {
        position: relative;
        /* padding: 1rem 0; */
        text-align: center;
    }

    .chat-input-form {
        display: flex;
        align-items: center;
        background: #000;
        border-radius: 100px;
        max-width: 90%;
        margin: auto;
        padding: 8px 16px;
        position: relative;
    }



    .chat-input-form textarea {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        resize: none;
        color: #fff;
        font-size: 15px;
        font-family: inherit;
        line-height: 1.5;
        overflow-y: hidden;
        scrollbar-width: none;
        /* Firefox */
    }

    .chat-input-form textarea::-webkit-scrollbar {
        display: none;
        /* Chrome, Edge, Safari */
    }

    .chat-input-form textarea::placeholder {
        color: rgba(255, 255, 255, 0.4);

        display: flex;
        /* align-items: center; */
        justify-content: center;
    }




    .send-message-button-ai {
        background: #29a155;
        border-radius: 100px;
        width: 45px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;
        padding: 5px;
        position: absolute;
        bottom: 10px;
        right: 10px;
    }

    .send-message-button-ai:hover {
        background: #22c55e;
    }

    .warn {
        font-size: 10px;
        color: #ccc;
        text-align: center;
        margin-top: 6px;
    }


    /*message copy button*/
    .copy-btn {
        position: absolute;
        bottom: 8px;
        right: 10px;
        background: transparent;
        border: none;
        cursor: pointer;

    }

    .ai-message-bubble:hover .copy-btn {
        opacity: 1;
    }


    /*welcome-placeholder styles*/
    .welcome-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        height: 100%;
        color: #e5e7eb;
        padding: 2rem;
    }

    .welcome-dot {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 40px #22c55e;
        margin-bottom: 20px;
    }

    .welcome-placeholder h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 10px;
    }

    .welcome-placeholder p {
        max-width: 400px;
        font-size: 0.95rem;
        color: #94a3b8;
        line-height: 1.5;
    }
    </style>
</head>

<body>
    <div class="main-container-ai-chat-app-page">
        <div class="chat-head">
            <span class="font-semibold text-lg">Intelligent AI Legal Assistant</span>
            <div class="intelligent-indicator text-sm text-gray-400">
                <i class="fas fa-brain mr-1 text-green-500"></i>AI Powered
            </div>
        </div>

        <div id="message-container" class="message-container-ai-chat-app-page">




        </div>

        <div class="input-wrapper">
            <form id="chat-form" autocomplete="off" class="chat-input-form">
                <!-- <input type="text" id="message-input" placeholder="Ask any legal question..." autocomplete="off" /> -->
                <textarea id="message-input" placeholder="Ask any legal question..."></textarea>

                <button id="send-button" class="send-message-button-ai" type="submit">
                    <i class="fas fa-paper-plane text-white"></i>
                    <img id="send-loader" src="https://i.gifer.com/ZZ5H.gif" class="hidden w-10 h-10" alt="loading" />
                </button>
            </form>
            <span class="warn">Assistant can make mistakes. Check important info.</span>
        </div>
    </div>

    <script>
    const chatBox = document.getElementById("message-container");
    const sendBtn = document.getElementById("send-button");
    const userInput = document.getElementById("message-input");
    const chatForm = document.getElementById("chat-form");
    const textarea = document.querySelector(".chat-input-form textarea");
    const chatInputForm = document.querySelector(".chat-input-form");



    //show a box when no message
    function showWelcomePlaceholder() {
        const existing = document.querySelector(".welcome-placeholder");
        if (existing) return; // already visible

        const welcome = document.createElement("div");
        welcome.className = "welcome-placeholder";
        welcome.innerHTML = `
        <div class="welcome-dot"></div>
        <h2>Welcome to AI Legal Assistant</h2>
        <p>
            Ask any legal question about Pakistani Law. I'm here to provide comprehensive guidance
            based on case laws, statutes, and legal principles.
        </p>
    `;
        chatBox.appendChild(welcome);
    }

    //hideWelcomePlaceholder
    function hideWelcomePlaceholder() {
        const welcome = document.querySelector(".welcome-placeholder");
        if (welcome) welcome.remove();
    }


    // on load
    showWelcomePlaceholder();

    textarea.addEventListener("input", () => {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";

        const isMultiline = textarea.scrollHeight > 60; // adjust 60 to your base single-line height
        chatInputForm.style.borderRadius = isMultiline ? "20px" : "100px";
    });


    //fun to show the loader and hide the bg of button and disable the button
    function toggleSendButton(loading = false) {
        sendBtn.disabled = loading;
        sendBtn.style.background = "#29a155";
        sendBtn.style.border = "none";

        const icon = sendBtn.querySelector("i");
        const loader = document.getElementById("send-loader");

        if (loading) {
            icon.classList.add("hidden");
            loader.classList.remove("hidden");

            sendBtn.style.background = "transparent";
        } else {
            icon.classList.remove("hidden");
            loader.classList.add("hidden");

        }
    }



    function appendMessage(text, sender) {
        const msg = document.createElement("div");
        msg.className = sender;
        msg.innerHTML = text;
        chatBox.appendChild(msg);

        // add copy button only for AI messages
        if (sender === "ai-message-bubble") {
            const copyBtn = document.createElement("button");
            copyBtn.className =
                "copy-btn text-xl text-gray-400 hover:text-green-400 transition ml-2";
            copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(msg.innerText);
                copyBtn.innerHTML = `
              
                <i class="fa-solid fa-check text-green-500"></i>
             
                `;
                setTimeout(() => {
                    copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
                }, 1200);
            };
            msg.appendChild(copyBtn);
        }

        chatBox.scrollTop = chatBox.scrollHeight;
        return msg;
    }

    function showTypingIndicator() {
        const indicator = document.createElement("div");
        indicator.className = "ai typing-indicator-container";
        indicator.innerHTML = `
        <div class="dots">
            <span></span><span></span><span></span>
        </div>
        <div class="shimmer-text">Processing your query…</div>
    `;
        chatBox.appendChild(indicator);
        chatBox.scrollTop = chatBox.scrollHeight;
        return indicator;
    }


    function removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.remove();
        }
    }


    // Call this after your AI content is fully rendered
    function makeLinksOpenInNewTab(container) {
        // console.log("container", container)
        if (!container) return;
        container.querySelectorAll("a").forEach(link => {
            // Only allow http/https links to prevent unsafe URLs
            if (/^https?:\/\//.test(link.href)) {
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");


            }
        });
    }
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            console.log("OK its here")
            e.preventDefault();
            processRequest();
        }
    });

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        processRequest();
    });

    async function processRequest() {
        const query = userInput.value.trim();
        if (!query) return;
        hideWelcomePlaceholder();
        appendMessage(query, "user-message-bubble");
        userInput.value = "";

        toggleSendButton(true);
        const typing = showTypingIndicator();

        try {
            const response = await fetch("https://ai-test.galaxydev.pk/api/search/case", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query
                }),
            });

            removeTypingIndicator(typing);

            if (!response.ok) {
                const errorData = await response.json();
                appendMessage(errorData.message || "Request rejected by server.", "ai-message-bubble");
                toggleSendButton(false);
                return;
            }

            const aiMsg = appendMessage("", "ai-message-bubble");
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";
            let paragraph = "";
            let currentPlainNode = document.createElement("div");
            aiMsg.appendChild(currentPlainNode);

            while (true) {
                const {
                    done,
                    value
                } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, {
                    stream: true
                });

                const parts = buffer.split("\n\n");
                buffer = parts.pop();

                for (const part of parts) {
                    if (!part.startsWith("data:")) continue;
                    const payload = part.replace(/^data:\s*/, "").trim();
                    if (payload === "[DONE]") continue;

                    let json;
                    try {
                        json = JSON.parse(payload);
                    } catch {
                        continue;
                    }

                    const content = json.content;
                    if (!content) continue;

                    paragraph += content;
                    const safeHTML = DOMPurify.sanitize(marked.parse(paragraph));
                    currentPlainNode.innerHTML = safeHTML;
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            }

            if (paragraph.trim()) {
                const safeHTML = DOMPurify.sanitize(marked.parse(paragraph.trim()));
                currentPlainNode.innerHTML = safeHTML;
            }

            makeLinksOpenInNewTab(currentPlainNode);
        } catch (err) {
            console.error("Fetch error:", err);
            removeTypingIndicator(typing);
            appendMessage("Network error or stream closed.", "ai-message-bubble");
        } finally {
            toggleSendButton(false);
        }
    }
    </script>
</body>

</html>

<?php
$page_content = ob_get_clean();
require_once __DIR__ . '/includes/single-page-ai.php';
?>