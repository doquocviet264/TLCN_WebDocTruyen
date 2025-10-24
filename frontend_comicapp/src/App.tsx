import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import "./App.css";
// User pages
import UserLayout from "./layouts/UserLayout";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ComicDetailPage from "./pages/ComicDetailPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import ChapterPage from "./pages/ChapterPage";
import HistoryPage from "./pages/HistoryPage";
import FollowPage from "./pages/FollowPage";
import CommunityPage from "./pages/CommunityPage";
// Admin pages
import AdminLayout from "./layouts/AdminLayout";
import Comics from "./pages/admin/ManageComics";
import ComicDetail from "./pages/admin/ManageComicDetail";
import Users from "./pages/admin/ManageUser";
import Reports from "./pages/admin/ManageReport";
import Comments from "./pages/admin/ManageComment";
import Genres from "./pages/admin/ManageGenre";
import Notifications from "./pages/admin/ManageNotification"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* User layout */}
          <Route path="/" element={<UserLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/truyen-tranh/:slug/chapter/:chapterNumber" element={<ChapterPage />} />
            <Route path="/truyen-tranh/:slug" element={<ComicDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/following" element={<FollowPage />} />
            <Route path="/community" element={<CommunityPage />} />
          </Route>

          {/* Admin layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="comics" element={<Comics />} />
            <Route path="comics/:id" element={<ComicDetail />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="comments" element={<Comments />} />
            <Route path="notifications" element={<Notifications />} />

            <Route path="genres" element={<Genres />} />
          </Route>
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;
