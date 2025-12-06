import { Route } from "react-router-dom";
import GroupLayout from "../layouts/GroupLayout";
import GroupManagementPage from "../pages/Groups/GroupManagementPage";
import GroupSettingsPage from "../pages/Groups/GroupSettingsPage";
import GroupChatPage from "../pages/Groups/GroupChatPage";
import GroupMembersPage from "../pages/Groups/GroupMembersPage";
import GroupComicManagePage from "../pages/Groups/GroupManageComics";

const GroupRoutes = (
    <Route path="/groups/:groupId/manage" element={<GroupLayout />}>
        <Route path="" element={<GroupManagementPage />} />
        <Route path="comics" element={<GroupComicManagePage />} />
        <Route path="members" element={<GroupMembersPage />} />
        <Route path="settings" element={<GroupSettingsPage />} />
        <Route path="chat" element={<GroupChatPage />} />
    </Route>
);

export default GroupRoutes;
