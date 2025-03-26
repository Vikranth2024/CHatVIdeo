// // frontend/src/App.jsx
// import React from "react";
// import { ChatProvider } from "./context/ChatContext";
// import ChatWindow from "./components/Chat/ChatWindow";

// function App() {
//   return (
//     <ChatProvider>
//       <div className="min-h-screen bg-gray-100 p-4">
//         <h1 className="text-4xl font-bold text-center mb-8">Chat App</h1>
//         <ChatWindow />
//       </div>
//     </ChatProvider>
//   );
// }

// export default App;


// frontend/src/App.jsx
// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ChatProvider } from "./context/ChatContext";
import ChatWindow from "./components/Chat/ChatWindow";
import VideoCall from "./components/Video/VideoCall";

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100 p-4">
          <h1 className="text-4xl font-bold text-center mb-8">Chat App & Video Call</h1>
          {/* Navigation Links */}
          <nav className="mb-4 flex justify-center space-x-6">
            <Link to="/" className="text-blue-600 hover:underline">
              Chat
            </Link>
            <Link to="/video-call" className="text-blue-600 hover:underline">
              Video Call
            </Link>
          </nav>
          {/* Define Routes */}
          <Routes>
            <Route path="/" element={<ChatWindow />} />
            <Route path="/video-call" element={<VideoCall />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
