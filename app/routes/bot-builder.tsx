
import { useState, useEffect, useRef } from "react";
import type { MetaFunction } from "@remix-run/cloudflare";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
    return [
        { title: "AI Bot Builder - Phoenix Flow" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ];
};

export default function BotBuilder() {
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hello! I'm the Phoenix Flow Assistant. I can help you analyze and optimize your Shopify store. What can I help you with today?",
        },
        {
            sender: "user",
            text: "I'm having trouble with my product pages. Visitors aren't converting well.",
        },
        {
            sender: "bot",
            text: "I understand. Let's start by gathering some information about your product pages. Can you tell me about your current conversion rate?",
        },
    ]);
    const [inputText, setInputText] = useState("");
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (inputText.trim() === "") return;

        // Add user message
        const newMessages = [...messages, { sender: "user", text: inputText }];
        setMessages(newMessages);
        setInputText("");

        // Simulate bot response
        setTimeout(() => {
            const responses = [
                "I understand. Let me help you with that.",
                "That's an interesting point. Have you considered these alternative approaches?",
                "Based on my knowledge, here's what I recommend...",
                "I can guide you through this process step by step.",
                "Let's break this down into smaller tasks to make it more manageable.",
            ];
            const randomResponse =
                responses[Math.floor(Math.random() * responses.length)];
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: randomResponse },
            ]);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    };

    const currentStyles = `
    * {
        box-sizing: border-box;
    }
    
    .bot-builder-body {
        background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
        color: #333;
        line-height: 1.6;
        min-height: 100vh;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
    
    header {
        text-align: center;
        margin-bottom: 30px;
        color: white;
        padding: 20px;
    }
    
    header h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    header p {
        font-size: 1.2rem;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .main-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
    }
    
    @media (max-width: 768px) {
        .main-content {
            grid-template-columns: 1fr;
        }
    }
    
    .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        padding: 25px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
    }
    
    .card h2 {
        color: #2c3e50;
        margin-bottom: 20px;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 10px;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #2c3e50;
    }
    
    .form-control {
        width: 100%;
        padding: 12px 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.3s, box-shadow 0.3s;
    }
    
    .form-control:focus {
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        outline: none;
    }
    
    .btn {
        display: inline-block;
        padding: 12px 25px;
        background: linear-gradient(45deg, #3498db, #2980b9);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
    }
    
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
    }
    
    .btn-secondary {
        background: linear-gradient(45deg, #2ecc71, #27ae60);
    }
    
    .btn-secondary:hover {
        box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
    }
    
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 500px; /* Fixed height for scroll */
    }
    
    .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .chat-messages {
        flex-grow: 1;
        overflow-y: auto;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 15px;
        background-color: #f9f9f9;
        margin-bottom: 15px;
    }
    
    .message {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
    }
    
    .message-content {
        padding: 12px 15px;
        border-radius: 8px;
        max-width: 80%;
    }
    
    .bot-message {
        align-items: flex-start;
    }
    
    .bot-message .message-content {
        background-color: #e7f5ff;
        border-bottom-left-radius: 0;
    }
    
    .user-message {
        align-items: flex-end;
        margin-left: auto;
    }
    
    .user-message .message-content {
        background-color: #d1e7ff;
        border-bottom-right-radius: 0;
    }
    
    .chat-input {
        display: flex;
        gap: 10px;
    }
    
    .chat-input input {
        flex-grow: 1;
        padding: 12px 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
    }
    
    .chat-input input:focus {
        border-color: #3498db;
        outline: none;
    }
    
    .steps {
        list-style: none;
        padding: 0;
    }
    
    .steps li {
        margin-bottom: 10px;
        padding: 10px 15px;
        border-radius: 8px;
        background-color: #f0f0f0;
        transition: all 0.3s ease;
    }
    
    .steps li.active {
        background-color: #3498db;
        color: white;
    }
    
    .preview {
        margin-top: 20px;
        padding: 15px;
        border: 1px dashed #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
    }
    
    .preview h3 {
        margin-bottom: 10px;
        color: #2c3e50;
    }
    
    .code-block {
        background-color: #f8f8f8;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        white-space: pre-wrap;
        margin-top: 10px;
        border-left: 4px solid #3498db;
        font-size: 0.9em;
        overflow-x: auto;
    }
    
    .bot-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        gap: 10px;
    }
    
    .instructions {
        margin-top: 20px;
    }
    
    .instructions h3 {
        margin-bottom: 10px;
        color: #2c3e50;
    }
    
    .instructions ol {
        padding-left: 20px;
    }
    
    .instructions li {
        margin-bottom: 8px;
    }
    
    .status {
        padding: 5px 10px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.9em;
    }
    
    .status.active {
        background-color: #e7f5ff;
        color: #3498db;
    }
  `;

    return (
        <div className="bot-builder-body">
            <style>{currentStyles}</style>
            <div className="container">
                <header>
                    <h1>AI Bot Builder</h1>
                    <p>Create an intelligent assistant that guides users through the Phoenix Flow process</p>
                </header>

                <div className="main-content">
                    <div className="card">
                        <h2>Bot Configuration</h2>
                        <div className="form-group">
                            <label htmlFor="botName">Bot Name</label>
                            <input type="text" id="botName" className="form-control" defaultValue="Phoenix Flow Assistant" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="botDescription">Bot Description</label>
                            <input
                                type="text"
                                id="botDescription"
                                className="form-control"
                                defaultValue="Helps users analyze and optimize their Shopify store"
                            />
                        </div>

                        <div className="form-group">
                            <label>Conversation Flow</label>
                            <ul className="steps">
                                <li className="active">Introduction</li>
                                <li>User Information Gathering</li>
                                <li>Problem Identification</li>
                                <li>Solution Recommendation</li>
                                <li>Implementation Guidance</li>
                            </ul>
                        </div>

                        <div className="bot-actions">
                            <button
                                className="btn"
                                onClick={() => alert("Bot configuration saved successfully!")}
                            >
                                Save Bot Configuration
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() =>
                                    alert(
                                        "Code export functionality would be implemented here. The code would include all bot logic and conversation flow."
                                    )
                                }
                            >
                                Export Code
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h2>Bot Conversation</h2>
                        <div className="chat-container">
                            <div className="chat-header">
                                <div className="chat-status">
                                    <div className="status active">Bot is active</div>
                                </div>
                            </div>
                            <div className="chat-messages" ref={chatMessagesRef}>
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`message ${msg.sender === "user" ? "user-message" : "bot-message"
                                            }`}
                                    >
                                        <div className="message-content">{msg.text}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input">
                                <input
                                    type="text"
                                    placeholder="Type your message here..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                />
                                <button className="btn" onClick={handleSendMessage}>
                                    Send
                                </button>
                            </div>
                        </div>

                        <div className="instructions">
                            <h3>Bot Instructions</h3>
                            <ol>
                                <li>Greet the user and introduce yourself as the Phoenix Flow Assistant</li>
                                <li>Ask for basic information about their Shopify store</li>
                                <li>Identify specific problems or areas for improvement</li>
                                <li>Provide actionable recommendations based on best practices</li>
                                <li>Guide the user through implementation steps</li>
                            </ol>
                        </div>
                    </div>

                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <h2>Bot Preview</h2>
                        <div className="preview">
                            <h3>Sample Interaction</h3>
                            <p>This is a preview of how the bot might interact with a user:</p>
                            <div className="code-block">
                                {`// Bot response logic
function handleUserMessage(message) {
    if (message.includes("conversion")) {
        return "Let's improve your conversion rate by optimizing product pages, reducing friction in the checkout process, and adding clear calls to action.";
    }
    if (message.includes("product") && message.includes("page")) {
        return "For better product pages, consider adding high-quality images, detailed product descriptions, customer reviews, and a compelling call to action.";
    }
    return "I'm here to help you optimize your Shopify store. Can you tell me more about your current challenges?";
}

// Sample conversation
const conversation = [
    { user: "I'm having trouble with my product pages.", bot: "Can you tell me more about the issues you're experiencing?" },
    { user: "Visitors aren't converting well.", bot: "Let's focus on improving the user experience on your product pages. Have you considered optimizing product images or simplifying the checkout process?" }
];`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
