import { Route } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/auth/RegisterPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOTPPage from "../pages/auth/VerifyOTPPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import ComicDetailPage from "../pages/ComicDetailPage";
import ProfilePage from "../pages/ProfilePage";
import SearchPage from "../pages/SearchPage";
import ChapterPage from "../pages/ChapterPage";
import HistoryPage from "../pages/HistoryPage";
import FollowPage from "../pages/FollowPage";
import CommunityPage from "../pages/CommunityPage";
import GroupsListPage from "../pages/GroupsListPage";
import GroupDetailPage from "../pages/GroupDetailPage";

const UserRoutes = (
    <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/verify-otp" element={<VerifyOTPPage />} />
        <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="truyen-tranh/:slug/chapter/:chapterNumber" element={<ChapterPage />} />
        <Route path="truyen-tranh/:slug" element={<ComicDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="following" element={<FollowPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="groups" element={<GroupsListPage />} />
        <Route path="groups/:groupId" element={<GroupDetailPage />} />
    </Route>
);

export default UserRoutes;
