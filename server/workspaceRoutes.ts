import { Router, Response, Request } from "express";
import crypto from "crypto";
import { getPrisma } from "./db.js";
import { authenticateJWT, AuthenticatedRequest } from "./auth.js";
import { pubsub } from "./pubsub.js";
import { broadcastWorkActivity } from "./activityBroadcaster.js";

const router = Router();

// ==========================================
// HELPER UTILITIES & PERMISSION GUARDS
// ==========================================

async function getMemberDetails(
  workspaceId: string,
  userId: string
): Promise<{ role: string; status: string; department?: string | null } | null> {
  const prisma = getPrisma();
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: workspaceId,
        user_id: userId,
      },
    },
  });
  if (!member || member.status === "REMOVED") return null;
  return {
    role: member.role.toLowerCase(),
    status: member.status,
    department: member.department,
  };
}

async function getMemberRole(workspaceId: string, userId: string): Promise<string | null> {
  const member = await getMemberDetails(workspaceId, userId);
  return member ? member.role : null;
}

function hasPermission(role: string, required: "guest" | "member" | "manager" | "admin" | "owner"): boolean {
  const normalized = (role || "").toLowerCase();
  const hierarchy: Record<string, number> = {
    guest: 1,
    member: 2,
    manager: 3,
    admin: 4,
    owner: 5,
  };
  return (hierarchy[normalized] || 0) >= (hierarchy[required] || 0);
}

function generateSecureInviteCode(prefix = "WS"): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  const cleanPrefix = prefix.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "WS";
  return `${cleanPrefix}-${code}`;
}

async function recordAuditLog(
  workspaceId: string,
  actorId: string,
  actorName: string,
  action: string,
  targetId?: string | null,
  targetName?: string | null,
  details?: string | null
) {
  try {
    const prisma = getPrisma();
    await prisma.workspaceAuditLog.create({
      data: {
        workspace_id: workspaceId,
        actor_id: actorId,
        actor_name: actorName,
        action,
        target_id: targetId || null,
        target_name: targetName || null,
        details: details || null,
      },
    });
  } catch (err) {
    console.error("Failed to record workspace audit log:", err);
  }
}

function broadcastWorkspaceEvent(workspaceId: string, eventType: string, data: any) {
  try {
    pubsub.publish(
      "workspace:events",
      JSON.stringify({
        workspace_id: workspaceId,
        event_type: eventType,
        data,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Failed to broadcast workspace event:", err);
  }
}

async function recordActivity(
  workspaceId: string,
  userId: string,
  userName: string,
  action: string,
  objectType: string,
  objectTitle: string,
  details?: string
) {
  try {
    const prisma = getPrisma();
    await prisma.workspaceActivity.create({
      data: {
        workspace_id: workspaceId,
        user_id: userId,
        user_name: userName,
        action,
        object_type: objectType,
        object_title: objectTitle,
        details: details || null,
      },
    });
  } catch (err) {
    console.error("Failed to record workspace activity:", err);
  }
}

async function createNotification(
  userId: string,
  title: string,
  content: string,
  type: string,
  link?: string
) {
  try {
    const prisma = getPrisma();
    await prisma.notification.create({
      data: {
        user_id: userId,
        title,
        content,
        type,
        link: link || null,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

// ==========================================
// WORKSPACE CRUD & MEMBERSHIP
// ==========================================

/**
 * GET /api/workspaces
 * List all workspaces current user belongs to
 */
router.get("/api/workspaces", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;

    const memberships = await prisma.workspaceMember.findMany({
      where: {
        user_id: userId,
        status: { not: "REMOVED" },
      },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: {
                  where: { status: "ACTIVE" },
                },
                projects: true,
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    const workspaces = memberships.map((m: any) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      description: m.workspace.description,
      category: m.workspace.category,
      logo: m.workspace.logo,
      invite_code: m.workspace.invite_code,
      owner_id: m.workspace.owner_id,
      created_at: m.workspace.created_at.toISOString(),
      role: m.role,
      status: m.status,
      members_count: m.workspace._count.members,
      projects_count: m.workspace._count.projects,
      tasks_count: m.workspace._count.tasks,
    }));

    res.json({ workspaces });
  } catch (err) {
    console.error("GET /api/workspaces error:", err);
    res.status(500).json({ error: "Failed to load workspaces." });
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post("/api/workspaces", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { name, description, category, logo } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Workspace name is required." });
      return;
    }

    const prefix = name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "WS";
    const inviteCode = generateSecureInviteCode(prefix);

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || "General",
        logo: logo || null,
        invite_code: inviteCode,
        owner_id: userId,
        members: {
          create: {
            user_id: userId,
            role: "OWNER",
            status: "ACTIVE",
            department: "Executive",
          },
        },
      },
    });

    // Create default company channels linked to this workspace
    const channels = ["general", "engineering", "announcements", "random"];
    for (const ch of channels) {
      const channelInvite = `ch-${workspace.id.slice(0, 4)}-${ch}`;
      await prisma.conversation.create({
        data: {
          workspace_id: workspace.id,
          type: "group",
          name: `#${ch}`,
          is_public: true,
          invite_code: channelInvite,
          members: {
            create: {
              user_id: userId,
              role: "admin",
              is_accepted: true,
            },
          },
        },
      });
    }

    // Create initial departments
    const depts = ["Engineering", "Design", "Product", "Marketing", "Operations"];
    for (const d of depts) {
      await prisma.department.create({
        data: {
          workspace_id: workspace.id,
          name: d,
        },
      });
    }

    await recordAuditLog(
      workspace.id,
      userId,
      req.user!.username,
      "WORKSPACE_CREATED",
      workspace.id,
      workspace.name,
      "Workspace created with default channels and departments"
    );

    await recordActivity(
      workspace.id,
      userId,
      req.user!.username,
      "created_workspace",
      "workspace",
      workspace.name,
      "Workspace created with default channels and departments"
    );

    res.status(201).json({
      workspace: {
        ...workspace,
        role: "OWNER",
        status: "ACTIVE",
        members_count: 1,
        projects_count: 0,
        tasks_count: 0,
      },
    });
  } catch (err) {
    console.error("POST /api/workspaces error:", err);
    res.status(500).json({ error: "Failed to create workspace." });
  }
});

/**
 * GET /api/workspaces/:id
 * Get details of a single workspace
 */
router.get("/api/workspaces/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: userId,
        },
      },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
                tasks: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      res.status(403).json({ error: "You are not a member of this workspace." });
      return;
    }

    res.json({
      workspace: {
        id: member.workspace.id,
        name: member.workspace.name,
        description: member.workspace.description,
        category: member.workspace.category,
        logo: member.workspace.logo,
        invite_code: member.workspace.invite_code,
        owner_id: member.workspace.owner_id,
        created_at: member.workspace.created_at.toISOString(),
        role: member.role,
        members_count: member.workspace._count.members,
        projects_count: member.workspace._count.projects,
        tasks_count: member.workspace._count.tasks,
      },
    });
  } catch (err) {
    console.error("GET /api/workspaces/:id error:", err);
    res.status(500).json({ error: "Failed to load workspace details." });
  }
});

/**
 * PATCH /api/workspaces/:id
 * Update workspace settings (Admin / Owner)
 */
router.patch("/api/workspaces/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, category, logo } = req.body;

    const role = await getMemberRole(id, userId);
    if (!role || !hasPermission(role, "admin")) {
      res.status(403).json({ error: "Admin permissions required to modify workspace." });
      return;
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(category && { category: category.trim() }),
        ...(logo !== undefined && { logo: logo || null }),
      },
    });

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "updated_workspace",
      "workspace",
      updated.name,
      "Workspace settings updated"
    );

    res.json({ workspace: updated });
  } catch (err) {
    console.error("PATCH /api/workspaces/:id error:", err);
    res.status(500).json({ error: "Failed to update workspace." });
  }
});

/**
 * GET /api/workspaces/validate-invite/:code
 * Public / Authenticated preview and validation for invite links or codes
 */
router.get("/api/workspaces/validate-invite/:code", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const { code } = req.params;
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Invite code is required." });
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Check WorkspaceInvitation model first
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { invite_code: cleanCode },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: { where: { status: "ACTIVE" } },
                channels: { where: { is_public: true } },
                projects: true,
              },
            },
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
          },
        },
      },
    });

    let targetWorkspace: any = null;
    let assignedRole = "MEMBER";
    let isExpired = false;
    let isRevoked = false;

    if (invitation) {
      targetWorkspace = invitation.workspace;
      assignedRole = invitation.role;
      if (invitation.status === "REVOKED") isRevoked = true;
      if (
        invitation.status === "EXPIRED" ||
        (invitation.expires_at && new Date(invitation.expires_at) < new Date())
      ) {
        isExpired = true;
      }
    } else {
      // 2. Check direct Workspace primary invite code
      targetWorkspace = await prisma.workspace.findFirst({
        where: {
          OR: [
            { invite_code: cleanCode },
            { invite_code: cleanCode.toLowerCase() },
          ],
        },
        include: {
          _count: {
            select: {
              members: { where: { status: "ACTIVE" } },
              channels: { where: { is_public: true } },
              projects: true,
            },
          },
        },
      });
    }

    if (!targetWorkspace) {
      res.status(404).json({
        valid: false,
        error: "Invite code isn't valid. Possible reasons: Incorrect code, expired invitation, invitation revoked, or workspace unavailable.",
      });
      return;
    }

    if (isRevoked) {
      res.status(410).json({
        valid: false,
        error: "This invitation link has been revoked by an administrator.",
      });
      return;
    }

    if (isExpired) {
      res.status(410).json({
        valid: false,
        error: "This invitation code has expired. Please request a new invite link from a workspace administrator.",
      });
      return;
    }

    // Sample public channels preview
    const publicChannels = await prisma.conversation.findMany({
      where: { workspace_id: targetWorkspace.id, is_public: true },
      take: 4,
      select: { id: true, name: true },
    });

    res.json({
      valid: true,
      workspace: {
        id: targetWorkspace.id,
        name: targetWorkspace.name,
        description: targetWorkspace.description,
        category: targetWorkspace.category,
        logo: targetWorkspace.logo,
        members_count: targetWorkspace._count.members,
        channels_count: targetWorkspace._count.channels,
        projects_count: targetWorkspace._count.projects,
        preview_channels: publicChannels.map((c) => c.name),
      },
      invitation: {
        code: cleanCode,
        role: assignedRole,
        expires_at: invitation?.expires_at?.toISOString() || null,
        inviter: invitation?.inviter || null,
      },
    });
  } catch (err) {
    console.error("GET /api/workspaces/validate-invite/:code error:", err);
    res.status(500).json({ error: "Failed to validate invite code." });
  }
});

/**
 * POST /api/workspaces/join
 * Join a workspace via invite code (supports direct code and WorkspaceInvitation)
 */
router.post("/api/workspaces/join", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { invite_code } = req.body;

    if (!invite_code || typeof invite_code !== "string") {
      res.status(400).json({ error: "Valid invite code is required." });
      return;
    }

    const cleanCode = invite_code.trim().toUpperCase();

    // 1. Check invitation records
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { invite_code: cleanCode },
      include: { workspace: true },
    });

    let workspace: any = null;
    let targetRole = "MEMBER";
    let inviterId: string | null = null;

    if (invitation) {
      workspace = invitation.workspace;
      targetRole = invitation.role || "MEMBER";
      inviterId = invitation.invited_by;

      if (invitation.status === "REVOKED") {
        res.status(410).json({ error: "This invitation is no longer active." });
        return;
      }

      if (
        invitation.status === "EXPIRED" ||
        (invitation.expires_at && new Date(invitation.expires_at) < new Date())
      ) {
        await prisma.workspaceInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
        res.status(410).json({ error: "This invitation has expired. Ask an administrator for a new invitation." });
        return;
      }

      if (invitation.invited_user_id && invitation.invited_user_id !== userId) {
        res.status(403).json({ error: "This invitation was intended for a different user." });
        return;
      }
    } else {
      // 2. Check direct workspace invite code
      workspace = await prisma.workspace.findFirst({
        where: {
          OR: [
            { invite_code: cleanCode },
            { invite_code: cleanCode.toLowerCase() },
          ],
        },
      });
    }

    if (!workspace) {
      res.status(404).json({
        error: "Invite code isn't valid. Possible reasons: Incorrect code, expired invitation, invitation revoked, or workspace unavailable.",
      });
      return;
    }

    // Check existing member status
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspace.id,
          user_id: userId,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === "ACTIVE") {
        res.status(200).json({
          message: "You are already an active member of this workspace.",
          alreadyMember: true,
          workspace: {
            ...workspace,
            role: existingMember.role,
            status: existingMember.status,
          },
        });
        return;
      }

      if (existingMember.status === "SUSPENDED") {
        res.status(403).json({
          error: "Your membership in this workspace is currently suspended. Please contact a workspace administrator.",
        });
        return;
      }

      if (existingMember.status === "REMOVED") {
        // Reactivate membership
        await prisma.workspaceMember.update({
          where: {
            workspace_id_user_id: {
              workspace_id: workspace.id,
              user_id: userId,
            },
          },
          data: {
            status: "ACTIVE",
            role: targetRole,
            joined_at: new Date(),
            removal_reason: null,
            suspended_at: null,
            joined_by: inviterId,
          },
        });
      }
    } else {
      // Create fresh membership
      await prisma.workspaceMember.create({
        data: {
          workspace_id: workspace.id,
          user_id: userId,
          role: targetRole,
          status: "ACTIVE",
          department: "General",
          joined_by: inviterId,
        },
      });
    }

    // If invitation record was user-targeted, mark accepted
    if (invitation && invitation.invited_user_id) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          accepted_at: new Date(),
          accepted_by: userId,
        },
      });
    }

    // Automatically join all public channels in this workspace
    const publicChannels = await prisma.conversation.findMany({
      where: {
        workspace_id: workspace.id,
        is_public: true,
      },
    });

    for (const channel of publicChannels) {
      const existingConvMember = await prisma.conversationMember.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: channel.id,
            user_id: userId,
          },
        },
      });

      if (!existingConvMember) {
        await prisma.conversationMember.create({
          data: {
            conversation_id: channel.id,
            user_id: userId,
            role: "member",
            is_accepted: true,
          },
        });
      }
    }

    await recordAuditLog(
      workspace.id,
      userId,
      req.user!.username,
      "MEMBER_JOINED",
      userId,
      req.user!.username,
      `Joined workspace via invite code [${cleanCode}] as ${targetRole}`
    );

    await recordActivity(
      workspace.id,
      userId,
      req.user!.username,
      "joined_workspace",
      "member",
      req.user!.username,
      `New member joined via invite code as ${targetRole}`
    );

    broadcastWorkspaceEvent(workspace.id, "member_joined", {
      user_id: userId,
      username: req.user!.username,
      role: targetRole,
    });

    res.status(200).json({
      message: "Successfully joined workspace.",
      workspace: {
        ...workspace,
        role: targetRole,
        status: "ACTIVE",
      },
    });
  } catch (err) {
    console.error("POST /api/workspaces/join error:", err);
    res.status(500).json({ error: "Failed to join workspace." });
  }
});

/**
 * POST /api/workspaces/:id/regenerate-invite
 * Regenerate workspace primary invite code
 */
router.post("/api/workspaces/:id/regenerate-invite", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const role = await getMemberRole(id, userId);
    if (!role || !hasPermission(role, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      res.status(404).json({ error: "Workspace not found." });
      return;
    }

    const prefix = workspace.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "WS";
    const newCode = generateSecureInviteCode(prefix);

    const updated = await prisma.workspace.update({
      where: { id },
      data: { invite_code: newCode },
    });

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "INVITE_REGENERATED",
      id,
      newCode,
      `Workspace primary invite code regenerated: ${newCode}`
    );

    broadcastWorkspaceEvent(id, "invite_code_regenerated", {
      invite_code: newCode,
    });

    res.json({ invite_code: updated.invite_code });
  } catch (err) {
    console.error("POST /api/workspaces/:id/regenerate-invite error:", err);
    res.status(500).json({ error: "Failed to regenerate invite code." });
  }
});

/**
 * POST /api/workspaces/:id/invitations/link
 * Generate a configurable invitation link (with role and expiration)
 */
router.post("/api/workspaces/:id/invitations/link", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { role = "MEMBER", expiresInDays = 7 } = req.body;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required to create invite links." });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      res.status(404).json({ error: "Workspace not found." });
      return;
    }

    const prefix = workspace.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "WS";
    const inviteCode = generateSecureInviteCode(prefix);

    let expiresAt: Date | null = null;
    if (expiresInDays && typeof expiresInDays === "number" && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspace_id: id,
        invite_code: inviteCode,
        role: (role || "MEMBER").toUpperCase(),
        status: "PENDING",
        invited_by: userId,
        expires_at: expiresAt,
      },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
          },
        },
      },
    });

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "INVITE_LINK_CREATED",
      invitation.id,
      inviteCode,
      `Invite link created with role ${role.toUpperCase()}`
    );

    res.status(201).json({ invitation });
  } catch (err) {
    console.error("POST /api/workspaces/:id/invitations/link error:", err);
    res.status(500).json({ error: "Failed to create invitation link." });
  }
});

/**
 * POST /api/workspaces/:id/invitations/batch
 * Batch invite members by username or email
 */
router.post("/api/workspaces/:id/invitations/batch", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { targets = [], role = "MEMBER" } = req.body;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required to send invitations." });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      res.status(404).json({ error: "Workspace not found." });
      return;
    }

    const cleanTargets = (Array.isArray(targets) ? targets : [])
      .map((t: string) => t.trim())
      .filter(Boolean);

    if (cleanTargets.length === 0) {
      res.status(400).json({ error: "Please provide at least one username or email to invite." });
      return;
    }

    const prefix = workspace.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "WS";
    const created: any[] = [];
    const skipped: string[] = [];

    for (const rawTarget of cleanTargets) {
      const isEmail = rawTarget.includes("@") && rawTarget.includes(".");
      const cleanUsername = rawTarget.replace(/^@/, "").toLowerCase();

      // Look up user in database if username provided
      const user = !isEmail
        ? await prisma.user.findFirst({
            where: { username: cleanUsername },
          })
        : null;

      if (user) {
        const existingMember = await prisma.workspaceMember.findUnique({
          where: {
            workspace_id_user_id: {
              workspace_id: id,
              user_id: user.id,
            },
          },
        });

        if (existingMember && existingMember.status === "ACTIVE") {
          skipped.push(`@${user.username} is already an active member`);
          continue;
        }

        const inviteCode = generateSecureInviteCode(prefix);
        const inv = await prisma.workspaceInvitation.create({
          data: {
            workspace_id: id,
            invite_code: inviteCode,
            role: (role || "MEMBER").toUpperCase(),
            status: "PENDING",
            invited_by: userId,
            invited_user_id: user.id,
            invited_email: `@${user.username}`,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
          include: {
            inviter: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar: true,
              },
            },
          },
        });

        await createNotification(
          user.id,
          `Workspace Invitation: ${workspace.name}`,
          `${req.user!.username} invited you to join ${workspace.name} as ${role.toUpperCase()}.`,
          "workspace_invite",
          `/join/${inviteCode}`
        );

        created.push(inv);
      } else {
        // Email or external handle invitation
        const inviteCode = generateSecureInviteCode(prefix);
        const inv = await prisma.workspaceInvitation.create({
          data: {
            workspace_id: id,
            invite_code: inviteCode,
            role: (role || "MEMBER").toUpperCase(),
            status: "PENDING",
            invited_by: userId,
            invited_email: rawTarget,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          include: {
            inviter: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar: true,
              },
            },
          },
        });
        created.push(inv);
      }
    }

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "MEMBER_INVITED",
      null,
      `${created.length} invited`,
      `Sent ${created.length} invitations (role: ${role.toUpperCase()})`
    );

    res.status(201).json({
      success: true,
      sentCount: created.length,
      invitations: created,
      skipped,
    });
  } catch (err) {
    console.error("POST /api/workspaces/:id/invitations/batch error:", err);
    res.status(500).json({ error: "Failed to send batch invitations." });
  }
});

/**
 * GET /api/workspaces/:id/invitations
 * List all invitations for a workspace
 */
router.get("/api/workspaces/:id/invitations", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    // Auto mark expired invitations
    await prisma.workspaceInvitation.updateMany({
      where: {
        workspace_id: id,
        status: "PENDING",
        expires_at: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspace_id: id },
      orderBy: { created_at: "desc" },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
          },
        },
      },
    });

    res.json({ invitations });
  } catch (err) {
    console.error("GET /api/workspaces/:id/invitations error:", err);
    res.status(500).json({ error: "Failed to load invitations." });
  }
});

/**
 * POST /api/workspaces/:id/invitations/:invitationId/revoke
 * Revoke an active invitation
 */
router.post("/api/workspaces/:id/invitations/:invitationId/revoke", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id, invitationId } = req.params;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.workspace_id !== id) {
      res.status(404).json({ error: "Invitation not found." });
      return;
    }

    const updated = await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "INVITE_REVOKED",
      invitationId,
      invitation.invite_code,
      `Revoked invitation code ${invitation.invite_code}`
    );

    res.json({ success: true, invitation: updated });
  } catch (err) {
    console.error("POST revoke invitation error:", err);
    res.status(500).json({ error: "Failed to revoke invitation." });
  }
});

/**
 * POST /api/workspaces/:id/invitations/:invitationId/resend
 * Resend invitation notification
 */
router.post("/api/workspaces/:id/invitations/:invitationId/resend", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id, invitationId } = req.params;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
      include: { workspace: true },
    });

    if (!invitation || invitation.workspace_id !== id) {
      res.status(404).json({ error: "Invitation not found." });
      return;
    }

    if (invitation.invited_user_id) {
      await createNotification(
        invitation.invited_user_id,
        `Workspace Invitation: ${invitation.workspace.name}`,
        `Reminder: You were invited to join ${invitation.workspace.name} as ${invitation.role}.`,
        "workspace_invite",
        `/join/${invitation.invite_code}`
      );
    }

    res.json({ success: true, message: "Invitation reminder resent." });
  } catch (err) {
    console.error("POST resend invitation error:", err);
    res.status(500).json({ error: "Failed to resend invitation." });
  }
});

/**
 * GET /api/workspaces/:id/members
 * List all members of a workspace (filters soft-removed by default)
 */
router.get("/api/workspaces/:id/members", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const includeRemoved = req.query.includeRemoved === "true";

    const role = await getMemberRole(id, userId);
    if (!role) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspace_id: id,
        ...(includeRemoved ? {} : { status: { not: "REMOVED" } }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
            bio: true,
            role: true,
            is_suspended: true,
            job_title: true,
            department: true,
            status_message: true,
            created_at: true,
          },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    res.json({
      members: members.map((m: any) => ({
        id: `${m.workspace_id}_${m.user_id}`,
        workspace_id: m.workspace_id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        department: m.department,
        joined_at: m.joined_at.toISOString(),
        joined_by: m.joined_by,
        suspended_at: m.suspended_at?.toISOString() || null,
        removal_reason: m.removal_reason || null,
        user: {
          ...m.user,
          created_at: m.user.created_at.toISOString(),
        },
      })),
    });
  } catch (err) {
    console.error("GET /api/workspaces/:id/members error:", err);
    res.status(500).json({ error: "Failed to load workspace members." });
  }
});

/**
 * POST /api/workspaces/:id/members
 * Add member to workspace by username
 */
router.post("/api/workspaces/:id/members", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { username, role = "MEMBER", department } = req.body;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required to add members." });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: username?.trim().toLowerCase().replace(/^@/, "") },
    });

    if (!targetUser) {
      res.status(404).json({ error: `User '@${username}' not found.` });
      return;
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUser.id,
        },
      },
    });

    let memberRecord: any;

    if (existing) {
      if (existing.status === "ACTIVE") {
        res.status(400).json({ error: "User is already an active member of this workspace." });
        return;
      }

      // Reactivate soft-removed member
      memberRecord = await prisma.workspaceMember.update({
        where: {
          workspace_id_user_id: {
            workspace_id: id,
            user_id: targetUser.id,
          },
        },
        data: {
          status: "ACTIVE",
          role: role.toUpperCase(),
          department: department || existing.department || "General",
          joined_at: new Date(),
          removal_reason: null,
          suspended_at: null,
          joined_by: userId,
        },
        include: { user: true },
      });
    } else {
      memberRecord = await prisma.workspaceMember.create({
        data: {
          workspace_id: id,
          user_id: targetUser.id,
          role: role.toUpperCase(),
          status: "ACTIVE",
          department: department || "General",
          joined_by: userId,
        },
        include: { user: true },
      });
    }

    // Automatically join all public channels in this workspace
    const publicChannels = await prisma.conversation.findMany({
      where: { workspace_id: id, is_public: true },
    });
    for (const channel of publicChannels) {
      const existingConvMember = await prisma.conversationMember.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: channel.id,
            user_id: targetUser.id,
          },
        },
      });
      if (!existingConvMember) {
        await prisma.conversationMember.create({
          data: {
            conversation_id: channel.id,
            user_id: targetUser.id,
            role: "member",
            is_accepted: true,
          },
        });
      }
    }

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "MEMBER_ADDED",
      targetUser.id,
      targetUser.display_name,
      `Added directly as ${role.toUpperCase()}`
    );

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "added_member",
      "member",
      targetUser.display_name,
      `Added directly as ${role.toUpperCase()}`
    );

    await createNotification(
      targetUser.id,
      "Workspace Access Granted",
      `You were added to the workspace.`,
      "invitation",
      `/workspace/${id}`
    );

    broadcastWorkspaceEvent(id, "member_added", {
      user_id: targetUser.id,
      role: role.toUpperCase(),
    });

    res.status(201).json({ member: memberRecord });
  } catch (err) {
    console.error("POST /api/workspaces/:id/members error:", err);
    res.status(500).json({ error: "Failed to add member." });
  }
});

/**
 * PATCH /api/workspaces/:id/members/:targetUserId
 * Update a member's role or department
 */
router.patch("/api/workspaces/:id/members/:targetUserId", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id, targetUserId } = req.params;
    const { role, department } = req.body;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!targetMember || targetMember.status === "REMOVED") {
      res.status(404).json({ error: "Member not found in workspace." });
      return;
    }

    // Protect Owner role from being changed without ownership transfer
    if (targetMember.role.toUpperCase() === "OWNER" && role && role.toUpperCase() !== "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspace_id: id, role: { in: ["owner", "OWNER"] }, status: "ACTIVE" },
      });
      if (ownerCount <= 1) {
        res.status(400).json({ error: "Cannot change the role of the only workspace owner. Transfer ownership first." });
        return;
      }
    }

    const oldRole = targetMember.role;
    const updated = await prisma.workspaceMember.update({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      data: {
        ...(role && { role: role.toUpperCase() }),
        ...(department !== undefined && { department }),
      },
      include: { user: true },
    });

    if (role && role.toUpperCase() !== oldRole.toUpperCase()) {
      await recordAuditLog(
        id,
        userId,
        req.user!.username,
        "ROLE_CHANGED",
        targetUserId,
        targetMember.user.display_name,
        `Role changed from ${oldRole} to ${role.toUpperCase()}`
      );

      await recordActivity(
        id,
        userId,
        req.user!.username,
        "updated_role",
        "member",
        targetMember.user.display_name,
        `Role updated to ${role.toUpperCase()}`
      );

      await createNotification(
        targetUserId,
        "Workspace Role Updated",
        `Your role in the workspace was updated to ${role.toUpperCase()}.`,
        "role_change",
        `/workspace/${id}`
      );

      broadcastWorkspaceEvent(id, "member_role_changed", {
        user_id: targetUserId,
        old_role: oldRole,
        new_role: role.toUpperCase(),
      });
    }

    res.json({ member: updated });
  } catch (err) {
    console.error("PATCH member error:", err);
    res.status(500).json({ error: "Failed to update member." });
  }
});

/**
 * DELETE /api/workspaces/:id/members/:targetUserId
 * Remove member or leave workspace (soft removal)
 */
router.delete("/api/workspaces/:id/members/:targetUserId", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id, targetUserId } = req.params;
    const { reason } = req.body || {};

    const isSelf = userId === targetUserId;
    const myRole = await getMemberRole(id, userId);

    if (!isSelf && (!myRole || !hasPermission(myRole, "admin"))) {
      res.status(403).json({ error: "Admin permissions required to remove members." });
      return;
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!targetMember || targetMember.status === "REMOVED") {
      res.status(404).json({ error: "Member not found in workspace." });
      return;
    }

    // Owner protection: cannot remove or leave if last owner
    if (targetMember.role.toUpperCase() === "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: {
          workspace_id: id,
          role: { in: ["owner", "OWNER"] },
          status: "ACTIVE",
        },
      });
      if (ownerCount <= 1) {
        res.status(400).json({
          error: isSelf
            ? "You are the only owner of this workspace. Please transfer ownership to another member before leaving."
            : "Cannot remove the only workspace owner. Transfer ownership first.",
        });
        return;
      }
    }

    // Soft removal: set status = 'REMOVED', record reason
    await prisma.workspaceMember.update({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      data: {
        status: "REMOVED",
        removal_reason: reason || (isSelf ? "Voluntarily left workspace" : "Removed by administrator"),
      },
    });

    // Remove user from private workspace channels
    const privateChannels = await prisma.conversation.findMany({
      where: { workspace_id: id, is_public: false },
      select: { id: true },
    });
    for (const ch of privateChannels) {
      await prisma.conversationMember.deleteMany({
        where: { conversation_id: ch.id, user_id: targetUserId },
      });
    }

    const action = isSelf ? "MEMBER_LEFT" : "MEMBER_REMOVED";
    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      action,
      targetUserId,
      targetMember.user.display_name,
      reason || (isSelf ? "Voluntarily left workspace" : "Removed by admin")
    );

    await recordActivity(
      id,
      userId,
      req.user!.username,
      isSelf ? "left_workspace" : "removed_member",
      "member",
      targetMember.user.display_name,
      isSelf ? "Member left workspace" : (reason ? `Removed: ${reason}` : "Member removed by admin")
    );

    broadcastWorkspaceEvent(id, "member_removed", {
      user_id: targetUserId,
      removed_by: userId,
      is_self: isSelf,
    });

    res.json({
      success: true,
      message: isSelf ? "Left workspace successfully." : `${targetMember.user.display_name} has been removed.`,
    });
  } catch (err) {
    console.error("DELETE member error:", err);
    res.status(500).json({ error: "Failed to remove member." });
  }
});

/**
 * POST /api/workspaces/:id/members/:targetUserId/suspend
 * Suspend a member's access to the workspace
 */
router.post("/api/workspaces/:id/members/:targetUserId/suspend", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id, targetUserId } = req.params;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    if (userId === targetUserId) {
      res.status(400).json({ error: "You cannot suspend your own access." });
      return;
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!targetMember || targetMember.status === "REMOVED") {
      res.status(404).json({ error: "Member not found." });
      return;
    }

    if (targetMember.role.toUpperCase() === "OWNER") {
      res.status(400).json({ error: "Cannot suspend a workspace owner." });
      return;
    }

    const updated = await prisma.workspaceMember.update({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      data: {
        status: "SUSPENDED",
        suspended_at: new Date(),
      },
      include: { user: true },
    });

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "MEMBER_SUSPENDED",
      targetUserId,
      targetMember.user.display_name,
      "Member access suspended"
    );

    broadcastWorkspaceEvent(id, "member_suspended", {
      user_id: targetUserId,
      status: "SUSPENDED",
    });

    res.json({ member: updated, message: "Member access suspended." });
  } catch (err) {
    console.error("POST suspend member error:", err);
    res.status(500).json({ error: "Failed to suspend member." });
  }
});

/**
 * POST /api/workspaces/:id/members/:targetUserId/restore
 * Restore a suspended member's active access
 */
router.post("/api/workspaces/:id/members/:targetUserId/restore", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id, targetUserId } = req.params;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!targetMember) {
      res.status(404).json({ error: "Member not found." });
      return;
    }

    const updated = await prisma.workspaceMember.update({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: targetUserId,
        },
      },
      data: {
        status: "ACTIVE",
        suspended_at: null,
        removal_reason: null,
      },
      include: { user: true },
    });

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "MEMBER_RESTORED",
      targetUserId,
      targetMember.user.display_name,
      "Member access restored"
    );

    broadcastWorkspaceEvent(id, "member_restored", {
      user_id: targetUserId,
      status: "ACTIVE",
    });

    res.json({ member: updated, message: "Member access restored." });
  } catch (err) {
    console.error("POST restore member error:", err);
    res.status(500).json({ error: "Failed to restore member." });
  }
});

/**
 * POST /api/workspaces/:id/transfer-ownership
 * Transfer primary workspace ownership to another active member
 */
router.post("/api/workspaces/:id/transfer-ownership", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { new_owner_id } = req.body;

    const myRole = await getMemberRole(id, userId);
    if (myRole?.toUpperCase() !== "OWNER") {
      res.status(403).json({ error: "Only the current workspace owner can transfer ownership." });
      return;
    }

    if (!new_owner_id || new_owner_id === userId) {
      res.status(400).json({ error: "Please specify an eligible member to receive ownership." });
      return;
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: id,
          user_id: new_owner_id,
        },
      },
      include: { user: true },
    });

    if (!targetMember || targetMember.status !== "ACTIVE") {
      res.status(400).json({ error: "Target member must be an active workspace member." });
      return;
    }

    // Demote current owner to ADMIN, promote target to OWNER, update workspace.owner_id
    await prisma.$transaction([
      prisma.workspaceMember.update({
        where: {
          workspace_id_user_id: {
            workspace_id: id,
            user_id: userId,
          },
        },
        data: { role: "ADMIN" },
      }),
      prisma.workspaceMember.update({
        where: {
          workspace_id_user_id: {
            workspace_id: id,
            user_id: new_owner_id,
          },
        },
        data: { role: "OWNER" },
      }),
      prisma.workspace.update({
        where: { id },
        data: { owner_id: new_owner_id },
      }),
    ]);

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "OWNERSHIP_TRANSFERRED",
      new_owner_id,
      targetMember.user.display_name,
      `Ownership transferred to ${targetMember.user.display_name}`
    );

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "transferred_ownership",
      "workspace",
      targetMember.user.display_name,
      `Ownership transferred to ${targetMember.user.display_name}`
    );

    broadcastWorkspaceEvent(id, "ownership_transferred", {
      old_owner_id: userId,
      new_owner_id,
    });

    res.json({ success: true, message: `Ownership transferred to ${targetMember.user.display_name}.` });
  } catch (err) {
    console.error("POST transfer ownership error:", err);
    res.status(500).json({ error: "Failed to transfer ownership." });
  }
});

/**
 * POST /api/workspaces/:id/members/bulk-remove
 * Bulk remove selected members (soft removal, skips owners)
 */
router.post("/api/workspaces/:id/members/bulk-remove", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { user_ids = [], reason } = req.body;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    const safeUserIds = user_ids.filter((uid: string) => uid !== userId);
    if (safeUserIds.length === 0) {
      res.status(400).json({ error: "No eligible members selected for removal." });
      return;
    }

    // Exclude owners
    const ownerMembers = await prisma.workspaceMember.findMany({
      where: {
        workspace_id: id,
        user_id: { in: safeUserIds },
        role: { in: ["owner", "OWNER"] },
      },
      select: { user_id: true },
    });
    const ownerIds = ownerMembers.map((m) => m.user_id);
    const eligibleIds = safeUserIds.filter((uid: string) => !ownerIds.includes(uid));

    if (eligibleIds.length === 0) {
      res.status(400).json({ error: "Selected members are owners and cannot be removed." });
      return;
    }

    await prisma.workspaceMember.updateMany({
      where: {
        workspace_id: id,
        user_id: { in: eligibleIds },
      },
      data: {
        status: "REMOVED",
        removal_reason: reason || "Bulk removed by administrator",
      },
    });

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "MEMBER_REMOVED",
      null,
      `${eligibleIds.length} members`,
      `Bulk removed ${eligibleIds.length} members`
    );

    broadcastWorkspaceEvent(id, "members_bulk_removed", {
      user_ids: eligibleIds,
    });

    res.json({ success: true, removedCount: eligibleIds.length });
  } catch (err) {
    console.error("POST bulk-remove error:", err);
    res.status(500).json({ error: "Failed to perform bulk remove." });
  }
});

/**
 * POST /api/workspaces/:id/members/bulk-role
 * Bulk update role for selected members (skips owners)
 */
router.post("/api/workspaces/:id/members/bulk-role", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { user_ids = [], role } = req.body;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    if (!role || role.toUpperCase() === "OWNER") {
      res.status(400).json({ error: "Invalid role for bulk update." });
      return;
    }

    const safeUserIds = user_ids.filter((uid: string) => uid !== userId);

    await prisma.workspaceMember.updateMany({
      where: {
        workspace_id: id,
        user_id: { in: safeUserIds },
        role: { notIn: ["owner", "OWNER"] },
        status: "ACTIVE",
      },
      data: {
        role: role.toUpperCase(),
      },
    });

    await recordAuditLog(
      id,
      userId,
      req.user!.username,
      "ROLE_CHANGED",
      null,
      `${safeUserIds.length} members`,
      `Bulk updated role to ${role.toUpperCase()}`
    );

    broadcastWorkspaceEvent(id, "members_bulk_role_updated", {
      user_ids: safeUserIds,
      new_role: role.toUpperCase(),
    });

    res.json({ success: true, updatedCount: safeUserIds.length });
  } catch (err) {
    console.error("POST bulk-role error:", err);
    res.status(500).json({ error: "Failed to perform bulk role update." });
  }
});

/**
 * GET /api/workspaces/:id/audit-logs
 * List audit logs for administrators
 */
router.get("/api/workspaces/:id/audit-logs", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const myRole = await getMemberRole(id, userId);
    if (!myRole || !hasPermission(myRole, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    const logs = await prisma.workspaceAuditLog.findMany({
      where: { workspace_id: id },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    res.json({ logs });
  } catch (err) {
    console.error("GET audit logs error:", err);
    res.status(500).json({ error: "Failed to load audit logs." });
  }
});

/**
 * GET /api/workspaces/:id/members/:targetUserId/work
 * Get assigned tasks and projects for a workspace member
 */
router.get("/api/workspaces/:id/members/:targetUserId/work", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id, targetUserId } = req.params;

    const myRole = await getMemberRole(id, userId);
    if (!myRole) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        workspace_id: id,
        assignee_id: targetUserId,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { due_date: "asc" },
    });

    const projectIds = Array.from(new Set(tasks.map((t) => t.project_id).filter(Boolean))) as string[];
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        workspace_id: id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        color: true,
        icon: true,
      },
    });

    res.json({ tasks, projects });
  } catch (err) {
    console.error("GET member work error:", err);
    res.status(500).json({ error: "Failed to load member work items." });
  }
});

// ==========================================
// PROJECTS MANAGEMENT
// ==========================================

/**
 * GET /api/workspaces/:id/projects
 * List all projects with progress and task count
 */
router.get("/api/workspaces/:id/projects", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const role = await getMemberRole(id, userId);
    if (!role) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const projects = await prisma.project.findMany({
      where: { workspace_id: id },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            due_date: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const now = new Date();

    const formatted = projects.map((p: any) => {
      const total = p.tasks.length;
      const completed = p.tasks.filter((t: any) => t.status === "COMPLETED").length;
      const inProgress = p.tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
      const overdue = p.tasks.filter((t: any) => t.status !== "COMPLETED" && t.due_date && new Date(t.due_date) < now).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: p.id,
        workspace_id: p.workspace_id,
        community_id: p.community_id || null,
        name: p.name,
        description: p.description,
        color: p.color,
        icon: p.icon,
        start_date: p.start_date ? p.start_date.toISOString() : null,
        due_date: p.due_date ? p.due_date.toISOString() : null,
        priority: p.priority,
        status: p.status,
        owner_id: p.owner_id,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
        tasks_count: total,
        completed_tasks_count: completed,
        in_progress_tasks_count: inProgress,
        overdue_tasks_count: overdue,
        completion_percentage: percentage,
      };
    });

    res.json({ projects: formatted });
  } catch (err) {
    console.error("GET /api/workspaces/:id/projects error:", err);
    res.status(500).json({ error: "Failed to load projects." });
  }
});

/**
 * POST /api/workspaces/:id/projects
 * Create a new project
 */
router.post("/api/workspaces/:id/projects", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      name,
      description,
      color,
      icon,
      start_date,
      due_date,
      priority = "MEDIUM",
      status = "Active",
      community_id,
    } = req.body;

    const role = await getMemberRole(id, userId);
    if (!role || !hasPermission(role, "member")) {
      res.status(403).json({ error: "Member permissions required to create projects." });
      return;
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Project name is required." });
      return;
    }

    const project = await prisma.project.create({
      data: {
        workspace_id: id,
        community_id: community_id || null,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#3b82f6",
        icon: icon || "folder",
        start_date: start_date ? new Date(start_date) : null,
        due_date: due_date ? new Date(due_date) : null,
        priority,
        status,
        owner_id: userId,
      },
    });

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "created_project",
      "project",
      project.name,
      `Project started with priority ${priority}`
    );

    const actorDisplayName = (req.user as any)?.display_name || (req.user as any)?.displayName || req.user!.username;
    await broadcastWorkActivity({
      type: "project_created",
      entityId: project.id,
      entityTitle: project.name,
      actorId: userId,
      actorName: actorDisplayName,
      actorAvatar: (req.user as any)?.avatar || null,
      communityId: project.community_id || null,
      projectId: project.id,
      projectName: project.name,
      workspaceId: id,
    });

    res.status(201).json({
      project: {
        ...project,
        community_id: project.community_id || null,
        start_date: project.start_date ? project.start_date.toISOString() : null,
        due_date: project.due_date ? project.due_date.toISOString() : null,
        created_at: project.created_at.toISOString(),
        updated_at: project.updated_at.toISOString(),
        tasks_count: 0,
        completed_tasks_count: 0,
        completion_percentage: 0,
      },
    });
  } catch (err) {
    console.error("POST /api/workspaces/:id/projects error:", err);
    res.status(500).json({ error: "Failed to create project." });
  }
});

/**
 * PATCH /api/projects/:id
 * Update an existing project
 */
router.patch("/api/projects/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      name,
      description,
      color,
      icon,
      start_date,
      due_date,
      priority,
      status,
      community_id,
    } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: "Project not found." });
      return;
    }

    const role = await getMemberRole(project.workspace_id, userId);
    if (!role || !hasPermission(role, "member")) {
      res.status(403).json({ error: "Permission denied." });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(community_id !== undefined && { community_id: community_id || null }),
      },
    });

    await recordActivity(
      project.workspace_id,
      userId,
      req.user!.username,
      "updated_project",
      "project",
      updated.name,
      `Status: ${updated.status}`
    );

    const actorDisplayName = (req.user as any)?.display_name || (req.user as any)?.displayName || req.user!.username;
    if (status && status !== project.status) {
      await broadcastWorkActivity({
        type: "project_status_changed",
        entityId: updated.id,
        entityTitle: updated.name,
        actorId: userId,
        actorName: actorDisplayName,
        actorAvatar: (req.user as any)?.avatar || null,
        oldValue: project.status,
        newValue: status,
        communityId: updated.community_id || null,
        projectId: updated.id,
        projectName: updated.name,
        workspaceId: project.workspace_id,
      });
    }

    res.json({ project: { ...updated, community_id: updated.community_id || null } });
  } catch (err) {
    console.error("PATCH /api/projects/:id error:", err);
    res.status(500).json({ error: "Failed to update project." });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete("/api/projects/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ error: "Project not found." });
      return;
    }

    const role = await getMemberRole(project.workspace_id, userId);
    if (!role || !hasPermission(role, "manager")) {
      res.status(403).json({ error: "Manager permissions required to delete projects." });
      return;
    }

    await prisma.project.delete({ where: { id } });

    await recordActivity(
      project.workspace_id,
      userId,
      req.user!.username,
      "deleted_project",
      "project",
      project.name,
      "Project deleted"
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE project error:", err);
    res.status(500).json({ error: "Failed to delete project." });
  }
});

// ==========================================
// TASKS & KANBAN MANAGEMENT
// ==========================================

/**
 * GET /api/workspaces/:id/tasks
 * List tasks with rich filters
 */
router.get("/api/workspaces/:id/tasks", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { project_id, status, priority, assignee_id, search } = req.query;

    const role = await getMemberRole(id, userId);
    if (!role) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    const where: any = { workspace_id: id };
    if (project_id && typeof project_id === "string") where.project_id = project_id;
    if (status && typeof status === "string") where.status = status;
    if (priority && typeof priority === "string") where.priority = priority;
    if (assignee_id && typeof assignee_id === "string") where.assignee_id = assignee_id;
    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
    });

    const formatted = tasks.map((t: any) => ({
      id: t.id,
      workspace_id: t.workspace_id,
      project_id: t.project_id,
      community_id: t.community_id || null,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignee_id: t.assignee_id,
      creator_id: t.creator_id,
      due_date: t.due_date ? t.due_date.toISOString() : null,
      start_date: t.start_date ? t.start_date.toISOString() : null,
      labels: t.labels ? JSON.parse(t.labels) : [],
      subtasks: t.subtasks ? JSON.parse(t.subtasks) : [],
      dependencies: t.dependencies ? JSON.parse(t.dependencies) : [],
      order_index: t.order_index,
      source_msg: t.source_msg,
      created_at: t.created_at.toISOString(),
      updated_at: t.updated_at.toISOString(),
      assignee: t.assignee,
      creator: t.creator,
      project: t.project,
      comments_count: t._count.comments,
    }));

    res.json({ tasks: formatted });
  } catch (err) {
    console.error("GET /api/workspaces/:id/tasks error:", err);
    res.status(500).json({ error: "Failed to load tasks." });
  }
});

/**
 * POST /api/workspaces/:id/tasks
 * Create a new task (optionally linked to conversation message)
 */
router.post("/api/workspaces/:id/tasks", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      title,
      description,
      project_id,
      community_id,
      status = "TODO",
      priority = "MEDIUM",
      assignee_id,
      due_date,
      start_date,
      labels = [],
      subtasks = [],
      dependencies = [],
      source_msg,
    } = req.body;

    const role = await getMemberRole(id, userId);
    if (!role || !hasPermission(role, "member")) {
      res.status(403).json({ error: "Member permissions required." });
      return;
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "Task title is required." });
      return;
    }

    const task = await prisma.task.create({
      data: {
        workspace_id: id,
        project_id: project_id || null,
        community_id: community_id || null,
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        assignee_id: assignee_id || null,
        creator_id: userId,
        due_date: due_date ? new Date(due_date) : null,
        start_date: start_date ? new Date(start_date) : null,
        labels: JSON.stringify(labels || []),
        subtasks: JSON.stringify(subtasks || []),
        dependencies: JSON.stringify(dependencies || []),
        source_msg: source_msg || null,
      },
      include: {
        assignee: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
        creator: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, color: true, community_id: true },
        },
      },
    });

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "created_task",
      "task",
      task.title,
      `Assigned to ${task.assignee ? task.assignee.display_name : "Unassigned"}`
    );

    // Broadcast activity to the linked or selected community channel
    const actorDisplayName = (req.user as any)?.display_name || (req.user as any)?.displayName || req.user!.username;
    await broadcastWorkActivity({
      type: "task_created",
      entityId: task.id,
      entityTitle: task.title,
      actorId: userId,
      actorName: actorDisplayName,
      actorAvatar: (req.user as any)?.avatar || null,
      communityId: task.community_id || (task.project as any)?.community_id || null,
      projectId: task.project_id || null,
      projectName: task.project?.name || null,
      workspaceId: id,
    });

    if (assignee_id && assignee_id !== userId) {
      await createNotification(
        assignee_id,
        "New Task Assigned",
        `${req.user!.username} assigned you: "${task.title}"`,
        "task_assigned",
        `/workspace/${id}/tasks?task=${task.id}`
      );
    }

    res.status(201).json({
      task: {
        ...task,
        due_date: task.due_date ? task.due_date.toISOString() : null,
        start_date: task.start_date ? task.start_date.toISOString() : null,
        labels: task.labels ? JSON.parse(task.labels) : [],
        subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
        dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
        created_at: task.created_at.toISOString(),
        updated_at: task.updated_at.toISOString(),
        comments_count: 0,
      },
    });
  } catch (err) {
    console.error("POST /api/workspaces/:id/tasks error:", err);
    res.status(500).json({ error: "Failed to create task." });
  }
});

/**
 * PATCH /api/tasks/:id
 * Update task attributes (status, priority, assignee, subtasks, checklist, order)
 */
router.patch("/api/tasks/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignee_id,
      project_id,
      community_id,
      due_date,
      start_date,
      labels,
      subtasks,
      dependencies,
      order_index,
    } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true, project: true },
    });

    if (!existingTask) {
      res.status(404).json({ error: "Task not found." });
      return;
    }

    const role = await getMemberRole(existingTask.workspace_id, userId);
    if (!role || !hasPermission(role, "member")) {
      res.status(403).json({ error: "Permission denied." });
      return;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignee_id !== undefined && { assignee_id: assignee_id || null }),
        ...(project_id !== undefined && { project_id: project_id || null }),
        ...(community_id !== undefined && { community_id: community_id || null }),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
        ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
        ...(labels !== undefined && { labels: JSON.stringify(labels) }),
        ...(subtasks !== undefined && { subtasks: JSON.stringify(subtasks) }),
        ...(dependencies !== undefined && { dependencies: JSON.stringify(dependencies) }),
        ...(order_index !== undefined && { order_index }),
      },
      include: {
        assignee: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
        creator: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, color: true, community_id: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    const actorDisplayName = (req.user as any)?.display_name || (req.user as any)?.displayName || req.user!.username;

    // Record activity for meaningful status changes or assignments
    if (status && status !== existingTask.status) {
      await recordActivity(
        existingTask.workspace_id,
        userId,
        req.user!.username,
        status === "COMPLETED" ? "completed_task" : "status_changed",
        "task",
        updated.title,
        `Moved from ${existingTask.status} to ${status}`
      );

      // Broadcast task status update to linked community channel
      await broadcastWorkActivity({
        type: "task_status_changed",
        entityId: updated.id,
        entityTitle: updated.title,
        actorId: userId,
        actorName: actorDisplayName,
        actorAvatar: (req.user as any)?.avatar || null,
        oldValue: existingTask.status,
        newValue: status,
        communityId: updated.community_id || (updated.project as any)?.community_id || null,
        projectId: updated.project_id || null,
        projectName: updated.project?.name || null,
        workspaceId: existingTask.workspace_id,
      });

      if (status === "COMPLETED" && existingTask.creator_id !== userId) {
        await createNotification(
          existingTask.creator_id,
          "Task Completed",
          `${req.user!.username} completed "${updated.title}"`,
          "task_completed",
          `/workspace/${existingTask.workspace_id}/tasks?task=${id}`
        );
      }
    }

    if (assignee_id !== undefined && assignee_id !== existingTask.assignee_id) {
      let assigneeName = "Unassigned";
      if (assignee_id) {
        const assigneeUser = await prisma.user.findUnique({ where: { id: assignee_id } });
        assigneeName = assigneeUser?.display_name || assigneeUser?.username || "Team Member";
      }

      await broadcastWorkActivity({
        type: "task_assigned",
        entityId: updated.id,
        entityTitle: updated.title,
        actorId: userId,
        actorName: actorDisplayName,
        actorAvatar: (req.user as any)?.avatar || null,
        oldValue: existingTask.assignee?.display_name || "Unassigned",
        newValue: assigneeName,
        communityId: updated.community_id || (updated.project as any)?.community_id || null,
        projectId: updated.project_id || null,
        projectName: updated.project?.name || null,
        workspaceId: existingTask.workspace_id,
      });

      if (assignee_id && assignee_id !== userId) {
        await createNotification(
          assignee_id,
          "Task Reassigned",
          `${req.user!.username} assigned you to "${updated.title}"`,
          "task_assigned",
          `/workspace/${existingTask.workspace_id}/tasks?task=${id}`
        );
      }
    }

    res.json({
      task: {
        ...updated,
        community_id: updated.community_id || null,
        due_date: updated.due_date ? updated.due_date.toISOString() : null,
        start_date: updated.start_date ? updated.start_date.toISOString() : null,
        labels: updated.labels ? JSON.parse(updated.labels) : [],
        subtasks: updated.subtasks ? JSON.parse(updated.subtasks) : [],
        dependencies: updated.dependencies ? JSON.parse(updated.dependencies) : [],
        created_at: updated.created_at.toISOString(),
        updated_at: updated.updated_at.toISOString(),
        comments_count: updated._count.comments,
      },
    });
  } catch (err) {
    console.error("PATCH /api/tasks/:id error:", err);
    res.status(500).json({ error: "Failed to update task." });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete("/api/tasks/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ error: "Task not found." });
      return;
    }

    const role = await getMemberRole(task.workspace_id, userId);
    if (!role || !hasPermission(role, "member")) {
      res.status(403).json({ error: "Permission denied." });
      return;
    }

    await prisma.task.delete({ where: { id } });

    await recordActivity(
      task.workspace_id,
      userId,
      req.user!.username,
      "deleted_task",
      "task",
      task.title,
      "Task removed"
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE task error:", err);
    res.status(500).json({ error: "Failed to delete task." });
  }
});

/**
 * POST /api/tasks/:id/duplicate
 * Duplicate an existing task
 */
router.post("/api/tasks/:id/duplicate", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const original = await prisma.task.findUnique({ where: { id } });
    if (!original) {
      res.status(404).json({ error: "Task not found." });
      return;
    }

    const duplicate = await prisma.task.create({
      data: {
        workspace_id: original.workspace_id,
        project_id: original.project_id,
        title: `${original.title} (Copy)`,
        description: original.description,
        status: "TODO",
        priority: original.priority,
        assignee_id: original.assignee_id,
        creator_id: userId,
        due_date: original.due_date,
        labels: original.labels,
        subtasks: original.subtasks,
        dependencies: original.dependencies,
      },
      include: {
        assignee: { select: { id: true, username: true, display_name: true, avatar: true } },
        creator: { select: { id: true, username: true, display_name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    res.status(201).json({
      task: {
        ...duplicate,
        due_date: duplicate.due_date ? duplicate.due_date.toISOString() : null,
        labels: duplicate.labels ? JSON.parse(duplicate.labels) : [],
        subtasks: duplicate.subtasks ? JSON.parse(duplicate.subtasks) : [],
        dependencies: duplicate.dependencies ? JSON.parse(duplicate.dependencies) : [],
        created_at: duplicate.created_at.toISOString(),
        updated_at: duplicate.updated_at.toISOString(),
        comments_count: 0,
      },
    });
  } catch (err) {
    console.error("POST duplicate task error:", err);
    res.status(500).json({ error: "Failed to duplicate task." });
  }
});

// ==========================================
// TASK COMMENTS
// ==========================================

/**
 * GET /api/tasks/:id/comments
 * List discussion comments on a task
 */
router.get("/api/tasks/:id/comments", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const comments = await prisma.taskComment.findMany({
      where: { task_id: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    res.json({
      comments: comments.map((c: any) => ({
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at.toISOString(),
        updated_at: c.updated_at.toISOString(),
        user: c.user,
      })),
    });
  } catch (err) {
    console.error("GET task comments error:", err);
    res.status(500).json({ error: "Failed to load comments." });
  }
});

/**
 * POST /api/tasks/:id/comments
 * Add a comment to a task
 */
router.post("/api/tasks/:id/comments", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "Comment content is required." });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true, creator: true },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found." });
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        task_id: id,
        user_id: userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
      },
    });

    // Notify assignee or creator if they are not the comment author
    const targetNotif = task.assignee_id && task.assignee_id !== userId ? task.assignee_id : (task.creator_id !== userId ? task.creator_id : null);
    if (targetNotif) {
      await createNotification(
        targetNotif,
        "New Task Comment",
        `${req.user!.username} commented on "${task.title}": ${content.slice(0, 50)}...`,
        "comment",
        `/workspace/${task.workspace_id}/tasks?task=${task.id}`
      );
    }

    res.status(201).json({
      comment: {
        ...comment,
        created_at: comment.created_at.toISOString(),
        updated_at: comment.updated_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("POST task comment error:", err);
    res.status(500).json({ error: "Failed to post comment." });
  }
});

// ==========================================
// ANNOUNCEMENTS
// ==========================================

/**
 * GET /api/workspaces/:id/announcements
 * List workspace announcements
 */
router.get("/api/workspaces/:id/announcements", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const announcements = await prisma.announcement.findMany({
      where: { workspace_id: id },
      orderBy: { created_at: "desc" },
    });

    // Fetch author profiles
    const authorIds = [...new Set(announcements.map((a: any) => a.author_id))];
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, username: true, display_name: true, avatar: true },
    });
    const authorMap = new Map(authors.map((u: any) => [u.id, u]));

    res.json({
      announcements: announcements.map((a: any) => ({
        id: a.id,
        workspace_id: a.workspace_id,
        author_id: a.author_id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        expires_at: a.expires_at ? a.expires_at.toISOString() : null,
        created_at: a.created_at.toISOString(),
        author: authorMap.get(a.author_id) || null,
      })),
    });
  } catch (err) {
    console.error("GET announcements error:", err);
    res.status(500).json({ error: "Failed to load announcements." });
  }
});

/**
 * POST /api/workspaces/:id/announcements
 * Create an announcement (Admin / Manager)
 */
router.post("/api/workspaces/:id/announcements", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, content, priority = "NORMAL", expires_at } = req.body;

    const role = await getMemberRole(id, userId);
    if (!role || !hasPermission(role, "manager")) {
      res.status(403).json({ error: "Manager permissions required to post announcements." });
      return;
    }

    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required." });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        workspace_id: id,
        author_id: userId,
        title: title.trim(),
        content: content.trim(),
        priority,
        expires_at: expires_at ? new Date(expires_at) : null,
      },
    });

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "created_announcement",
      "announcement",
      announcement.title,
      `Priority: ${priority}`
    );

    res.status(201).json({
      announcement: {
        ...announcement,
        expires_at: announcement.expires_at ? announcement.expires_at.toISOString() : null,
        created_at: announcement.created_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("POST announcement error:", err);
    res.status(500).json({ error: "Failed to create announcement." });
  }
});

// ==========================================
// AUDIT & WORKSPACE ACTIVITIES
// ==========================================

/**
 * GET /api/workspaces/:id/activities
 * List recent audit/activity log
 */
router.get("/api/workspaces/:id/activities", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const activities = await prisma.workspaceActivity.findMany({
      where: { workspace_id: id },
      orderBy: { created_at: "desc" },
      take: 40,
    });

    res.json({
      activities: activities.map((a: any) => ({
        id: a.id,
        workspace_id: a.workspace_id,
        user_id: a.user_id,
        user_name: a.user_name,
        action: a.action,
        object_type: a.object_type,
        object_title: a.object_title,
        details: a.details,
        created_at: a.created_at.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET activities error:", err);
    res.status(500).json({ error: "Failed to load activities." });
  }
});

// ==========================================
// WORKSPACE MEETINGS
// ==========================================

/**
 * GET /api/workspaces/:id/meetings
 * List meetings
 */
router.get("/api/workspaces/:id/meetings", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const meetings = await prisma.meeting.findMany({
      where: { workspace_id: id },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { start_time: "asc" },
    });

    res.json({
      meetings: meetings.map((m: any) => ({
        id: m.id,
        workspace_id: m.workspace_id,
        project_id: m.project_id,
        title: m.title,
        description: m.description,
        start_time: m.start_time.toISOString(),
        end_time: m.end_time.toISOString(),
        link: m.link,
        created_by: m.created_by,
        created_at: m.created_at.toISOString(),
        project: m.project,
      })),
    });
  } catch (err) {
    console.error("GET meetings error:", err);
    res.status(500).json({ error: "Failed to load meetings." });
  }
});

/**
 * POST /api/workspaces/:id/meetings
 * Schedule a meeting
 */
router.post("/api/workspaces/:id/meetings", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, start_time, end_time, link, project_id } = req.body;

    if (!title || !start_time || !end_time) {
      res.status(400).json({ error: "Title, start time, and end time are required." });
      return;
    }

    const meeting = await prisma.meeting.create({
      data: {
        workspace_id: id,
        project_id: project_id || null,
        title: title.trim(),
        description: description?.trim() || null,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        link: link?.trim() || null,
        created_by: userId,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    });

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "scheduled_meeting",
      "meeting",
      meeting.title,
      `Scheduled for ${new Date(start_time).toLocaleDateString()}`
    );

    res.status(201).json({
      meeting: {
        ...meeting,
        start_time: meeting.start_time.toISOString(),
        end_time: meeting.end_time.toISOString(),
        created_at: meeting.created_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("POST meeting error:", err);
    res.status(500).json({ error: "Failed to schedule meeting." });
  }
});

/**
 * DELETE /api/meetings/:id
 * Cancel / delete meeting
 */
router.delete("/api/meetings/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    await prisma.meeting.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE meeting error:", err);
    res.status(500).json({ error: "Failed to delete meeting." });
  }
});

// ==========================================
// PERSONAL & WORKSPACE NOTES
// ==========================================

/**
 * GET /api/workspaces/:id/notes
 * List user's notes
 */
router.get("/api/workspaces/:id/notes", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const notes = await prisma.note.findMany({
      where: {
        workspace_id: id,
        user_id: userId,
      },
      orderBy: [{ is_pinned: "desc" }, { updated_at: "desc" }],
    });

    res.json({
      notes: notes.map((n: any) => ({
        id: n.id,
        workspace_id: n.workspace_id,
        user_id: n.user_id,
        title: n.title,
        content: n.content,
        tags: n.tags ? JSON.parse(n.tags) : [],
        is_pinned: n.is_pinned,
        is_archived: n.is_archived,
        created_at: n.created_at.toISOString(),
        updated_at: n.updated_at.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET notes error:", err);
    res.status(500).json({ error: "Failed to load notes." });
  }
});

/**
 * POST /api/workspaces/:id/notes
 * Create a new note
 */
router.post("/api/workspaces/:id/notes", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, content, tags = [], is_pinned = false } = req.body;

    if (!title && !content) {
      res.status(400).json({ error: "Note must have title or content." });
      return;
    }

    const note = await prisma.note.create({
      data: {
        workspace_id: id,
        user_id: userId,
        title: title?.trim() || "Untitled Note",
        content: content || "",
        tags: JSON.stringify(tags),
        is_pinned,
      },
    });

    res.status(201).json({
      note: {
        ...note,
        tags: note.tags ? JSON.parse(note.tags) : [],
        created_at: note.created_at.toISOString(),
        updated_at: note.updated_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("POST note error:", err);
    res.status(500).json({ error: "Failed to create note." });
  }
});

/**
 * PATCH /api/notes/:id
 * Update note
 */
router.patch("/api/notes/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, content, tags, is_pinned, is_archived } = req.body;

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.user_id !== userId) {
      res.status(403).json({ error: "Unauthorized note access." });
      return;
    }

    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(is_pinned !== undefined && { is_pinned }),
        ...(is_archived !== undefined && { is_archived }),
      },
    });

    res.json({
      note: {
        ...updated,
        tags: updated.tags ? JSON.parse(updated.tags) : [],
        created_at: updated.created_at.toISOString(),
        updated_at: updated.updated_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("PATCH note error:", err);
    res.status(500).json({ error: "Failed to update note." });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete("/api/notes/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.user_id !== userId) {
      res.status(403).json({ error: "Unauthorized note access." });
      return;
    }

    await prisma.note.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE note error:", err);
    res.status(500).json({ error: "Failed to delete note." });
  }
});

// ==========================================
// WORKSPACE FILES & DOCUMENTS
// ==========================================

/**
 * GET /api/workspaces/:id/files
 * List files
 */
router.get("/api/workspaces/:id/files", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const files = await prisma.workspaceFile.findMany({
      where: { workspace_id: id },
      orderBy: { created_at: "desc" },
    });

    const userIds = [...new Set(files.map((f: any) => f.uploaded_by))];
    const uploaders = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, display_name: true, avatar: true },
    });
    const userMap = new Map(uploaders.map((u: any) => [u.id, u]));

    res.json({
      files: files.map((f: any) => ({
        id: f.id,
        workspace_id: f.workspace_id,
        project_id: f.project_id,
        task_id: f.task_id,
        name: f.name,
        file_type: f.file_type,
        size_bytes: f.size_bytes,
        url: f.url,
        uploaded_by: f.uploaded_by,
        created_at: f.created_at.toISOString(),
        uploader: userMap.get(f.uploaded_by) || null,
      })),
    });
  } catch (err) {
    console.error("GET files error:", err);
    res.status(500).json({ error: "Failed to load files." });
  }
});

/**
 * POST /api/workspaces/:id/files
 * Upload / register workspace file
 */
router.post("/api/workspaces/:id/files", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, file_type = "document", size_bytes = 1024, url, project_id, task_id } = req.body;

    if (!name || !url) {
      res.status(400).json({ error: "File name and URL are required." });
      return;
    }

    const file = await prisma.workspaceFile.create({
      data: {
        workspace_id: id,
        project_id: project_id || null,
        task_id: task_id || null,
        name: name.trim(),
        file_type,
        size_bytes,
        url,
        uploaded_by: userId,
      },
    });

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "uploaded_file",
      "file",
      file.name,
      `${(size_bytes / 1024).toFixed(1)} KB`
    );

    res.status(201).json({
      file: {
        ...file,
        created_at: file.created_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("POST file error:", err);
    res.status(500).json({ error: "Failed to record file." });
  }
});

// ==========================================
// WORKSPACE DEPARTMENTS
// ==========================================

/**
 * GET /api/workspaces/:id/departments
 * List departments
 */
router.get("/api/workspaces/:id/departments", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const depts = await prisma.department.findMany({
      where: { workspace_id: id },
      orderBy: { name: "asc" },
    });

    // Count members per department
    const members = await prisma.workspaceMember.findMany({
      where: { workspace_id: id },
      select: { department: true },
    });

    const countMap: Record<string, number> = {};
    for (const m of members) {
      if (m.department) {
        countMap[m.department] = (countMap[m.department] || 0) + 1;
      }
    }

    res.json({
      departments: depts.map((d: any) => ({
        id: d.id,
        workspace_id: d.workspace_id,
        name: d.name,
        description: d.description,
        created_at: d.created_at.toISOString(),
        members_count: countMap[d.name] || 0,
      })),
    });
  } catch (err) {
    console.error("GET departments error:", err);
    res.status(500).json({ error: "Failed to load departments." });
  }
});

/**
 * POST /api/workspaces/:id/departments
 * Create a department
 */
router.post("/api/workspaces/:id/departments", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await getMemberRole(id, userId);
    if (!role || !hasPermission(role, "admin")) {
      res.status(403).json({ error: "Admin permissions required." });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Department name is required." });
      return;
    }

    const dept = await prisma.department.create({
      data: {
        workspace_id: id,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.status(201).json({ department: dept });
  } catch (err) {
    console.error("POST department error:", err);
    res.status(500).json({ error: "Failed to create department." });
  }
});

// ==========================================
// NOTIFICATIONS & SAVED ITEMS
// ==========================================

/**
 * GET /api/notifications
 * User's notifications
 */
router.get("/api/notifications", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    res.json({
      notifications: notifications.map((n: any) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        content: n.content,
        type: n.type,
        link: n.link,
        is_read: n.is_read,
        created_at: n.created_at.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET notifications error:", err);
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch("/api/notifications/:id/read", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH notification read error:", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
router.post("/api/notifications/read-all", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("POST read-all notifications error:", err);
    res.status(500).json({ error: "Failed to mark all as read." });
  }
});

/**
 * GET /api/saved-items
 * Get saved bookmarks
 */
router.get("/api/saved-items", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;

    const items = await prisma.savedItem.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    res.json({
      saved_items: items.map((i: any) => ({
        id: i.id,
        user_id: i.user_id,
        item_type: i.item_type,
        item_id: i.item_id,
        title: i.title,
        details: i.details,
        created_at: i.created_at.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET saved items error:", err);
    res.status(500).json({ error: "Failed to load saved items." });
  }
});

/**
 * POST /api/saved-items
 * Save a bookmark
 */
router.post("/api/saved-items", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { item_type, item_id, title, details } = req.body;

    const saved = await prisma.savedItem.create({
      data: {
        user_id: userId,
        item_type,
        item_id,
        title,
        details: details || null,
      },
    });

    res.status(201).json({ saved_item: saved });
  } catch (err) {
    console.error("POST saved item error:", err);
    res.status(500).json({ error: "Failed to save item." });
  }
});

/**
 * DELETE /api/saved-items/:id
 * Remove a saved item
 */
router.delete("/api/saved-items/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    await prisma.savedItem.deleteMany({
      where: {
        id,
        user_id: userId,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE saved item error:", err);
    res.status(500).json({ error: "Failed to remove saved item." });
  }
});

// ==========================================
// REAL DATA WORKSPACE ANALYTICS & REPORTS
// ==========================================

/**
 * GET /api/workspaces/:id/analytics
 * Real database-calculated analytics metrics
 */
router.get("/api/workspaces/:id/analytics", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const tasks = await prisma.task.findMany({
      where: { workspace_id: id },
      include: {
        assignee: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
      },
    });

    const projects = await prisma.project.findMany({
      where: { workspace_id: id },
      include: {
        tasks: {
          select: { id: true, status: true },
        },
      },
    });

    const members = await prisma.workspaceMember.findMany({
      where: { workspace_id: id },
      include: {
        user: {
          select: { id: true, username: true, display_name: true, avatar: true },
        },
      },
    });

    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
    const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
    const inReviewTasks = tasks.filter((t: any) => t.status === "IN_REVIEW").length;
    const blockedTasks = tasks.filter((t: any) => t.status === "BLOCKED").length;
    const todoTasks = tasks.filter((t: any) => t.status === "TODO").length;
    const overdueTasks = tasks.filter((t: any) => t.status !== "COMPLETED" && t.due_date && new Date(t.due_date) < now).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const priorityBreakdown = {
      URGENT: tasks.filter((t: any) => t.priority === "URGENT").length,
      HIGH: tasks.filter((t: any) => t.priority === "HIGH").length,
      MEDIUM: tasks.filter((t: any) => t.priority === "MEDIUM").length,
      LOW: tasks.filter((t: any) => t.priority === "LOW").length,
    };

    // Project progress breakdown
    const projectProgress = projects.map((p: any) => {
      const pTotal = p.tasks.length;
      const pCompleted = p.tasks.filter((t: any) => t.status === "COMPLETED").length;
      const percent = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0;
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        status: p.status,
        total: pTotal,
        completed: pCompleted,
        percentage: percent,
      };
    });

    // Team workload (active tasks per member)
    const workload = members.map((m: any) => {
      const activeTasks = tasks.filter((t: any) => t.assignee_id === m.user_id && t.status !== "COMPLETED").length;
      const doneTasks = tasks.filter((t: any) => t.assignee_id === m.user_id && t.status === "COMPLETED").length;
      return {
        user: m.user,
        role: m.role,
        department: m.department,
        active_tasks: activeTasks,
        completed_tasks: doneTasks,
      };
    }).sort((a: any, b: any) => b.active_tasks - a.active_tasks);

    res.json({
      analytics: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        in_review_tasks: inReviewTasks,
        blocked_tasks: blockedTasks,
        todo_tasks: todoTasks,
        overdue_tasks: overdueTasks,
        completion_rate: completionRate,
        priority_breakdown: priorityBreakdown,
        project_progress: projectProgress,
        team_workload: workload,
      },
    });
  } catch (err) {
    console.error("GET analytics error:", err);
    res.status(500).json({ error: "Failed to calculate analytics." });
  }
});

// ==========================================
// GLOBAL WORKSPACE SEARCH
// ==========================================

/**
 * GET /api/workspaces/:id/search
 * Global search across tasks, projects, channels, members, files, announcements
 */
router.get("/api/workspaces/:id/search", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const query = ((req.query.q as string) || "").trim();

    if (!query) {
      res.json({ results: { tasks: [], projects: [], channels: [], members: [], announcements: [], files: [] } });
      return;
    }

    const [tasks, projects, channels, members, announcements, files] = await Promise.all([
      prisma.task.findMany({
        where: {
          workspace_id: id,
          OR: [{ title: { contains: query } }, { description: { contains: query } }],
        },
        include: {
          assignee: { select: { id: true, display_name: true, username: true } },
          project: { select: { id: true, name: true, color: true } },
        },
        take: 10,
      }),
      prisma.project.findMany({
        where: {
          workspace_id: id,
          OR: [{ name: { contains: query } }, { description: { contains: query } }],
        },
        take: 10,
      }),
      prisma.conversation.findMany({
        where: {
          workspace_id: id,
          name: { contains: query },
        },
        take: 10,
      }),
      prisma.workspaceMember.findMany({
        where: {
          workspace_id: id,
          user: {
            OR: [
              { display_name: { contains: query } },
              { username: { contains: query } },
              { job_title: { contains: query } },
            ],
          },
        },
        include: {
          user: {
            select: { id: true, username: true, display_name: true, avatar: true, job_title: true, department: true },
          },
        },
        take: 10,
      }),
      prisma.announcement.findMany({
        where: {
          workspace_id: id,
          OR: [{ title: { contains: query } }, { content: { contains: query } }],
        },
        take: 10,
      }),
      prisma.workspaceFile.findMany({
        where: {
          workspace_id: id,
          name: { contains: query },
        },
        take: 10,
      }),
    ]);

    res.json({
      results: {
        tasks,
        projects,
        channels,
        members: members.map((m: any) => m.user),
        announcements,
        files,
      },
    });
  } catch (err) {
    console.error("GET search error:", err);
    res.status(500).json({ error: "Search failed." });
  }
});

// ==========================================
// WORKSPACE CHANNELS (EXTENDED COMPANY CHAT)
// ==========================================

/**
 * GET /api/workspaces/:id/channels
 * List public & user-joined company channels
 */
router.get("/api/workspaces/:id/channels", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;

    const channels = await prisma.conversation.findMany({
      where: {
        workspace_id: id,
        OR: [
          { is_public: true },
          {
            members: {
              some: { user_id: userId },
            },
          },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, display_name: true, avatar: true },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { created_at: "asc" },
    });

    res.json({
      channels: channels.map((c: any) => ({
        id: c.id,
        workspace_id: c.workspace_id,
        type: c.type,
        name: c.name,
        is_public: c.is_public,
        invite_code: c.invite_code,
        created_at: c.created_at.toISOString(),
        members: c.members.map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          user: m.user,
        })),
        messages_count: c._count.messages,
        is_member: c.members.some((m: any) => m.user_id === userId),
      })),
    });
  } catch (err) {
    console.error("GET channels error:", err);
    res.status(500).json({ error: "Failed to load channels." });
  }
});

/**
 * POST /api/workspaces/:id/channels
 * Create a new channel in the workspace
 */
router.post("/api/workspaces/:id/channels", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, is_public = true } = req.body;

    const role = await getMemberRole(id, userId);
    if (!role || !hasPermission(role, "member")) {
      res.status(403).json({ error: "Member permissions required." });
      return;
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Channel name is required." });
      return;
    }

    const cleanName = name.trim().startsWith("#") ? name.trim() : `#${name.trim()}`;
    const inviteCode = `ch-${crypto.randomBytes(4).toString("hex")}`;

    const channel = await prisma.conversation.create({
      data: {
        workspace_id: id,
        type: "group",
        name: cleanName,
        is_public,
        invite_code: inviteCode,
        members: {
          create: {
            user_id: userId,
            role: "admin",
            is_accepted: true,
          },
        },
      },
    });

    await recordActivity(
      id,
      userId,
      req.user!.username,
      "created_channel",
      "channel",
      cleanName,
      is_public ? "Public channel created" : "Private channel created"
    );

    res.status(201).json({ channel });
  } catch (err) {
    console.error("POST channel error:", err);
    res.status(500).json({ error: "Failed to create channel." });
  }
});

export default router;
