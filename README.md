# p2p-chat

A decentralized peer-to-peer chat application built with Next.js, PeerJS, and Tailwind CSS.

## Features

- Decentralized chat using PeerJS.
- User registration with a unique ID stored in `localStorage`.
- Share your user ID with a QR code.
- Responsive and modern UI.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher)
- [npm](https://www.npmjs.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/p2p-chat.git
    cd p2p-chat
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

To run the application, you need to start two separate processes: the PeerJS server and the Next.js development server.

1.  **Start the PeerJS server:**
    Open a terminal and run the following command:
    ```bash
    npm run peer
    ```
    This will start the PeerJS server on `http://localhost:9000/myapp`.

2.  **Start the Next.js development server:**
    Open another terminal and run the following command:
    ```bash
    npm run dev
    ```
    This will start the Next.js development server on `http://localhost:3000`.

## How to Use

1.  Open two browser windows or tabs and navigate to `http://localhost:3000`.
2.  In each window, click the "Register" button to generate a unique user ID.
3.  You will now see the chat interface. Your user ID and a QR code will be displayed at the top.
4.  To connect to the other client, copy the user ID from one window and paste it into the "Remote Peer ID" input field in the other window.
5.  Click the "Connect" button.
6.  Once the connection is established, you can start sending messages between the two clients.

## Built With

- [Next.js](https://nextjs.org/) - React framework for production.
- [PeerJS](https://peerjs.com/) - Peer-to-peer data and media connections in the browser.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
- [uuid](https://github.com/uuidjs/uuid) - For generating RFC4122 UUIDs.
- [qrcode.react](https://github.com/zpao/qrcode.react) - A React component for generating QR codes.
