import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import ChatLayout from "./components/ChatLayout";
import ChatWindow from "./components/ChatWindow";
import EmptyState from "./components/EmptyState";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "sonner";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(30, 20, 50, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              color: "#e2e0f0",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main chat layout with nested routes */}
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <ChatLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<EmptyState />} />
            <Route path="room/:roomName" element={<ChatWindow />} />
            <Route path="dm/:username" element={<ChatWindow />} />
          </Route>

          {/* Backward compat redirect */}
          <Route path="/rooms" element={<Navigate to="/chat" replace />} />
          <Route path="/chat/:roomName" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
