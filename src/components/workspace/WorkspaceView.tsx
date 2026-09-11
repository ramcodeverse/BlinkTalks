import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import WorkspaceHeader from "./WorkspaceHeader.tsx";
import WorkspaceDashboard from "./WorkspaceDashboard.tsx";
import MyWorkView from "./MyWorkView.tsx";
import KanbanBoard from "./KanbanBoard.tsx";
import ProjectsView from "./ProjectsView.tsx";
import CalendarMeetingsView from "./CalendarMeetingsView.tsx";
import TeamDirectoryView from "./TeamDirectoryView.tsx";
import FilesView from "./FilesView.tsx";
import AnnouncementsView from "./AnnouncementsView.tsx";
import NotesDocsView from "./NotesDocsView.tsx";
import AnalyticsView from "./AnalyticsView.tsx";
import WorkspaceModal from "./WorkspaceModal.tsx";
import CreateTaskModal from "./CreateTaskModal.tsx";
import CreateProjectModal from "./CreateProjectModal.tsx";
import ScheduleMeetingModal from "./ScheduleMeetingModal.tsx";
import CreateAnnouncementModal from "./CreateAnnouncementModal.tsx";
import TaskDetailPanel from "./TaskDetailPanel.tsx";

interface WorkspaceViewProps {
  onSwitchToChats?: () => void;
  onStartDirectChat?: (userId: string) => void;
}

export default function WorkspaceView({
  onSwitchToChats,
  onStartDirectChat,
}: WorkspaceViewProps) {
  const {
    activeTab,
    fetchWorkspaces,
    activeWorkspace,
    isTaskModalOpen,
    setIsTaskModalOpen,
    isProjectModalOpen,
    setIsProjectModalOpen,
    isMeetingModalOpen,
    setIsMeetingModalOpen,
    isAnnouncementModalOpen,
    setIsAnnouncementModalOpen,
    activeTask,
    setActiveTask,
  } = useWorkspaceStore();

  const [isWsModalOpen, setIsWsModalOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Sub-header for navigation tabs and workspace selection */}
      <WorkspaceHeader
        onOpenWorkspaceModal={() => setIsWsModalOpen(true)}
        onSwitchToChats={onSwitchToChats}
      />

      {/* Main View Body */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === "dashboard" && <WorkspaceDashboard />}
        {activeTab === "my-work" && <MyWorkView />}
        {activeTab === "kanban" && <KanbanBoard />}
        {activeTab === "projects" && <ProjectsView />}
        {activeTab === "calendar" && <CalendarMeetingsView />}
        {activeTab === "team" && (
          <TeamDirectoryView onStartDirectChat={onStartDirectChat} />
        )}
        {activeTab === "files" && <FilesView />}
        {activeTab === "announcements" && <AnnouncementsView />}
        {activeTab === "notes" && <NotesDocsView />}
        {activeTab === "analytics" && <AnalyticsView />}

        {/* Sliding Right Task Detail Panel */}
        {activeTask && (
          <TaskDetailPanel
            task={activeTask}
            onClose={() => setActiveTask(null)}
          />
        )}
      </div>

      {/* Workspace Switcher / Join / Create Modal */}
      <WorkspaceModal
        isOpen={isWsModalOpen}
        onClose={() => setIsWsModalOpen(false)}
      />

      {/* Quick Create Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
      <ScheduleMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
      />
      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />
    </div>
  );
}
