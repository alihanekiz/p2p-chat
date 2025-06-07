"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import Peer, { DataConnection } from "peerjs";
import {
  ChatThread,
  Message,
  PeerData,
  TypingEvent,
  HandshakeEvent,
} from "@/lib/types";
import { Toaster, toast } from "react-hot-toast";

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
  const selectedChatIdRef = useRef(selectedChatId);
  selectedChatIdRef.current = selectedChatId;

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

    // Destroy any existing peer instance before creating a new one
    if (peer) {
      peer.destroy();
    }

    const newPeer = new Peer(userId, {
      // For production, you'll need a deployed PeerJS server.
      // We use the default cloud server for simplicity.
    });

    setPeer(newPeer);

    newPeer.on("open", (id) => {
      setOwnPeerId(id);
      const loadedChats = JSON.parse(localStorage.getItem("chats") || "[]");
      // Mark all loaded chats as disconnected initially
      const initialChats = loadedChats.map((chat: ChatThread) => ({ ...chat, status: "disconnected" }));
      setChats(initialChats);
    });

    newPeer.on("connection", (conn) => {
      console.log(`Incoming connection from ${conn.peer}`);
      setupConnection(conn);
    });

    newPeer.on("error", (err) => {
      console.error("PeerJS error name:", err.name);
      console.error("PeerJS error type:", err.type);

      if (err.type === 'peer-unavailable') {
        const peerId = (err as any).peer;
        console.log(`Could not connect to peer ${peerId}. They appear to be offline.`);
        setChats((prev) => 
          prev.map((chat) => 
            chat.peerId === peerId ? { ...chat, status: "disconnected" } : chat
          )
        );
      } else {
        console.error("A critical PeerJS error occurred:", err);
      }
    });
    
    newPeer.on('disconnected', () => {
        console.log("Peer disconnected from the server. Attempting to reconnect...");
        setChats(prev => prev.map(chat => ({...chat, status: 'disconnected'})));
        setTimeout(() => {
            if (!newPeer.destroyed) {
                newPeer.reconnect();
            }
        }, 5000);
    });

    return () => {
      console.log("Destroying peer instance");
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
    const existingConn = connections.current.get(conn.peer);
    if (existingConn) {
      console.log(`Replacing existing connection to ${conn.peer} with new one.`);
      existingConn.removeAllListeners();
      existingConn.close();
    }
    
    connections.current.set(conn.peer, conn);

    conn.on("data", (data) => {
      const event = data as PeerData;
      
      switch (event.type) {
        case "message":
          setChats((prev) => {
            const isChatSelected = selectedChatIdRef.current === conn.peer;

            if (!isChatSelected) {
              const fromChat = prev.find(c => c.peerId === conn.peer);
              const fromName = fromChat?.alias || conn.peer;
              toast.success(`New message from ${fromName}`);
            }

            return prev.map((chat) =>
              chat.peerId === conn.peer
                ? {
                    ...chat,
                    messages: [...chat.messages, event as Message],
                    unreadCount: isChatSelected
                      ? 0
                      : (chat.unreadCount || 0) + 1,
                  }
                : chat
            );
          });
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
        case "handshake-init":
          conn.send({ type: "handshake-ack", sender: ownPeerId } as HandshakeEvent);
          setChats((prev) =>
            prev.map((chat) =>
              chat.peerId === conn.peer ? { ...chat, status: "connected" } : chat
            )
          );
          break;
        case "handshake-ack":
          setChats((prev) =>
            prev.map((chat) =>
              chat.peerId === conn.peer ? { ...chat, status: "connected" } : chat
            )
          );
          break;
      }
    });

    conn.on("open", () => {
      // This is the initiator of the connection, start the handshake
      if(ownPeerId > conn.peer) {
        console.log(`Connection to ${conn.peer} is open. Sending handshake-init.`);
        conn.send({ type: "handshake-init", sender: ownPeerId } as HandshakeEvent);
      }
    });

    conn.on("close", () => {
      console.log(`Connection to ${conn.peer} closed.`);
      if (connections.current.get(conn.peer) === conn) {
        connections.current.delete(conn.peer);
        setChats((prev) =>
          prev.map((chat) =>
            chat.peerId === conn.peer ? { ...chat, status: "disconnected" } : chat
          )
        );
      }
    });

    conn.on("error", (err) => {
       // This handles errors on an already established connection.
       console.error(`Connection error with ${conn.peer}:`, err);
       if (connections.current.get(conn.peer) === conn) {
         connections.current.delete(conn.peer);
         setChats((prev) =>
          prev.map((chat) =>
            chat.peerId === conn.peer ? { ...chat, status: "disconnected" } : chat
          )
        );
       }
    })
  };

  const connectToPeer = (peerId: string) => {
    if (!peer || peer.disconnected || connections.current.has(peerId)) return;
    
    // Only the peer with the greater ID should initiate the connection
    if (ownPeerId < peerId) {
      console.log(`[Passive] Waiting for ${peerId} to connect.`);
      setChats(prev => prev.map(c => c.peerId === peerId ? {...c, status: 'connecting'} : c));
      return;
    }

    console.log(`[Initiator] Attempting to connect to ${peerId}`);
    setChats(prev => prev.map(c => c.peerId === peerId ? {...c, status: 'connecting'} : c));
    
    const conn = peer.connect(peerId, { reliable: true });
    setupConnection(conn);
  };
  
  const handleSelectChat = (peerId: string) => {
    const chat = chats.find(c => c.peerId === peerId);
    if (chat && chat.status === 'disconnected') {
      connectToPeer(peerId);
    }
    setChats((prev) =>
      prev.map((chat) =>
        chat.peerId === peerId ? { ...chat, unreadCount: 0 } : chat
      )
    );
    setSelectedChatId(peerId);
  }

  const addNewChat = (peerId: string) => {
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
        status: "disconnected", // Always start as disconnected
      };
      return [...prev, newChat];
    });
    setSelectedChatId(peerId);
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
          <Toaster />
          <AddChatModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAddChat={addNewChat}
          />
          <div className="hidden md:flex md:flex-shrink-0">
             <ChatList
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={handleSelectChat}
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
                onReconnect={connectToPeer}
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
