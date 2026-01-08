import { Routes, Route } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<Auth />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;
