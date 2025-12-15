import { Route } from "react-router-dom";
import GroupLayout from "../layouts/GroupLayout";
import GroupManagementPage from "../pages/group/GroupManagementPage";
import GroupSettingsPage from "../pages/group/GroupSettingsPage";
import GroupChatPage from "../pages/group/GroupChatPage";
import GroupMembersPage from "../pages/group/GroupMembersPage";
import GroupComicManagePage from "../pages/group/GroupManageComics";
import GroupManageChapter from "../pages/group/GroupManageChapter";

const GroupRoutes = (
    <Route path="/groups/:groupId/manage" element={<GroupLayout />}>
        <Route path="" element={<GroupManagementPage />} />
        <Route path="comics" element={<GroupComicManagePage />} />
        <Route path="comics/:id" element={<GroupManageChapter />} />
        <Route path="members" element={<GroupMembersPage />} />
        <Route path="settings" element={<GroupSettingsPage />} />
        <Route path="chat" element={<GroupChatPage />} />
    </Route>
);

export default GroupRoutes;
