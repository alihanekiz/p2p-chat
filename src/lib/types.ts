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

export type PeerData = Message | TypingEvent;

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "pending";

export interface ChatThread {
  peerId: string;
  alias?: string;
  messages: Message[];
  status: ConnectionStatus;
} 