export interface Message {
  type: "message";
  sender: string;
  content: string;
  timestamp: number;
}

export interface TypingEvent {
    type: "typing-start" | "typing-stop";
    sender: string;
}

export interface HandshakeEvent {
  type: "handshake-init" | "handshake-ack";
  sender: string;
}

export type PeerData = Message | TypingEvent | HandshakeEvent;

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected";

export interface ChatThread {
  peerId: string;
  alias?: string;
  messages: Message[];
  status: ConnectionStatus;
  unreadCount?: number;
} 