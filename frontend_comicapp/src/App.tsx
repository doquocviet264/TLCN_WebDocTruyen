import { BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import "./App.css";

// Import routes đã tách
import { UserRoutes, AdminRoutes, GroupRoutes } from "./routes";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {UserRoutes}
          {AdminRoutes}
          {GroupRoutes}
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;
