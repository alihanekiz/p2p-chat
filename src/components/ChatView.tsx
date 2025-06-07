"use client";

import { useState, useEffect, useRef } from "react";
import { ChatThread, Message } from "../lib/types";
import { QRCodeCanvas } from "qrcode.react";

interface ChatViewProps {
  chat: ChatThread;
  ownPeerId: string;
  onSendMessage: (peerId: string, message: string) => void;
  connectionStatus: string;
  onTypingEvent: (peerId: string, type: "typing-start" | "typing-stop") => void;
  isTyping: boolean;
}

const ChatView = ({ chat, ownPeerId, onSendMessage, connectionStatus, onTypingEvent, isTyping }: ChatViewProps) => {
  const [message, setMessage] = useState("");
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const handleTyping = (text: string) => {
    setMessage(text);

    if (typingTimer.current) {
        clearTimeout(typingTimer.current);
    } else {
        onTypingEvent(chat.peerId, "typing-start");
    }

    typingTimer.current = setTimeout(() => {
        onTypingEvent(chat.peerId, "typing-stop");
        typingTimer.current = null;
    }, 2000); // 2 seconds of inactivity
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      if (typingTimer.current) {
          clearTimeout(typingTimer.current);
          typingTimer.current = null;
      }
      onTypingEvent(chat.peerId, "typing-stop");
      onSendMessage(chat.peerId, message);
      setMessage("");
    }
  };
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <p className="font-semibold text-lg break-all">{chat.alias || chat.peerId}</p>
          <div className="h-5">
            {isTyping ? (
                <p className="text-sm italic text-green-400">typing...</p>
            ) : (
                <p className={`text-sm ${getStatusColor()}`}>{connectionStatus}</p>
            )}
          </div>
        </div>
        <div className="p-2 bg-white rounded-lg">
          <QRCodeCanvas value={chat.peerId} size={48} />
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {chat.messages.map((msg, index) => (
            <div
              key={index}
              ref={index === chat.messages.length - 1 ? lastMessageRef : null}
              className={`flex ${
                msg.sender === ownPeerId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                  msg.sender === ownPeerId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-gray-700 flex gap-4">
        <input
          type="text"
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-grow p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={connectionStatus !== 'connected'}
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition disabled:bg-gray-500"
          disabled={connectionStatus !== 'connected'}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatView; 