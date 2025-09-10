import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage";
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from "./pages/auth/LoginPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ComicDetailPage from "./pages/ComicDetailPage"
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
function App() {
  return (
    <AuthProvider>
    <Router>
      <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-6">
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/truyen-tranh/:slug" element={<ComicDetailPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
      </main>

      <Footer />
    </div>
    </Router>
    </AuthProvider>
  );
}

export default App;
