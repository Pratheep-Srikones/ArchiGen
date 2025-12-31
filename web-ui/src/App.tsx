import { Routes, Route } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<Auth />} />
    </Routes>
  );
}

export default App;
