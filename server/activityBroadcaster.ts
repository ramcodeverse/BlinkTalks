import { getPrisma } from "./db.js";
import { pubsub } from "./pubsub.js";
import { encrypt } from "./encryption.js";

export interface BroadcastActivityOptions {
  type:
    | "task_created"
    | "task_status_changed"
    | "task_assigned"
    | "task_deleted"
    | "project_created"
    | "project_status_changed";
  entityId: string;
  entityTitle: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  communityId?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  workspaceId?: string | null;
}

/**
 * Resolves the linked community channel and broadcasts real-time work activity
 * updates (task and project events) as structured activity cards.
 */
export async function broadcastWorkActivity(options: BroadcastActivityOptions): Promise<any | null> {
  const prisma = getPrisma();
  const {
    type,
    entityId,
    entityTitle,
    actorId,
    actorName,
    actorAvatar,
    oldValue,
    newValue,
    communityId,
    projectId,
    projectName,
    workspaceId,
  } = options;

  try {
    // 1. Resolve target community conversation
    let targetCommunityId: string | null = communityId || null;

    if (!targetCommunityId && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { community_id: true },
      });
      if (project?.community_id) {
        targetCommunityId = project.community_id;
      }
    }

    if (!targetCommunityId && workspaceId) {
      // Look for workspace community channel
      const wsChannel = await prisma.conversation.findFirst({
        where: {
          workspace_id: workspaceId,
          is_public: true,
          type: "group",
        },
      });
      if (wsChannel) {
        targetCommunityId = wsChannel.id;
      }
    }

    if (!targetCommunityId) {
      // Fallback: look for community group or default public channel
      const communityConv = await prisma.conversation.findFirst({
        where: {
          OR: [
            { is_community: true },
            { invite_code: "community" },
            { is_public: true, type: "group" },
          ],
        },
        orderBy: { created_at: "asc" },
      });
      if (communityConv) {
        targetCommunityId = communityConv.id;
      }
    }

    if (!targetCommunityId) {
      console.warn("[ActivityBroadcaster] No target community channel resolved for broadcast:", entityTitle);
      return null;
    }

    // Verify conversation exists
    const conv = await prisma.conversation.findUnique({
      where: { id: targetCommunityId },
      select: { id: true, name: true },
    });
    if (!conv) {
      console.warn("[ActivityBroadcaster] Target conversation not found:", targetCommunityId);
      return null;
    }

    // 2. Format human-readable text content
    let textContent = "";
    switch (type) {
      case "task_created":
        textContent = `📌 [Task Created] "${entityTitle}" created by ${actorName}${projectName ? ` in ${projectName}` : ""}`;
        break;
      case "task_status_changed":
        textContent = `⚡ [Task Update] "${entityTitle}" status changed: ${oldValue || "TODO"} ➔ ${newValue} by ${actorName}`;
        break;
      case "task_assigned":
        textContent = `👤 [Task Assigned] "${entityTitle}" assigned to ${newValue} by ${actorName}`;
        break;
      case "task_deleted":
        textContent = `🗑️ [Task Removed] "${entityTitle}" was removed by ${actorName}`;
        break;
      case "project_created":
        textContent = `🚀 [Project Launched] "${entityTitle}" started by ${actorName}`;
        break;
      case "project_status_changed":
        textContent = `📊 [Project Update] "${entityTitle}" status changed to ${newValue} by ${actorName}`;
        break;
      default:
        textContent = `🔔 [Activity] "${entityTitle}" updated by ${actorName}`;
    }

    const isProjectActivity = type.startsWith("project_");
    const messageType = isProjectActivity ? "project_activity" : "task_activity";

    const metadataPayload = {
      activity_type: type,
      entity_id: entityId,
      entity_title: entityTitle,
      actor_name: actorName,
      actor_avatar: actorAvatar || null,
      old_value: oldValue || null,
      new_value: newValue || null,
      project_id: projectId || null,
      project_name: projectName || null,
      timestamp: new Date().toISOString(),
    };

    // 3. Persist system activity message
    const message = await prisma.message.create({
      data: {
        conversation_id: conv.id,
        sender_id: actorId,
        content: encrypt(textContent),
        message_type: messageType,
        metadata: JSON.stringify(metadataPayload),
      },
      include: {
        sender: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
      },
    });

    // 4. Real-time broadcast to connected clients on this conversation
    const publishedPayload = {
      type: "message",
      data: {
        id: message.id,
        conversation_id: conv.id,
        sender_id: actorId,
        sender_name: actorName,
        sender_username: message.sender?.username || "system",
        sender_avatar: actorAvatar || message.sender?.avatar || null,
        content: textContent,
        message_type: messageType,
        metadata: message.metadata,
        created_at: message.created_at.toISOString(),
      },
    };

    pubsub.publish(`chat:conversation:${conv.id}`, JSON.stringify(publishedPayload));

    console.log(
      `📢 [ActivityBroadcaster] Broadcasted ${messageType} (${type}) to channel "${conv.name || conv.id}"`
    );

    return message;
  } catch (error) {
    console.error("[ActivityBroadcaster] Failed to broadcast activity:", error);
    return null;
  }
}
