"use client";

import { useState } from "react";

interface AddChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChat: (peerId: string) => void;
}

const AddChatModal = ({ isOpen, onClose, onAddChat }: AddChatModalProps) => {
  const [peerId, setPeerId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (peerId.trim()) {
      onAddChat(peerId.trim());
      setPeerId("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-white">Add New Chat</h2>
        <input
          type="text"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
          placeholder="Enter Peer ID"
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChatModal; 