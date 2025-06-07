"use client";

import { ChatThread } from "../lib/types";
import { useState } from "react";

interface ChatListProps {
  chats: ChatThread[];
  selectedChatId: string | null;
  onSelectChat: (peerId: string) => void;
  onAddChat: () => void;
  ownPeerId: string;
  onUpdateAlias: (peerId: string, alias: string) => void;
  typingPeers: Set<string>;
}

const ChatListItem = ({ chat, isSelected, onSelectChat, onUpdateAlias, isTyping }: {
  chat: ChatThread;
  isSelected: boolean;
  onSelectChat: (peerId: string) => void;
  onUpdateAlias: (peerId: string, alias: string) => void;
  isTyping: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [aliasInput, setAliasInput] = useState(chat.alias || "");

  const handleAliasSave = () => {
    onUpdateAlias(chat.peerId, aliasInput);
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => onSelectChat(chat.peerId)}
      className={`p-4 cursor-pointer hover:bg-gray-700 ${
        isSelected ? "bg-gray-700" : ""
      }`}
    >
      {isEditing ? (
        <input
          type="text"
          value={aliasInput}
          onChange={(e) => setAliasInput(e.target.value)}
          onBlur={handleAliasSave}
          onKeyPress={(e) => e.key === 'Enter' && handleAliasSave()}
          onClick={(e) => e.stopPropagation()} // Prevent chat selection when clicking input
          className="w-full bg-gray-600 text-white p-1 rounded"
          autoFocus
        />
      ) : (
        <div className="flex justify-between items-center">
          <p
            className="font-semibold break-all"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {chat.alias || chat.peerId}
          </p>
          <span className="text-xs text-gray-500">double click to edit</span>
        </div>
      )}
      <p className="text-sm text-gray-400 truncate h-5">
        {isTyping ? <span className="text-green-400 italic">typing...</span> : <span>{chat.status}</span>}
      </p>
    </div>
  );
};

const ChatList = ({
  chats,
  selectedChatId,
  onSelectChat,
  onAddChat,
  ownPeerId,
  onUpdateAlias,
  typingPeers,
}: ChatListProps) => {
  return (
    <div className="flex flex-col h-full bg-gray-800 text-white w-full md:w-80 lg:w-96 border-r border-gray-700 flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">Your ID</h2>
        <p className="font-mono text-sm text-gray-400 break-all">{ownPeerId}</p>
      </div>
      <div className="flex-grow overflow-y-auto">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.peerId}
            chat={chat}
            isSelected={selectedChatId === chat.peerId}
            onSelectChat={onSelectChat}
            onUpdateAlias={onUpdateAlias}
            isTyping={typingPeers.has(chat.peerId)}
          />
        ))}
      </div>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onAddChat}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          + Add Chat
        </button>
      </div>
    </div>
  );
};

export default ChatList; 