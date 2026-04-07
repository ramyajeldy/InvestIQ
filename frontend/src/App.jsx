import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppShell from "./components/AppShell.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ChatPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
