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
  onDeleteChat: (peerId: string) => void;
}

const ChatListItem = ({ chat, isSelected, onSelectChat, onUpdateAlias, isTyping, onDeleteChat }: {
  chat: ChatThread;
  isSelected: boolean;
  onSelectChat: (peerId: string) => void;
  onUpdateAlias: (peerId: string, alias: string) => void;
  isTyping: boolean;
  onDeleteChat: (peerId: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [aliasInput, setAliasInput] = useState(chat.alias || "");

  const handleAliasSave = () => {
    onUpdateAlias(chat.peerId, aliasInput);
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the chat with ${chat.alias || chat.peerId}?`)) {
      onDeleteChat(chat.peerId);
    }
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
          <div className="flex items-center">
            {chat.unreadCount && chat.unreadCount > 0 ? (
              <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center mr-2">
                {chat.unreadCount}
              </span>
            ) : (
              <span className="text-xs text-gray-500 mr-2">double click to edit</span>
            )}
            <button onClick={handleDelete} className="text-red-500 hover:text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
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
  onDeleteChat,
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
            onDeleteChat={onDeleteChat}
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