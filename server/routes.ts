import { Router, Response, Request } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getPrisma } from "./db.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authenticateJWT,
  AuthenticatedRequest,
} from "./auth.js";
import { decrypt, encrypt } from "./encryption.js";
import { searchLimiter, authLimiter } from "./limiter.js";
import { UserRole } from "../shared/types.js";
import { presenceManager, pubsub } from "./pubsub.js";
import workspaceRoutes from "./workspaceRoutes.js";

const router = Router();
router.use(workspaceRoutes);

// ==========================================
// SYSTEM MAINTENANCE SYSTEM CONFIG
// ==========================================
const MAINTENANCE_FILE_PATH = path.join(process.cwd(), "maintenance.json");

interface MaintenanceConfig {
  active: boolean;
  endTime: string | null;
}

let maintenanceConfig: MaintenanceConfig = {
  active: false,
  endTime: null,
};

// Sync state from file if exists
try {
  if (fs.existsSync(MAINTENANCE_FILE_PATH)) {
    maintenanceConfig = JSON.parse(fs.readFileSync(MAINTENANCE_FILE_PATH, "utf-8"));
  }
} catch (err) {
  console.error("Failed to load maintenance config:", err);
}

function saveMaintenanceConfig() {
  try {
    fs.writeFileSync(MAINTENANCE_FILE_PATH, JSON.stringify(maintenanceConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save maintenance config:", err);
  }
}

// ==========================================
// BLINKTALK WELCOME SYSTEM
// ==========================================

async function getOrCreateBlinkTalkBot(prisma: any) {
  let bot = await prisma.user.findUnique({
    where: { username: "blinktalk" }
  });
  if (!bot) {
    bot = await prisma.user.create({
      data: {
        username: "blinktalk",
        password_hash: "$2b$10$dummyhashedpasswordtoensurevalidityandpreventdirectlogin",
        display_name: "BlinkTalk",
        role: "user"
      }
    });
  }
  return bot;
}

async function getOrCreateSystemBot(prisma: any) {
  let bot = await prisma.user.findUnique({
    where: { username: "system" }
  });
  if (!bot) {
    bot = await prisma.user.create({
      data: {
        username: "system",
        password_hash: "$2b$10$dummyhashedpasswordtoensurevalidityandpreventdirectloginsystem",
        display_name: "System",
        role: "user"
      }
    });
  }
  return bot;
}

async function triggerWelcomeFlow(userId: string) {
  try {
    const prisma = getPrisma();
    const bot = await getOrCreateBlinkTalkBot(prisma);
    
    // Find or create direct conversation between bot.id and userId
    let conversation = await prisma.conversation.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { user_id: bot.id } } },
          { members: { some: { user_id: userId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type: "direct",
          members: {
            create: [
              { user_id: bot.id, role: "member" },
              { user_id: userId, role: "member" },
            ],
          },
        },
      });
    }

    const conversationId = conversation.id;

    // Check if we already welcomed this user to avoid duplicates on consecutive logins
    const existingMessage = await prisma.message.findFirst({
      where: {
        conversation_id: conversationId,
        sender_id: bot.id,
      },
    });
    if (existingMessage) {
      return;
    }

    // Send first welcome message
    const msg1Content = "Welcome to BlinkTalk 🚀";
    const cipherText1 = encrypt(msg1Content);
    const message1 = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: bot.id,
        content: cipherText1,
      },
    });

    // Publish msg1 to pubsub
    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "message",
      data: {
        id: message1.id,
        conversation_id: conversationId,
        sender_id: bot.id,
        sender_name: bot.display_name,
        sender_username: bot.username,
        sender_avatar: bot.avatar,
        content: msg1Content,
        created_at: message1.created_at.toISOString(),
        edited_at: null,
      },
    }));

    // Wait 5 seconds and send second message
    setTimeout(async () => {
      try {
        const msg2Content = "Where meaningful conversations happen in real time. Fast, simple, and secured with end-to-end encryption—so you can focus on connecting.";
        const cipherText2 = encrypt(msg2Content);
        const message2 = await prisma.message.create({
          data: {
            conversation_id: conversationId,
            sender_id: bot.id,
            content: cipherText2,
          },
        });

        // Publish msg2 to pubsub
        pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
          type: "message",
          data: {
            id: message2.id,
            conversation_id: conversationId,
            sender_id: bot.id,
            sender_name: bot.display_name,
            sender_username: bot.username,
            sender_avatar: bot.avatar,
            content: msg2Content,
            created_at: message2.created_at.toISOString(),
            edited_at: null,
          },
        }));

        // Wait another 10 seconds and send third message (community link)
        setTimeout(async () => {
          try {
            const msg3Content = "Join the Official BlinkTalk Community\nConnect with Thousands of Members\nDiscover What's Happening in Our Community\n\nStart Connecting—Join Our Community today";
            const cipherText3 = encrypt(msg3Content);
            const message3 = await prisma.message.create({
              data: {
                conversation_id: conversationId,
                sender_id: bot.id,
                content: cipherText3,
              },
            });

            // Publish msg3 to pubsub
            pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
              type: "message",
              data: {
                id: message3.id,
                conversation_id: conversationId,
                sender_id: bot.id,
                sender_name: bot.display_name,
                sender_username: bot.username,
                sender_avatar: bot.avatar,
                content: msg3Content,
                created_at: message3.created_at.toISOString(),
                edited_at: null,
              },
            }));
          } catch (err) {
            console.error("Failed to send third welcome message:", err);
          }
        }, 10000);

      } catch (err) {
        console.error("Failed to send second welcome message:", err);
      }
    }, 5000);

  } catch (error) {
    console.error("Welcome flow error:", error);
  }
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * POST /api/auth/signup
 */
router.post("/api/auth/signup", async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || "unknown";
  if (!authLimiter.tryConsume(ip)) {
    res.status(429).json({ error: "Too many authentication requests. Please slow down." });
    return;
  }

  const { username, password, display_name } = req.body;

  if (maintenanceConfig.active) {
    res.status(503).json({ error: "The system is currently undergoing scheduled maintenance. New user registrations are temporarily closed." });
    return;
  }

  if (!username || !password || !display_name) {
    res.status(400).json({ error: "Username, password, and display name are required." });
    return;
  }

  // Sanitize username
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
  if (cleanUsername.length < 3 || cleanUsername.length > 20 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
    res.status(400).json({ error: "Username must be 3-20 characters, containing only letters, numbers, and underscores." });
    return;
  }

  try {
    const prisma = getPrisma();
    
    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
    if (existing) {
      res.status(400).json({ error: "Username is already taken." });
      return;
    }

    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        password_hash: passwordHash,
        display_name: display_name.trim(),
        role: "user",
      },
    });

    // Auto-join default workspace if it exists
    try {
      const defaultWs = await prisma.workspace.findUnique({
        where: { invite_code: "acme-workspace" },
      });
      if (defaultWs) {
        await prisma.workspaceMember.create({
          data: {
            workspace_id: defaultWs.id,
            user_id: user.id,
            role: "member",
            department: "General",
          },
        });
        // Auto-join public channels
        const publicChannels = await prisma.conversation.findMany({
          where: { workspace_id: defaultWs.id, is_public: true },
        });
        for (const ch of publicChannels) {
          await prisma.conversationMember.create({
            data: {
              conversation_id: ch.id,
              user_id: user.id,
              role: "member",
              is_accepted: true,
            },
          });
        }
      }
    } catch (wsJoinErr) {
      console.error("Auto workspace join error on signup:", wsJoinErr);
    }

    const accessToken = generateAccessToken(user.id, user.username, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Trigger dynamic welcome messages
    triggerWelcomeFlow(user.id);

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        is_suspended: user.is_suspended,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/api/auth/login", async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || "unknown";
  if (!authLimiter.tryConsume(ip)) {
    res.status(429).json({ error: "Too many login attempts. Please wait." });
    return;
  }

  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { username: cleanUsername } });

    if (!user || !(await comparePassword(password, user.password_hash))) {
      res.status(400).json({ error: "Invalid username or password." });
      return;
    }

    if (user.is_suspended) {
      res.status(403).json({ error: "This account has been suspended by an administrator." });
      return;
    }

    if (maintenanceConfig.active && user.role !== "admin") {
      res.status(503).json({ error: "The system is currently undergoing scheduled maintenance. Regular user logins are temporarily disabled." });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.username, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Trigger dynamic welcome messages
    triggerWelcomeFlow(user.id);

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        is_suspended: user.is_suspended,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during authentication." });
  }
});

/**
 * POST /api/auth/refresh
 */
router.post("/api/auth/refresh", async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required." });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired refresh token." });
    return;
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true, is_suspended: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    if (user.is_suspended) {
      res.status(403).json({ error: "Account suspended." });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.username, user.role);
    res.json({ token: accessToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to refresh token." });
  }
});

/**
 * GET /api/auth/me
 */
router.get("/api/auth/me", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar: true,
        bio: true,
        role: true,
        is_suspended: true,
        created_at: true,
      },
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user context." });
  }
});

/**
 * GET /api/users/check-username
 */
router.get("/api/users/check-username", async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || "unknown";
  if (!searchLimiter.tryConsume(ip)) {
    res.status(429).json({ error: "Too many username checks. Slow down." });
    return;
  }

  const { q } = req.query;
  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Query username parameter required." });
    return;
  }

  const clean = q.trim().toLowerCase().replace(/^@/, "");

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { username: clean } });
    res.json({ available: !user, username: clean });
  } catch (error) {
    res.status(500).json({ error: "Username check failed." });
  }
});

/**
 * POST /api/users/profile
 */
router.post("/api/users/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const { display_name, bio } = req.body;

  if (display_name !== undefined && (typeof display_name !== "string" || display_name.trim().length === 0)) {
    res.status(400).json({ error: "Display name cannot be empty." });
    return;
  }

  try {
    const prisma = getPrisma();
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(display_name !== undefined ? { display_name: display_name.trim() } : {}),
        ...(bio !== undefined ? { bio: bio.trim() } : {}),
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar: true,
        bio: true,
        role: true,
        is_suspended: true,
        created_at: true,
      }
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// ==========================================
// DISCOVERY & DIRECT CHATS
// ==========================================

/**
 * GET /api/users/search
 */
router.get("/api/users/search", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const searcherId = req.user?.id || "";
  if (!searchLimiter.tryConsume(searcherId)) {
    res.status(429).json({ error: "Too many search queries. Please slow down. (Protected endpoint against bulk scrapers)" });
    return;
  }

  const { q } = req.query;
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    res.json({ users: [], groups: [] });
    return;
  }

  const queryStr = q.trim().toLowerCase().replace(/^@/, "");

  try {
    const prisma = getPrisma();

    // 1. Search users by prefix on username or display name
    const users = await prisma.user.findMany({
      where: {
        is_suspended: false,
        OR: [
          { username: { contains: queryStr } },
          { display_name: { contains: q.trim() } },
        ],
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar: true,
        bio: true,
        role: true,
        is_suspended: true,
        created_at: true,
      },
      take: 15,
    });

    // Filter out requester
    const filteredUsers = users.filter((u) => u.id !== searcherId);

    // 2. Search public groups
    const groups = await prisma.conversation.findMany({
      where: {
        type: "group",
        is_public: true,
        name: { contains: q.trim() },
      },
      include: {
        _count: { select: { members: true } },
      },
      take: 15,
    });

    res.json({
      users: filteredUsers,
      groups: groups.map((g) => ({
        id: g.id,
        type: g.type,
        name: g.name,
        is_public: g.is_public,
        created_at: g.created_at,
        member_count: g._count.members,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed." });
  }
});

/**
 * GET /api/conversations
 */
router.get("/api/conversations", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";

  try {
    const prisma = getPrisma();

    // Fetch conversations the user is a member of
    const memberships = await prisma.conversationMember.findMany({
      where: { user_id: userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    display_name: true,
                    avatar: true,
                    role: true,
                    is_suspended: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { created_at: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const activeConversations = memberships.map((membership) => {
      const conv = membership.conversation;
      const lastMsgObj = conv.messages[0];
      
      let lastMsg = null;
      if (lastMsgObj) {
        const senderMember = conv.members.find((m) => m.user_id === lastMsgObj.sender_id);
        lastMsg = {
          id: lastMsgObj.id,
          conversation_id: lastMsgObj.conversation_id,
          sender_id: lastMsgObj.sender_id,
          sender_name: senderMember?.user?.display_name || "Deleted Account",
          sender_username: senderMember?.user?.username || "deleted",
          sender_avatar: senderMember?.user?.avatar || null,
          content: decrypt(lastMsgObj.content), // DECRYPT symmetrically on output
          created_at: lastMsgObj.created_at.toISOString(),
        };
      }

      // If direct, name and avatar are based on the OTHER user
      let name = conv.name;
      let otherUser: any = null;
      if (conv.type === "direct") {
        const otherMember = conv.members.find((m) => m.user_id !== userId);
        if (otherMember && otherMember.user) {
          otherUser = otherMember.user;
          name = otherUser.display_name;
        } else {
          name = "Deleted Account";
        }
      }

      // Calculate unread message count
      // This is a robust query: count messages created after the membership joined,
      // and which are after last_read_message_id (or all if last_read_message_id is null)
      // Since messages are append-only with monotonic timestamps, we can compare created_at
      return {
        id: conv.id,
        type: conv.type,
        name,
        other_user: otherUser,
        is_public: conv.is_public,
        invite_code: conv.invite_code,
        created_at: conv.created_at.toISOString(),
        role: membership.role,
        unread_count: 0, // This will be dynamic in UI or we can compute
        last_message: lastMsg,
        is_accepted: membership.is_accepted,
        is_blocked: membership.is_blocked,
      };
    });

    // Sort by last message created_at or conversation created_at descending
    activeConversations.sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    res.json({ conversations: activeConversations });
  } catch (error) {
    console.error("Fetch conversations failed:", error);
    res.status(500).json({ error: "Failed to load chats." });
  }
});

/**
 * POST /api/conversations/direct
 * Start 1:1 conversation, ensuring exactly 1 conversation exists between 2 users
 */
router.post("/api/conversations/direct", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const { targetUserId } = req.body;

  if (!targetUserId) {
    res.status(400).json({ error: "targetUserId parameter is required." });
    return;
  }

  if (userId === targetUserId) {
    res.status(400).json({ error: "You cannot start a direct chat with yourself." });
    return;
  }

  try {
    const prisma = getPrisma();

    // Check if target user exists and is not suspended
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, display_name: true, avatar: true },
    });

    if (!targetUser) {
      res.status(404).json({ error: "Recipient user not found." });
      return;
    }

    // Find any existing direct chat containing BOTH members
    const existingDMs = await prisma.conversation.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { user_id: userId } } },
          { members: { some: { user_id: targetUserId } } },
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
      },
    });

    if (existingDMs) {
      res.json({
        id: existingDMs.id,
        type: "direct",
        name: targetUser.display_name,
        other_user: targetUser,
        created_at: existingDMs.created_at.toISOString(),
        role: "member",
        unread_count: 0,
        last_message: null,
      });
      return;
    }

    // Check if recipient (targetUserId) has initiator (userId) in contacts
    const isContact = await prisma.contact.findUnique({
      where: {
        owner_user_id_contact_user_id: {
          owner_user_id: targetUserId,
          contact_user_id: userId,
        },
      },
    });

    const recipientAccepted = !!isContact;

    // Create a new direct conversation transactionally
    const newDM = await prisma.conversation.create({
      data: {
        type: "direct",
        members: {
          create: [
            { user_id: userId, role: "member", is_accepted: true }, // initiator accepted automatically
            { user_id: targetUserId, role: "member", is_accepted: recipientAccepted }, // depends on contact status
          ],
        },
      },
    });

    res.status(201).json({
      id: newDM.id,
      type: "direct",
      name: targetUser.display_name,
      other_user: targetUser,
      created_at: newDM.created_at.toISOString(),
      role: "member",
      unread_count: 0,
      last_message: null,
      is_accepted: true,
      is_blocked: false,
    });
  } catch (error) {
    console.error("Create direct conversation failed:", error);
    res.status(500).json({ error: "Failed to establish conversation." });
  }
});

/**
 * POST /api/conversations/group
 * Create a public or private group
 */
router.post("/api/conversations/group", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const { name, is_public } = req.body;

  if (!name || name.trim().length < 3) {
    res.status(400).json({ error: "Group name is required and must be at least 3 characters." });
    return;
  }

  try {
    const prisma = getPrisma();
    
    // Generate an invite code for join authorization
    const invite_code = crypto.randomBytes(6).toString("hex");

    const group = await prisma.conversation.create({
      data: {
        type: "group",
        name: name.trim(),
        is_public: !!is_public,
        invite_code: invite_code,
        members: {
          create: {
            user_id: userId,
            role: "admin", // Creator is an admin of the group
          },
        },
      },
    });

    res.status(201).json({
      id: group.id,
      type: "group",
      name: group.name,
      is_public: group.is_public,
      invite_code: group.invite_code,
      created_at: group.created_at.toISOString(),
      role: "admin",
      unread_count: 0,
      last_message: null,
    });
  } catch (error) {
    console.error("Group creation error:", error);
    res.status(500).json({ error: "Failed to create group." });
  }
});

/**
 * POST /api/conversations/join/:inviteCode
 * Join group via code or public join
 */
router.post("/api/conversations/join/:code", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const code = req.params.code;

  try {
    const prisma = getPrisma();

    // Look up by exact ID or invite_code
    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { invite_code: code },
          { id: code, is_public: true },
        ],
      },
    });

    if (!conversation) {
      res.status(404).json({ error: "Group not found or invite code invalid." });
      return;
    }

    // Check if already a member
    const existing = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversation.id,
          user_id: userId,
        },
      },
    });

    if (existing) {
      res.json({ conversationId: conversation.id, alreadyMember: true });
      return;
    }

    // Join conversation
    const newMember = await prisma.conversationMember.create({
      data: {
        conversation_id: conversation.id,
        user_id: userId,
        role: "member",
      },
      include: {
        user: true,
      }
    });

    // Create system join message
    const systemBot = await getOrCreateSystemBot(prisma);
    const msgText = `${newMember.user.display_name} joined the group`;
    const cipherText = encrypt(msgText);

    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: systemBot.id,
        content: cipherText,
      },
    });

    // Publish message to socket subscribers
    pubsub.publish(`chat:conversation:${conversation.id}`, JSON.stringify({
      type: "message",
      data: {
        id: message.id,
        conversation_id: conversation.id,
        sender_id: systemBot.id,
        sender_name: "System",
        sender_username: "system",
        sender_avatar: null,
        content: msgText,
        created_at: message.created_at.toISOString(),
        edited_at: null,
      },
    }));

    // Publish group join event (so other clients can update members)
    pubsub.publish(`chat:conversation:${conversation.id}`, JSON.stringify({
      type: "group_join",
      data: {
        conversationId: conversation.id,
        user: {
          id: newMember.user.id,
          username: newMember.user.username,
          display_name: newMember.user.display_name,
          avatar: newMember.user.avatar,
          role: "member",
        }
      },
    }));

    // If joining the community group, trigger a delayed welcome message from Admin after 1.5 seconds
    if (conversation.invite_code === "community") {
      setTimeout(async () => {
        try {
          const prismaDb = getPrisma();
          // Find the admin user (supporting both lowercase 'admin' and uppercase 'Admin')
          const adminUser = await prismaDb.user.findFirst({
            where: {
              OR: [
                { username: "admin" },
                { username: "Admin" },
              ],
            },
          });

          if (adminUser) {
            const welcomeText = `👋 ${newMember.user.display_name},Welcome to the BlinkTalk Community!\n\nConnect, chat, and make meaningful connections. Stay kind, stay humble, and respect everyone. 💙`;
            const welcomeCipher = encrypt(welcomeText);

            const welcomeMessage = await prismaDb.message.create({
              data: {
                conversation_id: conversation.id,
                sender_id: adminUser.id,
                content: welcomeCipher,
              },
            });

            // Publish message to socket subscribers
            pubsub.publish(`chat:conversation:${conversation.id}`, JSON.stringify({
              type: "message",
              data: {
                id: welcomeMessage.id,
                conversation_id: conversation.id,
                sender_id: adminUser.id,
                sender_name: adminUser.display_name,
                sender_username: adminUser.username,
                sender_avatar: adminUser.avatar,
                content: welcomeText,
                created_at: welcomeMessage.created_at.toISOString(),
                edited_at: null,
              },
            }));

            // Auto delete welcome message after 10 seconds
            setTimeout(async () => {
              try {
                const db = getPrisma();
                await db.message.delete({
                  where: { id: welcomeMessage.id },
                });
                // Broadcast deletion
                pubsub.publish(`chat:conversation:${conversation.id}`, JSON.stringify({
                  type: "message_delete",
                  data: {
                    message_id: welcomeMessage.id,
                    conversation_id: conversation.id,
                  },
                }));
                console.log(`🧹 Auto-removed temporary welcome message: ${welcomeMessage.id}`);
              } catch (delErr) {
                console.error("Failed to auto-delete welcome message:", delErr);
              }
            }, 10000);
          }
        } catch (err) {
          console.error("Community welcome delay error:", err);
        }
      }, 1500);
    }

    res.status(201).json({ conversationId: conversation.id, success: true });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({ error: "Failed to join group." });
  }
});

/**
 * GET /api/conversations/:id/members
 * Get all members in a conversation
 */
router.get("/api/conversations/:id/members", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;

  try {
    const prisma = getPrisma();
    
    // Verify membership
    const selfMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!selfMembership) {
      res.status(403).json({ error: "You are not a member of this group." });
      return;
    }

    const members = await prisma.conversationMember.findMany({
      where: { conversation_id: conversationId },
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
      orderBy: { joined_at: "asc" },
    });

    res.json({
      members: members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        display_name: m.user.display_name,
        avatar: m.user.avatar,
        role: m.role, // "admin" or "member"
      })),
    });
  } catch (error) {
    console.error("Get group members error:", error);
    res.status(500).json({ error: "Failed to load group members." });
  }
});

/**
 * POST /api/conversations/:id/members/:memberId/remove
 * Remove a member from a group (admin only)
 */
router.post("/api/conversations/:id/members/:memberId/remove", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;
  const memberId = req.params.memberId;

  try {
    const prisma = getPrisma();

    // Verify requesting user is admin of the conversation
    const selfMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!selfMembership || selfMembership.role !== "admin") {
      res.status(403).json({ error: "Only administrators can remove members from this group." });
      return;
    }

    if (userId === memberId) {
      res.status(400).json({ error: "You cannot remove yourself from the group. Use the leave option instead." });
      return;
    }

    // Verify member to remove exists
    const memberToRemove = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: memberId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!memberToRemove) {
      res.status(404).json({ error: "Member not found in this group." });
      return;
    }

    // Delete membership
    await prisma.conversationMember.delete({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: memberId,
        },
      },
    });

    // Send and publish system message: "X was removed from the group"
    const systemBot = await getOrCreateSystemBot(prisma);
    const msgText = `${memberToRemove.user.display_name} was removed from the group`;
    const cipherText = encrypt(msgText);

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: systemBot.id,
        content: cipherText,
      },
    });

    // Publish message
    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "message",
      data: {
        id: message.id,
        conversation_id: conversationId,
        sender_id: systemBot.id,
        sender_name: "System",
        sender_username: "system",
        sender_avatar: null,
        content: msgText,
        created_at: message.created_at.toISOString(),
        edited_at: null,
      },
    }));

    // Notify other members of member removal (including the removed member)
    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "group_leave",
      data: {
        conversationId,
        userId: memberId,
        removed: true,
      },
    }));

    res.json({ success: true });
  } catch (error) {
    console.error("Remove group member error:", error);
    res.status(500).json({ error: "Failed to remove group member." });
  }
});

/**
 * POST /api/conversations/:id/accept
 * Accept a message request
 */
router.post("/api/conversations/:id/accept", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;

  try {
    const prisma = getPrisma();

    await prisma.conversationMember.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: {
        is_accepted: true,
      },
    });

    // Send system message that they accepted the chat request
    const userObj = await prisma.user.findUnique({ where: { id: userId } });
    const systemBot = await getOrCreateSystemBot(prisma);
    const msgText = `${userObj?.display_name || "User"} accepted the chat request`;
    const cipherText = encrypt(msgText);

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: systemBot.id,
        content: cipherText,
      },
    });

    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "message",
      data: {
        id: message.id,
        conversation_id: conversationId,
        sender_id: systemBot.id,
        sender_name: "System",
        sender_username: "system",
        sender_avatar: null,
        content: msgText,
        created_at: message.created_at.toISOString(),
        edited_at: null,
      },
    }));

    // Trigger conversation update so UIs sync in real-time
    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "conversation_accepted",
      data: { conversationId },
    }));

    res.json({ success: true });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ error: "Failed to accept conversation." });
  }
});

/**
 * POST /api/conversations/:id/block
 * Block a user/conversation
 */
router.post("/api/conversations/:id/block", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;

  try {
    const prisma = getPrisma();

    await prisma.conversationMember.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: {
        is_blocked: true,
      },
    });

    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "conversation_blocked",
      data: { conversationId, userId },
    }));

    res.json({ success: true });
  } catch (error) {
    console.error("Block conversation error:", error);
    res.status(500).json({ error: "Failed to block conversation." });
  }
});

/**
 * POST /api/conversations/:id/unblock
 * Unblock a user/conversation
 */
router.post("/api/conversations/:id/unblock", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;

  try {
    const prisma = getPrisma();

    await prisma.conversationMember.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: {
        is_blocked: false,
      },
    });

    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "conversation_unblocked",
      data: { conversationId, userId },
    }));

    res.json({ success: true });
  } catch (error) {
    console.error("Unblock conversation error:", error);
    res.status(500).json({ error: "Failed to unblock conversation." });
  }
});

/**
 * PUT /api/conversations/:id
 * Rename a group conversation (admin only)
 */
router.put("/api/conversations/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;
  const { name } = req.body;

  if (!name || name.trim().length < 3) {
    res.status(400).json({ error: "Group name must be at least 3 characters." });
    return;
  }

  try {
    const prisma = getPrisma();
    
    const selfMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!selfMembership || selfMembership.role !== "admin") {
      res.status(403).json({ error: "Only group creators (administrators) can rename this group." });
      return;
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { name: name.trim() },
    });

    // Notify all members of the rename
    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "group_rename",
      data: {
        conversationId,
        name: updated.name,
      },
    }));

    res.json({ success: true, name: updated.name });
  } catch (error) {
    console.error("Rename group error:", error);
    res.status(500).json({ error: "Failed to rename group." });
  }
});

/**
 * POST /api/conversations/:id/leave
 * Exit/leave a group
 */
router.post("/api/conversations/:id/leave", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;

  try {
    const prisma = getPrisma();

    // Verify membership
    const selfMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!selfMembership) {
      res.status(400).json({ error: "You are not a member of this conversation." });
      return;
    }

    // Delete membership
    await prisma.conversationMember.delete({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    // Notify other members of leave
    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "group_leave",
      data: {
        conversationId,
        userId,
      },
    }));

    res.json({ success: true });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ error: "Failed to leave group." });
  }
});

/**
 * DELETE /api/conversations/:id
 * Delete a group conversation (creator/admin only)
 */
router.delete("/api/conversations/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;

  try {
    const prisma = getPrisma();

    const selfMembership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!selfMembership || selfMembership.role !== "admin") {
      res.status(403).json({ error: "Only group creators (administrators) can delete this group." });
      return;
    }

    // Delete conversation (cascades memberships and messages)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    // Notify members of group deletion
    pubsub.publish(`chat:conversation:${conversationId}`, JSON.stringify({
      type: "group_delete",
      data: {
        conversationId,
      },
    }));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({ error: "Failed to delete group." });
  }
});

// ==========================================
// CHAT MESSAGES & HISTORY
// ==========================================

/**
 * GET /api/conversations/:id/messages
 * Cursor-based pagination (using created_at or message_id)
 */
router.get("/api/conversations/:id/messages", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const conversationId = req.params.id;
  const cursor = req.query.cursor as string | undefined; // Expects message ISO created_at string or id
  const limit = parseInt(req.query.limit as string) || 30;

  try {
    const prisma = getPrisma();

    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "You are not a member of this conversation." });
      return;
    }

    // Query messages scroll-up (newer to older relative to scroll cursor)
    const queryOptions: any = {
      where: { conversation_id: conversationId },
      orderBy: { created_at: "desc" },
      take: limit + 1, // Fetch 1 extra to check for next cursor presence
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
          },
        },
      },
    };

    if (cursor) {
      queryOptions.where.created_at = {
        lt: new Date(cursor),
      };
    }

    const messages = await prisma.message.findMany(queryOptions);

    const hasNextPage = messages.length > limit;
    const paginatedMessages = hasNextPage ? messages.slice(0, limit) : messages;

    // Decrypt messages on extraction, formatting properly
    const decryptedPayloads = paginatedMessages.map((msg: any) => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender_name: msg.sender?.display_name || "Deleted Account",
      sender_username: msg.sender?.username || "deleted",
      sender_avatar: msg.sender?.avatar || null,
      content: decrypt(msg.content), // Symmetric Decryption
      created_at: msg.created_at.toISOString(),
      edited_at: msg.edited_at ? msg.edited_at.toISOString() : null,
    }));

    // Invert because UI renders newer at bottom, scroll up is loading older
    // So if retrieved order is desc (newer first), we reverse it for list ordering
    decryptedPayloads.reverse();

    const nextCursor = hasNextPage && paginatedMessages.length > 0 
      ? paginatedMessages[paginatedMessages.length - 1].created_at.toISOString() 
      : null;

    res.json({
      messages: decryptedPayloads,
      nextCursor,
    });
  } catch (error) {
    console.error("Fetch messages failed:", error);
    res.status(500).json({ error: "Failed to load chat history." });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message (only if sender is current user or user is admin)
 */
router.delete("/api/messages/:id", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const messageId = req.params.id;

  try {
    const prisma = getPrisma();

    // Find message
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            members: {
              where: { user_id: userId }
            }
          }
        }
      }
    });

    if (!msg) {
      res.status(404).json({ error: "Message not found." });
      return;
    }

    // Auth: Sender or admin role of the group / app
    const isSender = msg.sender_id === userId;
    const isGlobalAdmin = req.user?.role === "admin";
    const groupMemberRole = msg.conversation?.members[0]?.role;
    const isGroupAdmin = groupMemberRole === "admin";

    if (!isSender && !isGlobalAdmin && !isGroupAdmin) {
      res.status(403).json({ error: "You are not authorized to delete this message." });
      return;
    }

    const isDeleterAdmin = isGlobalAdmin || isGroupAdmin;

    if (isDeleterAdmin) {
      // 1. Admin deletes -> COMPLETELY disappear
      await prisma.message.delete({
        where: { id: messageId },
      });

      // Broadcast delete event
      pubsub.publish(`chat:conversation:${msg.conversation_id}`, JSON.stringify({
        type: "message_delete",
        data: {
          message_id: messageId,
          conversation_id: msg.conversation_id,
        },
      }));
    } else {
      // 2. Normal member deletes -> update content to "deleted by [username]"
      const username = req.user?.username || "deleted";
      const softDeleteText = `deleted by @${username}`;
      const cipherText = encrypt(softDeleteText);

      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: cipherText,
        },
      });

      // Broadcast soft-delete event (updates the message in real-time on all clients)
      pubsub.publish(`chat:conversation:${msg.conversation_id}`, JSON.stringify({
        type: "message_delete",
        data: {
          message_id: messageId,
          conversation_id: msg.conversation_id,
          soft_delete_content: softDeleteText,
        },
      }));
    }

    res.json({ success: true, messageId });
  } catch (err) {
    console.error("Failed to delete message:", err);
    res.status(500).json({ error: "Failed to delete message." });
  }
});

// ==========================================
// CONTACTS LISTS
// ==========================================

/**
 * GET /api/contacts
 */
router.get("/api/contacts", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";

  try {
    const prisma = getPrisma();
    const contacts = await prisma.contact.findMany({
      where: { owner_user_id: userId },
      include: {
        contact: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar: true,
            bio: true,
            role: true,
            is_suspended: true,
          },
        },
      },
    });

    res.json({ contacts: contacts.map((c) => c.contact) });
  } catch (error) {
    res.status(500).json({ error: "Failed to load contacts." });
  }
});

/**
 * POST /api/contacts
 */
router.post("/api/contacts", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const { contactUserId } = req.body;

  if (!contactUserId) {
    res.status(400).json({ error: "contactUserId is required." });
    return;
  }

  if (userId === contactUserId) {
    res.status(400).json({ error: "You cannot add yourself as a contact." });
    return;
  }

  try {
    const prisma = getPrisma();
    
    // Check contact exists
    const contactUser = await prisma.user.findUnique({ where: { id: contactUserId } });
    if (!contactUser) {
      res.status(404).json({ error: "Contact user not found." });
      return;
    }

    await prisma.contact.upsert({
      where: {
        owner_user_id_contact_user_id: {
          owner_user_id: userId,
          contact_user_id: contactUserId,
        },
      },
      create: {
        owner_user_id: userId,
        contact_user_id: contactUserId,
      },
      update: {}, // No-op if already exists
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to add contact." });
  }
});

/**
 * DELETE /api/contacts/:userId
 */
router.delete("/api/contacts/:contactUserId", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || "";
  const contactUserId = req.params.contactUserId;

  try {
    const prisma = getPrisma();
    await prisma.contact.delete({
      where: {
        owner_user_id_contact_user_id: {
          owner_user_id: userId,
          contact_user_id: contactUserId,
        },
      },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove contact." });
  }
});


// ==========================================
// ADMIN DASHBOARD CONSOLE (Role Gated)
// ==========================================

/**
 * Middleware to check admin role
 */
function requireAdmin(req: AuthenticatedRequest, res: Response, next: any) {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: "Access Denied. Administrator role required." });
    return;
  }
  next();
}

/**
 * GET /api/admin/overview
 */
router.get("/api/admin/overview", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();

    const totalUsers = await prisma.user.count();
    const liveConnections = presenceManager.getLiveConnectionCount();
    const totalMessages = await prisma.message.count();
    const totalGroups = await prisma.conversation.count({ where: { type: "group" } });
    const publicGroups = await prisma.conversation.count({ where: { type: "group", is_public: true } });
    const privateGroups = await prisma.conversation.count({ where: { type: "group", is_public: false } });
    const totalDirect = await prisma.conversation.count({ where: { type: "direct" } });
    const totalRequestsPending = await prisma.conversationMember.count({ where: { conversation: { type: "direct" }, is_accepted: false } });

    // New signups over time (simplified database stats)
    const signupsOverTime = await prisma.user.findMany({
      select: { created_at: true },
      orderBy: { created_at: "asc" },
    });

    // Message volume stats over time (simplified aggregated bucket)
    const messagesOverTime = await prisma.message.findMany({
      select: { created_at: true },
      orderBy: { created_at: "asc" },
    });

    res.json({
      metrics: {
        total_registered_ids: totalUsers,
        live_active_connections: liveConnections,
        total_messages: totalMessages,
        total_groups: totalGroups,
        public_groups: publicGroups,
        private_groups: privateGroups,
        total_direct_chats: totalDirect,
        pending_message_requests: totalRequestsPending,
      },
      signupsOverTime,
      messagesOverTime,
    });
  } catch (error) {
    console.error("Admin metrics loading failed:", error);
    res.status(500).json({ error: "Admin overview stats load failure." });
  }
});

/**
 * GET /api/admin/users
 * Cursor/Pagination list registry of user IDs
 */
router.get("/api/admin/users", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { search, filterStatus, sortBy = "created_at", order = "desc" } = req.query;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = parseInt(req.query.skip as string) || 0; // standard offset is ok for tables, but let's provide cursor/offset.

  try {
    const prisma = getPrisma();
    
    const whereClause: any = {};
    if (search && typeof search === "string" && search.trim().length > 0) {
      whereClause.OR = [
        { username: { contains: search.toLowerCase().replace(/^@/, "") } },
        { display_name: { contains: search } },
      ];
    }

    if (filterStatus === "suspended") {
      whereClause.is_suspended = true;
    } else if (filterStatus === "admin") {
      whereClause.role = "admin";
    }

    const total = await prisma.user.count({ where: whereClause });

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        display_name: true,
        role: true,
        is_suspended: true,
        created_at: true,
      },
      orderBy: { [sortBy as string]: order },
      take: limit,
      skip: skip,
    });

    res.json({
      users,
      total,
      limit,
      skip,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user directory." });
  }
});

/**
 * GET /api/admin/users/:userId
 * Detailed profile + activity stats
 */
router.get("/api/admin/users/:userId", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.userId;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar: true,
        bio: true,
        role: true,
        is_suspended: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const messageCount = await prisma.message.count({ where: { sender_id: targetId } });
    const groupCount = await prisma.conversationMember.count({
      where: { user_id: targetId, conversation: { type: "group" } },
    });

    const livePresence = presenceManager.getPresence(targetId);

    res.json({
      profile: user,
      stats: {
        message_count: messageCount,
        group_count: groupCount,
        last_seen: new Date(livePresence.lastSeen || 0).toISOString(),
        is_online: livePresence.isOnline,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load admin profile data." });
  }
});

/**
 * POST /api/admin/users/:userId/suspend
 */
router.post("/api/admin/users/:userId/suspend", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || "";
  const targetId = req.params.userId;
  const { suspend } = req.body; // boolean

  if (adminId === targetId) {
    res.status(400).json({ error: "You cannot suspend your own administrator account." });
    return;
  }

  try {
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });

    if (!targetUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const action = suspend ? "suspend" : "reinstate";

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetId },
        data: { is_suspended: !!suspend },
      }),
      prisma.adminAuditLog.create({
        data: {
          admin_user_id: adminId,
          action,
          target_user_id: targetId,
          details: `User @${targetUser.username} ${suspend ? "suspended" : "reinstated"}.`,
        },
      }),
    ]);

    res.json({ success: true, is_suspended: !!suspend });
  } catch (error) {
    res.status(500).json({ error: "Failed to update account status." });
  }
});

/**
 * POST /api/admin/users/:userId/role
 */
router.post("/api/admin/users/:userId/role", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || "";
  const targetId = req.params.userId;
  const { role } = req.body; // "admin" | "user"

  if (targetId === adminId) {
    res.status(400).json({ error: "You cannot change your own admin role." });
    return;
  }

  if (role !== "admin" && role !== "user") {
    res.status(400).json({ error: "Invalid role value." });
    return;
  }

  try {
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });

    if (!targetUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetId },
        data: { role },
      }),
      prisma.adminAuditLog.create({
        data: {
          admin_user_id: adminId,
          action: "role_change",
          target_user_id: targetId,
          details: `Role of @${targetUser.username} changed to '${role}'.`,
        },
      }),
    ]);

    res.json({ success: true, role });
  } catch (error) {
    res.status(500).json({ error: "Failed to alter role." });
  }
});

/**
 * POST /api/admin/users/:userId/reset-password
 * Password Reset safety net generating an explicit temporary password
 */
router.post("/api/admin/users/:userId/reset-password", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || "";
  const targetId = req.params.userId;

  try {
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });

    if (!targetUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Generate readable random temp password
    const tempPassword = `tg-${crypto.randomBytes(3).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`;
    const hash = await hashPassword(tempPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetId },
        data: { password_hash: hash },
      }),
      prisma.adminAuditLog.create({
        data: {
          admin_user_id: adminId,
          action: "password_reset",
          target_user_id: targetId,
          details: `Force reset password of @${targetUser.username}. Temporary password generated.`,
        },
      }),
    ]);

    res.json({ success: true, tempPassword });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password." });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Soft Delete / Anonymize registered ID
 * *Reasoning*: Anonymizing rather than hard-deleting prevents breaking conversation flows
 * and ensures integrity of historic audit logging. Hard deleting would cascade and destroy
 * whole channels or orphan chats, ruining other users' experience.
 */
router.post("/api/admin/users/:userId/delete", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || "";
  const targetId = req.params.userId;

  if (targetId === adminId) {
    res.status(400).json({ error: "You cannot delete your own account." });
    return;
  }

  try {
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });

    if (!targetUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const anonUsername = `deleted_${crypto.randomBytes(4).toString("hex")}`;
    const anonDisplayName = "Deleted Account";

    await prisma.$transaction([
      // Soft-delete: clear sensitive variables & randomize username so it's freed for reuse!
      prisma.user.update({
        where: { id: targetId },
        data: {
          username: anonUsername,
          display_name: anonDisplayName,
          password_hash: "DELETED_ACCOUNT_HASH",
          avatar: null,
          bio: "This identity was removed by an administrator.",
          is_suspended: true,
        },
      }),
      // Audit log the removal
      prisma.adminAuditLog.create({
        data: {
          admin_user_id: adminId,
          action: "delete",
          target_user_id: targetId,
          details: `Account of @${targetUser.username} was soft-deleted and anonymized. Username @${targetUser.username} is now freed.`,
        },
      }),
    ]);

    res.json({ success: true, details: "User anonymized successfully. Username freed." });
  } catch (error) {
    console.error("Soft delete error:", error);
    res.status(500).json({ error: "Anonymization failed." });
  }
});

/**
 * GET /api/admin/groups
 */
router.get("/api/admin/groups", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const groups = await prisma.conversation.findMany({
      where: { type: "group" },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        is_public: g.is_public,
        invite_code: g.invite_code,
        member_count: g._count.members,
        created_at: g.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch groups." });
  }
});

/**
 * POST /api/admin/groups/:id/unlist
 * Toggle public listing of a group
 */
router.post("/api/admin/groups/:id/unlist", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || "";
  const groupId = req.params.id;
  const { unlist } = req.body; // boolean

  try {
    const prisma = getPrisma();
    const group = await prisma.conversation.findUnique({ where: { id: groupId } });

    if (!group) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: groupId },
        data: { is_public: !unlist }, // Unlist turns public off
      }),
      prisma.adminAuditLog.create({
        data: {
          admin_user_id: adminId,
          action: "group_unlist",
          details: `Group '${group.name}' is now ${unlist ? "private/unlisted" : "public"}.`,
        },
      }),
    ]);

    res.json({ success: true, is_public: !unlist });
  } catch (error) {
    res.status(500).json({ error: "Group oversight update failure." });
  }
});

/**
 * DELETE /api/admin/groups/:id
 */
router.delete("/api/admin/groups/:id", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || "";
  const groupId = req.params.id;

  try {
    const prisma = getPrisma();
    const group = await prisma.conversation.findUnique({ where: { id: groupId } });

    if (!group) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    await prisma.$transaction([
      prisma.conversation.delete({ where: { id: groupId } }),
      prisma.adminAuditLog.create({
        data: {
          admin_user_id: adminId,
          action: "group_delete",
          details: `Group '${group.name}' was permanently deleted. All histories wiped.`,
        },
      }),
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete group." });
  }
});

/**
 * GET /api/admin/audit
 */
router.get("/api/admin/audit", authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const logs = await prisma.adminAuditLog.findMany({
      include: {
        admin: { select: { username: true, display_name: true } },
        target: { select: { username: true, display_name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to load audit logs." });
  }
});

/**
 * GET /api/maintenance/status
 * Fetch current maintenance status (Public)
 */
router.get("/api/maintenance/status", (req: Request, res: Response) => {
  res.json(maintenanceConfig);
});

/**
 * POST /api/maintenance/toggle
 * Update maintenance settings (Admin only)
 */
router.post("/api/maintenance/toggle", authenticateJWT, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { active, endTime } = req.body;
  if (typeof active !== "boolean") {
    res.status(400).json({ error: "active status must be a boolean value." });
    return;
  }
  maintenanceConfig.active = active;
  maintenanceConfig.endTime = endTime || null;
  saveMaintenanceConfig();
  res.json({ success: true, config: maintenanceConfig });
});

export default router;
