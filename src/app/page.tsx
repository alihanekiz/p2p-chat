"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import Peer, { DataConnection } from "peerjs";
import { ChatThread, Message, PeerData, TypingEvent } from "@/lib/types";

import ChatList from "@/components/ChatList";
import ChatView from "@/components/ChatView";
import AddChatModal from "@/components/AddChatModal";

const Home = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [ownPeerId, setOwnPeerId] = useState<string>("");

  const [chats, setChats] = useState<ChatThread[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set());

  const connections = useRef<Map<string, DataConnection>>(new Map());
  const typingTimeout = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load user ID from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      setIsRegistered(true);
    }
  }, []);

  // Initialize PeerJS and load chats from localStorage
  useEffect(() => {
    if (!isRegistered || !userId) return;

    const newPeer = new Peer(userId, {
      // For production, you'll need a deployed PeerJS server.
      // host: "localhost",
      // port: 9000,
      // path: "/myapp",
    });

    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setOwnPeerId(id);
      const loadedChats = JSON.parse(localStorage.getItem("chats") || "[]");
      setChats(loadedChats);
      // Re-establish connections for existing chats
      loadedChats.forEach((chat: ChatThread) => {
        if(chat.peerId) connectToPeer(chat.peerId);
      })
    });

    newPeer.on("connection", (conn) => {
      setupConnection(conn);
    });

    newPeer.on("error", (err) => {
      console.error("PeerJS error:", err);
    });

    return () => {
      newPeer.destroy();
    };
  }, [isRegistered, userId]);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if(chats.length > 0) {
      localStorage.setItem("chats", JSON.stringify(chats));
    }
  }, [chats]);

  const handleUpdateAlias = (peerId: string, alias: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.peerId === peerId ? { ...chat, alias: alias.trim() } : chat
      )
    );
  };

  const setupConnection = (conn: DataConnection) => {
    conn.on("data", (data) => {
      const event = data as PeerData;
      
      switch (event.type) {
        case "message":
          setChats((prev) =>
            prev.map((chat) =>
              chat.peerId === conn.peer
                ? { ...chat, messages: [...chat.messages, event as Message] }
                : chat
            )
          );
          break;
        case "typing-start":
          setTypingPeers((prev) => new Set(prev).add(conn.peer));
           if (typingTimeout.current.has(conn.peer)) {
            clearTimeout(typingTimeout.current.get(conn.peer));
          }
          const timeout = setTimeout(() => {
            setTypingPeers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(conn.peer);
              return newSet;
            });
          }, 3000); // Stop typing after 3 seconds of inactivity
          typingTimeout.current.set(conn.peer, timeout);
          break;
        case "typing-stop":
           if (typingTimeout.current.has(conn.peer)) {
            clearTimeout(typingTimeout.current.get(conn.peer));
          }
          setTypingPeers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(conn.peer);
            return newSet;
          });
          break;
      }
    });

    conn.on("open", () => {
      connections.current.set(conn.peer, conn);
      setChats((prev) =>
        prev.map((chat) =>
          chat.peerId === conn.peer ? { ...chat, status: "connected" } : chat
        )
      );
      if (!chats.some(chat => chat.peerId === conn.peer)) {
         addNewChat(conn.peer, "connected");
      }
    });

    conn.on("close", () => {
      connections.current.delete(conn.peer);
      setChats((prev) =>
        prev.map((chat) =>
          chat.peerId === conn.peer ? { ...chat, status: "disconnected" } : chat
        )
      );
    });
  };

  const connectToPeer = (peerId: string) => {
    if (!peer) return;
    const conn = peer.connect(peerId);
    setupConnection(conn);
  };
  
  const addNewChat = (peerId: string, status: "pending" | "connected" = "pending") => {
    if (peerId === ownPeerId) {
      alert("You can't chat with yourself!");
      return;
    }
    setChats((prev) => {
      if (prev.some((chat) => chat.peerId === peerId)) {
        return prev;
      }
      const newChat: ChatThread = {
        peerId,
        messages: [],
        status: status,
      };
      return [...prev, newChat];
    });
    setSelectedChatId(peerId);
    if(status === 'pending') {
      connectToPeer(peerId);
    }
  };

  const handleSendMessage = (peerId: string, content: string) => {
    const conn = connections.current.get(peerId);
    if (conn && conn.open) {
      const message: Message = { type: "message", sender: ownPeerId, content, timestamp: Date.now() };
      conn.send(message);
      setChats((prev) =>
        prev.map((chat) =>
          chat.peerId === peerId
            ? { ...chat, messages: [...chat.messages, message] }
            : chat
        )
      );
    }
  };

  const sendTypingEvent = (peerId: string, type: "typing-start" | "typing-stop") => {
    const conn = connections.current.get(peerId);
    if (conn && conn.open) {
      const event: TypingEvent = { type, sender: ownPeerId };
      conn.send(event);
    }
  };

  const handleRegister = () => {
    const newUserId = uuidv4();
    localStorage.setItem("userId", newUserId);
    setUserId(newUserId);
    setIsRegistered(true);
  };

  const selectedChat = chats.find((chat) => chat.peerId === selectedChatId);

  return (
    <main className="flex h-screen bg-gray-900 text-white">
      {!isRegistered ? (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">p2p-chat</h1>
            <p className="text-md sm:text-lg text-gray-400 mb-8">
              A decentralized peer-to-peer chat application.
            </p>
            <button
              onClick={handleRegister}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Register
            </button>
          </div>
        </div>
      ) : (
        <>
          <AddChatModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAddChat={addNewChat}
          />
          <div className="hidden md:flex md:flex-shrink-0">
             <ChatList
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={setSelectedChatId}
                onAddChat={() => setIsModalOpen(true)}
                ownPeerId={ownPeerId}
                onUpdateAlias={handleUpdateAlias}
                typingPeers={typingPeers}
              />
          </div>
          <div className="flex flex-col w-full">
            {selectedChat ? (
              <ChatView
                chat={selectedChat}
                ownPeerId={ownPeerId}
                onSendMessage={handleSendMessage}
                connectionStatus={selectedChat.status}
                onTypingEvent={sendTypingEvent}
                isTyping={typingPeers.has(selectedChat.peerId)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                   <h2 className="text-2xl font-semibold">Welcome to p2p-chat</h2>
                   <p className="text-gray-400 mt-2">Select a chat to start messaging or add a new one.</p>
                   <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">
                      Add a Chat
                   </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default Home;
