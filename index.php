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
        background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
    }

    /* root-main-container */
    .root-main-container {
        display: flex;

        overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
        /*width: 500px;*/
        display: none;
        background-color: #0f172a;
        color: #f8fafc;
        padding: 20px;
        transition: transform 0.3s ease;
    }

    /* Hidden sidebar */
    .sidebar.hidden {
        transform: translateX(-100%);
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
        height: 92vh;
        flex-direction: column;
        width: 100%;
        height: ;
    }

    .chat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        border-bottom: 1px solid #1e293b;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
        background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
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
        background: linear-gradient(90deg, rgb(75 255 126 / 20%) 0%, rgb(11 255 79 / 36%) 100%);
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
        border: 1px solid rgb(7 255 29 / 32%);
        width: fit-content;
        position: relative;

    }

    .ai-message-bubble p {
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble ol {
        list-style-type: decimal;
        padding-left: 1.2rem;
        margin: 0 0 1rem 0;
        font-size: 14px;
    }

    .ai-message-bubble ul {
        list-style-type: disc;
        padding-left: 1.2rem;
        margin: 0 0 1rem 0;
        font-size: 14px;
    }

    .ai-message-bubble li {
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble strong {
        color: #16ff97;
        font-weight: 400;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        font-size: 14px;
    }

    .ai-message-bubble h1 {
        color: #ffdc14ff;
        font-weight: 600;
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble h2 {
        color: #ffdc14ff;
        font-weight: 400;
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble h3 {
        color: #ffdc14ff;
        font-weight: 400;
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble h4 {
        color: #ffdc14ff;
        font-weight: 400;
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble h5 {
        color: #ffdc14ff;
        font-weight: 400;
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble h6 {
        color: #ffdc14ff;
        font-weight: 400;
        margin-bottom: 1rem;
        font-size: 14px;
    }

    .ai-message-bubble em {
        color: #fff309;
        margin-bottom: 0.5rem;
        font-size: 14px;
    }

    .ai-message-bubble code {
        font-size: 14px;
        padding: 2px 4px;
        border-radius: 3px;
    }

    .ai-message-bubble pre {
        font-size: 14px;
        padding: 1rem;
        border-radius: 5px;
        overflow-x: auto;
    }

    .ai-message-bubble blockquote {
        font-size: 14px;
        border-left: 4px solid #22C55E;
        padding-left: 1rem;
        margin: 1rem 0;
        font-style: italic;
    }

    .ai-message-bubble table {
        font-size: 14px;
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
    }

    .ai-message-bubble th,
    .ai-message-bubble td {
        font-size: 14px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 12px;
        text-align: left;
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
        position: relative;
        top: 4px;
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
        font-weight: 500;
        background: linear-gradient(135deg, #d7ffd7, #a9ffbd, #71fa4e);
        background-clip: text;
        color: transparent;
        background-size: 200% 100%;
        animation: shimmer 1s linear infinite;
        display: flex;
        align-items: baseline;
        gap: 5px;
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
        /* padding: 1rem 0; */
        text-align: center;
        background: linear-gradient(11deg, #0f172a 0%, #020617 100%);
        padding-bottom: 1.5%;
    }

    .chat-input-form {
        display: flex;
        align-items: center;
        background: #000;
        border-radius: 100px;
        max-width: 90%;
        margin: auto;
        padding: 10px;
        border: 1px solid rgb(255 255 255 / 28%);
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
        height: 20px;
    }


    .message-box {
        width: calc(100% - 50px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 15px;
    }


    .button-box {
        width: 50px;
        display: flex;
        align-items: center;
        justify-content: end;
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
        background: #0EB34B;
        border-radius: 100px;
        width: 45px;
        height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;
        padding: 5px;

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


    .new-chat-button {

        padding: 5px;
        border-radius: 100px;
        background: #0EB34B;
        width: 40px;
        height: 40px;
    }

    .new-chat-button img {
        filter: invert(1);
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
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .welcome-placeholder h2 {
        font-size: 1.25rem !important;
        font-weight: 600;
        margin-bottom: 10px;
    }

    .welcome-placeholder h4 {
        font-size: 1rem !important;
        font-weight: 400;
        margin-bottom: 10px;

    }

    .welcome-placeholder h3 {
        font-size: 1rem !important;
        font-weight: 400;
        margin-bottom: 10px;

    }

    .welcome-placeholder code,
    kbd,
    pre,
    samp {
        font-size: 1rem !important;
        font-weight: 400;
        margin-bottom: 10px;
    }

    .welcome-placeholder p {
        max-width: 400px;
        font-size: 0.95rem;
        color: #94a3b8;
        line-height: 1.5;
    }

    /*Beta styles here*/

    .beta-tag-div {
        position: relative;
        display: flex;
        gap: 5px;
    }

    .Beta {
        background: #0eb34b;
        border-radius: 200px;
        font-weight: bold;
        width: 50px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .toggle-sidebar-button {
        display: none;
    }


    .fa-stop {
        display: none;
    }



    @media (max-width: 600px) {

        /* CSS rules for screens smaller than 600px */
        .chat-input-form {
            padding: 5px 10px;
        }

        .send-message-button-ai {
            width: 40px;
            height: 40px;



        }

        .message-box {

            padding: 15px;
        }

        .Beta {
            padding: 0px;
            font-size: 13px;
            width: 50px;
            border-radius: 20px
        }

        .input-wrapper {
            padding-bottom: 15%;
        }

    }
    </style>
</head>

<body>

    <div class="root-main-container">

        <!-- Sidebar -->
        <div id="sidebar" class="sidebar">
            <h2>Sidebar</h2>
            <p>Some content here</p>
        </div>

        <!-- Main chat area -->
        <div id="chat-main" class="main-container-ai-chat-app-page">
            <div class="chat-head">
                <span class="beta-tag-div">
                    <span class="font-semibold text-lg">Legal AI Assistant</span>
                    <p class="Beta">Beta</p>
                </span>
                <div class="intelligent-indicator text-sm text-gray-400">
                    <!-- toggle button is fully working we ma require in feature -->
                    <button id="toggle-sidebar" class="toggle-sidebar-button">Toggle Sidebar</button>
                    <button id="new-chat" class="new-chat-button">

                        <img src="https://cdn-icons-png.flaticon.com/128/5410/5410417.png" alt="new chat" />
                    </button>


                </div>
            </div>

            <div id="message-container" class="message-container-ai-chat-app-page">




            </div>

            <div class="input-wrapper">
                <form id="chat-form" autocomplete="off" class="chat-input-form">
                    <div class="message-box">
                        <textarea id="message-input" placeholder="Ask any legal question..."></textarea>
                    </div>
                    <div class="button-box">
                        <button id="send-button" class="send-message-button-ai" type="submit">
                            <i class="fas fa-paper-plane text-white"></i>
                            <i class="fas fa-stop text-white"></i>


                        </button>
                    </div>
                </form>
                <span class="warn">Get quick answers — just type and send.</span>
            </div>
        </div>
    </div>
    <script>
    const chatBox = document.getElementById("message-container");
    const sendBtn = document.getElementById("send-button");
    const userInput = document.getElementById("message-input");
    const chatForm = document.getElementById("chat-form");
    const textarea = document.querySelector(".chat-input-form textarea");
    const chatInputForm = document.querySelector(".chat-input-form");
    const toggleBtn = document.getElementById("toggle-sidebar");
    const sidebar = document.getElementById("sidebar");
    const newChatButton = document.getElementById("new-chat");
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    //
    const sendIcon = sendBtn.querySelector(".fa-paper-plane");
    const stopIcon = sendBtn.querySelector(".fa-stop");

    //global controller
    let controller;
    //
    let isStreaming = false;


    newChatButton.addEventListener("click", () => {
        // Cancel any running stream
        if (controller) controller.abort();

        // Clear all chat bubbles
        chatBox.innerHTML = "";

        // Reset input state
        userInput.value = "";
        textarea.style.height = "20px";
        chatInputForm.style.borderRadius = "100px";
        sendBtn.style.position = "unset";
        isStreaming = false;

        // Restore send icon state
        sendIcon.classList.remove("hidden");
        stopIcon.classList.add("hidden");
        sendBtn.style.background = "#29a155";

        // Show welcome placeholder again
        showWelcomePlaceholder();
    });



    //// user cancels
    function cancelStream() {
        if (controller) controller.abort();
    }

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("hidden");

        // Optional: expand main chat to full width
        const chatMain = document.getElementById("chat-main");
        if (sidebar.classList.contains("hidden")) {
            chatMain.style.width = "100%";
        } else {
            chatMain.style.width = "60%";
        }
    });


    //show a box when no message
    function showWelcomePlaceholder() {
        const existing = document.querySelector(".welcome-placeholder");
        if (existing) return; // already visible

        const welcome = document.createElement("div");
        welcome.className = "welcome-placeholder";
        welcome.innerHTML = `
        <div class="welcome-dot">
          <i class="fa-solid fa-gavel text-5xl text-white"></i>
        </div>
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

    const handleResize = () => {
        textarea.style.height = "auto"; // reset height before measuring
        const newHeight = textarea.scrollHeight;
        const isMultiline = newHeight > 35; // detect multiline after 2nd line

        // Adjust height dynamically
        textarea.style.height = isMultiline ? `${newHeight}px` : "30px";

        // Style changes for multiline / single-line
        chatInputForm.style.borderRadius = isMultiline ? "10px" : "100px";
        sendBtn.style.position = isMultiline ? "absolute" : "unset";
        sendBtn.style.bottom = "10px";
        sendBtn.style.right = "10px";
        textarea.style.borderRadius = "8px";

        // Reset to default if empty
        if (!textarea.value.trim()) {
            textarea.style.height = "20px";
            chatInputForm.style.borderRadius = "100px";
            sendBtn.style.position = "unset";
        }
    };

    // Attach for input, paste, and cut (use timeout for paste/cut)
    ["input", "paste", "cut"].forEach(event =>
        textarea.addEventListener(event, () => setTimeout(handleResize, 0))
    );


    sendBtn.addEventListener("click", () => {
        if (isStreaming && controller) {
            controller.abort();
            toggleSendButton(false);
            appendMessage("Stream stopped by user.", "ai-message-bubble");
        }
    });

    function toggleSendButton(loading = false) {
        sendBtn.style.background = loading ? "#dc2626" : "#29a155";
        sendBtn.disabled = false;

        if (loading) {
            isStreaming = true;
            sendIcon.classList.add("hidden");
            stopIcon.classList.remove("hidden");
            stopIcon.style.display = "flex";
            sendIcon.style.display = "none";
        } else {
            isStreaming = false;
            sendIcon.classList.remove("hidden");
            stopIcon.classList.add("hidden");
            stopIcon.style.display = "none";
            sendIcon.style.display = "flex";
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
       
        <div class="shimmer-text">Thinking  <div class="dots">
            <span></span><span></span><span></span>
        </div></div>
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

            e.preventDefault();
            // your send logic here
            if (isMobile) userInput.blur(); // hide keyboard only on mobile

            processRequest();
        }
    });

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        processRequest();
        // your send logic here
        if (isMobile) userInput.blur(); // hide keyboard only on mobile




    });
    chatForm.addEventListener("click", () => {

        userInput.focus()
    });




    async function processRequest() {
        const query = userInput.value.trim();
        if (!query) return;
        hideWelcomePlaceholder();
        appendMessage(query, "user-message-bubble");
        userInput.value = "";
        textarea.style.height = "20px"; // reset height
        chatInputForm.style.borderRadius = "100px";

        toggleSendButton(true);
        const typing = showTypingIndicator();

        controller = new AbortController(); // create abort controller


        try {
            const API_URL = "https://api-ai.pakistanlawhelp.com"

            const response = await fetch(`${API_URL}/api/search/case`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query
                }),
                signal: controller.signal, // pass signal
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
            if (err.name !== "AbortError") {
                appendMessage("Network error or stream closed.", "ai-message-bubble");
            } else {
                console.log("Stream aborted by user — no error message shown.");
            }
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