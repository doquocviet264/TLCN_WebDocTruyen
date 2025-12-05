import { Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Comics from "../pages/admin/ManageComics";
import ComicDetail from "../pages/admin/ManageComicDetail";
import Users from "../pages/admin/ManageUser";
import Reports from "../pages/admin/ManageReport";
import Comments from "../pages/admin/ManageComment";
import Genres from "../pages/admin/ManageGenre";
import Notifications from "../pages/admin/ManageNotification";
import Application from "../pages/admin/ApplicationManagementPage";

const AdminRoutes = (
    <Route path="/admin" element={<AdminLayout />}>
        <Route path="comics" element={<Comics />} />
        <Route path="comics/:id" element={<ComicDetail />} />
        <Route path="comics/:id/:chapterId" element={<ComicDetail />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="comments" element={<Comments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="applications" element={<Application />} />
        <Route path="genres" element={<Genres />} />
    </Route>
);

export default AdminRoutes;
