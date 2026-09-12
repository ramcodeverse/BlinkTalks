import { getPrisma } from "./db.js";
import { hashPassword } from "./auth.js";
import { encrypt } from "./encryption.js";

/**
 * DEVELOPMENT ONLY database seeder.
 * Provisions initial admin user role.
 * 
 * 🚨 CRITICAL SECURITY NOTICE:
 * This contains pre-configured credentials strictly meant for local, non-exposed, development sandbox testing.
 * These credentials MUST be removed, rotated, or locked before any staging, QA, or production deployment.
 */
export async function seedDatabase(): Promise<void> {
  const prisma = getPrisma();

  try {
    // If in production, only allow seeding if the database is completely empty
    if (process.env.NODE_ENV === "production") {
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        console.warn("🚫 SEEDING SKIPPED: Database seeding requested, but blocked in production because users already exist.");
        return;
      }
      console.log("🌱 Database is empty in production. Running safe default seed...");
    }
    const adminUsername = "admin";
    let adminUser = null;

    // First check if 'admin' (lowercase) already exists
    adminUser = await prisma.user.findFirst({
      where: {
        username: "admin"
      }
    });

    // If 'admin' doesn't exist, check if 'Admin' (case-sensitive uppercase) exists and migrate it
    if (!adminUser) {
      const uppercaseAdmin = await prisma.user.findFirst({
        where: {
          username: "Admin"
        }
      });

      if (uppercaseAdmin) {
        console.log("🌱 Seeding: Migrating case-sensitive 'Admin' to lowercase 'admin'...");
        adminUser = await prisma.user.update({
          where: { id: uppercaseAdmin.id },
          data: {
            username: "admin",
            display_name: "Admin",
            role: "admin",
          }
        });
      }
    }

    // If still no Admin user exists, check if 'ram' exists so we can migrate them
    if (!adminUser) {
      const ramUser = await prisma.user.findFirst({
        where: {
          username: "ram"
        }
      });

      if (ramUser) {
        console.log("🌱 Seeding: Migrating existing 'ram' user to 'admin'...");
        adminUser = await prisma.user.update({
          where: { id: ramUser.id },
          data: {
            username: "admin",
            display_name: "Admin",
            role: "admin",
          }
        });
      }
    }

    // If still no admin user exists, create it
    if (!adminUser) {
      console.log(`🌱 Seeding: Creating local admin ID '@${adminUsername}'...`);
      
      const adminPasswordPlain = "369_5_1*";
      const secureHash = await hashPassword(adminPasswordPlain);

      adminUser = await prisma.user.create({
        data: {
          username: "admin",
          password_hash: secureHash,
          display_name: "Admin",
          role: "admin",
          bio: "Pre-configured Administrator ID for local registry governance.",
        },
      });
      console.log(`🌱 Seeding Completed: Admin ID '@${adminUsername}' generated successfully. Temporary password is '${adminPasswordPlain}'. Please rotate instantly on deployment.`);
    } else {
      // Ensure the existing Admin user has password '369_5_1*' as requested
      const adminPasswordPlain = "369_5_1*";
      const secureHash = await hashPassword(adminPasswordPlain);
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          username: "admin",
          password_hash: secureHash,
          display_name: "Admin",
          role: "admin",
        },
      });
      console.log(`✅ Admin ID '@${adminUser.username}' updated with password '${adminPasswordPlain}' in database.`);
    }

    // Now seed the BlinkTalk Community group conversation if it doesn't exist
    const communityInviteCode = "community";
    let communityGroup = await prisma.conversation.findUnique({
      where: { invite_code: communityInviteCode }
    });

    if (!communityGroup) {
      console.log("🌱 Seeding: Creating BlinkTalk Community public group...");
      communityGroup = await prisma.conversation.create({
        data: {
          type: "group",
          name: "BlinkTalk Community",
          is_public: true,
          invite_code: communityInviteCode,
          members: {
            create: [
              {
                user_id: adminUser.id,
                role: "admin",
                is_accepted: true,
              }
            ]
          }
        }
      });
      console.log("🌱 Seeding: BlinkTalk Community group seeded successfully!");
    } else {
      // Ensure adminUser is a member of the community group
      const existingMembership = await prisma.conversationMember.findUnique({
        where: {
          conversation_id_user_id: {
            conversation_id: communityGroup.id,
            user_id: adminUser.id
          }
        }
      });

      if (!existingMembership) {
        await prisma.conversationMember.create({
          data: {
            conversation_id: communityGroup.id,
            user_id: adminUser.id,
            role: "admin",
            is_accepted: true
          }
        });
      }
      console.log("✅ BlinkTalk Community public group is ready in database.");
    }

    // Seed default team members if they don't exist
    const teamMembersData = [
      { username: "ram", display_name: "Ram Kumar", job_title: "Tech Lead & Architect", department: "Engineering" },
      { username: "priya", display_name: "Priya Sharma", job_title: "Staff Product Designer", department: "Design" },
      { username: "kiran", display_name: "Kiran Patel", job_title: "Senior Full Stack Dev", department: "Engineering" },
      { username: "alex", display_name: "Alex Rivera", job_title: "Group Product Manager", department: "Product" },
    ];

    const seededUsers: Record<string, any> = { admin: adminUser };
    const defaultPasswordHash = await hashPassword("369_5_1*");

    for (const member of teamMembersData) {
      let existingUser = await prisma.user.findUnique({
        where: { username: member.username }
      });
      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            username: member.username,
            password_hash: defaultPasswordHash,
            display_name: member.display_name,
            job_title: member.job_title,
            department: member.department,
            bio: `${member.job_title} at Acme Innovations`,
            role: "user",
          }
        });
        console.log(`🌱 Seeding: Created team member @${member.username}`);
      }
      seededUsers[member.username] = existingUser;
    }

    // Seed default Company Workspace
    const defaultWorkspaceCode = "acme-workspace";
    let defaultWorkspace = await prisma.workspace.findUnique({
      where: { invite_code: defaultWorkspaceCode }
    });

    if (!defaultWorkspace) {
      console.log("🌱 Seeding: Creating default Acme Innovations company workspace...");
      defaultWorkspace = await prisma.workspace.create({
        data: {
          name: "Acme Innovations HQ",
          description: "Primary engineering, product design, and business collaboration hub.",
          category: "Technology",
          invite_code: defaultWorkspaceCode,
          owner_id: adminUser.id,
          members: {
            create: [
              { user_id: adminUser.id, role: "owner", department: "Executive" },
              { user_id: seededUsers.ram.id, role: "admin", department: "Engineering" },
              { user_id: seededUsers.alex.id, role: "manager", department: "Product" },
              { user_id: seededUsers.priya.id, role: "member", department: "Design" },
              { user_id: seededUsers.kiran.id, role: "member", department: "Engineering" },
            ]
          }
        }
      });
    }

    // Default departments
    const deptNames = ["Engineering", "Design", "Product", "Marketing", "Operations"];
    for (const d of deptNames) {
      const existingDept = await prisma.department.findFirst({
        where: { workspace_id: defaultWorkspace.id, name: d },
      });
      if (!existingDept) {
        await prisma.department.create({
          data: {
            workspace_id: defaultWorkspace.id,
            name: d,
          },
        });
      }
    }

    // Default 15 Software Development Communities
    const SEED_COMMUNITIES = [
      { name: "#general", desc: "General team communication", cat: "general", topic: "Company-wide general discussions & announcements", icon: "hash" },
      { name: "#announcements", desc: "Important company and team announcements", cat: "general", topic: "Official company updates", icon: "megaphone" },
      { name: "#engineering", desc: "Engineering discussions and development work", cat: "engineering", topic: "Core architecture & cross-functional engineering", icon: "code" },
      { name: "#frontend", desc: "Frontend development and client UI", cat: "engineering", topic: "Web UI, components & client state", icon: "layout" },
      { name: "#backend", desc: "Backend/API development and services", cat: "engineering", topic: "Server APIs, database & performance", icon: "server" },
      { name: "#mobile", desc: "Mobile application development", cat: "engineering", topic: "iOS, Android, React Native & mobile UX", icon: "smartphone" },
      { name: "#devops", desc: "Deployment, CI/CD and cloud infrastructure", cat: "engineering", topic: "Deployments, pipelines & cloud infrastructure", icon: "terminal" },
      { name: "#qa-testing", desc: "Testing, bugs, and quality assurance", cat: "engineering", topic: "E2E testing, bug reports & release quality", icon: "bug" },
      { name: "#security", desc: "Security, vulnerabilities, and security reviews", cat: "engineering", topic: "Security auditing, compliance & access controls", icon: "shield" },
      { name: "#design", desc: "UI/UX, visual styling, and design system", cat: "product", topic: "Design reviews, prototypes & UI assets", icon: "palette" },
      { name: "#product", desc: "Product requirements, roadmap, and feature discussions", cat: "product", topic: "Roadmap planning & feature specifications", icon: "compass" },
      { name: "#project-management", desc: "Planning, deadlines, and project coordination", cat: "product", topic: "Sprint planning & project milestones", icon: "calendar" },
      { name: "#support", desc: "Technical and customer support discussions", cat: "support", topic: "Incident response & customer issue triage", icon: "life-buoy" },
      { name: "#documentation", desc: "Technical documentation and knowledge sharing", cat: "general", topic: "Knowledge base, API docs & guides", icon: "book" },
      { name: "#random", desc: "Non-work conversations and team watercooler", cat: "general", topic: "Coffee chat & fun", icon: "coffee" },
    ];

    const commMap: Record<string, any> = {};
    for (const comm of SEED_COMMUNITIES) {
      let channel = await prisma.conversation.findFirst({
        where: { workspace_id: defaultWorkspace.id, name: comm.name },
      });
      if (!channel) {
        channel = await prisma.conversation.create({
          data: {
            workspace_id: defaultWorkspace.id,
            type: "group",
            name: comm.name,
            description: comm.desc,
            category: comm.cat,
            topic: comm.topic,
            icon: comm.icon,
            is_public: true,
            task_activity_enabled: true,
            project_activity_enabled: true,
            invite_code: `acme-${comm.name.replace("#", "")}`,
            members: {
              create: [
                { user_id: adminUser.id, role: "admin", is_accepted: true },
                { user_id: seededUsers.ram.id, role: "admin", is_accepted: true },
                { user_id: seededUsers.alex.id, role: "member", is_accepted: true },
                { user_id: seededUsers.priya.id, role: "member", is_accepted: true },
                { user_id: seededUsers.kiran.id, role: "member", is_accepted: true },
              ],
            },
          },
        });
      } else {
        // Ensure members exist
        for (const u of [adminUser, seededUsers.ram, seededUsers.alex, seededUsers.priya, seededUsers.kiran]) {
          const isMem = await prisma.conversationMember.findUnique({
            where: {
              conversation_id_user_id: {
                conversation_id: channel.id,
                user_id: u.id,
              },
            },
          });
          if (!isMem) {
            await prisma.conversationMember.create({
              data: {
                conversation_id: channel.id,
                user_id: u.id,
                role: u.id === adminUser.id ? "admin" : "member",
                is_accepted: true,
              },
            });
          }
        }
      }
      commMap[comm.name] = channel;
    }

    // Default Projects
    let projV2 = await prisma.project.findFirst({
      where: { workspace_id: defaultWorkspace.id, name: "BlinkTalks V2 Workspace Suite" },
    });
    if (!projV2) {
      projV2 = await prisma.project.create({
        data: {
          workspace_id: defaultWorkspace.id,
          name: "BlinkTalks V2 Workspace Suite",
          description: "Integrating Slack channels, Trello boards, and Asana tasks into one unified company OS.",
          color: "#3b82f6",
          icon: "layout",
          priority: "HIGH",
          status: "Active",
          community_id: commMap["#engineering"]?.id,
          owner_id: seededUsers.ram.id,
          start_date: new Date(Date.now() - 7 * 86400000),
          due_date: new Date(Date.now() + 14 * 86400000),
        },
      });
    }

    let projMobile = await prisma.project.findFirst({
      where: { workspace_id: defaultWorkspace.id, name: "Mobile & Responsive Overhaul" },
    });
    if (!projMobile) {
      projMobile = await prisma.project.create({
        data: {
          workspace_id: defaultWorkspace.id,
          name: "Mobile & Responsive Overhaul",
          description: "Polishing mobile touch interactions, bottom sheets, and responsive views.",
          color: "#8b5cf6",
          icon: "smartphone",
          priority: "HIGH",
          status: "Active",
          community_id: commMap["#mobile"]?.id,
          owner_id: seededUsers.priya.id,
          start_date: new Date(Date.now() - 3 * 86400000),
          due_date: new Date(Date.now() + 10 * 86400000),
        },
      });
    }

    let projSecurity = await prisma.project.findFirst({
      where: { workspace_id: defaultWorkspace.id, name: "Security & Role Governance" },
    });
    if (!projSecurity) {
      projSecurity = await prisma.project.create({
        data: {
          workspace_id: defaultWorkspace.id,
          name: "Security & Role Governance",
          description: "Workspace permissions, audit logs, and encrypted communications.",
          color: "#ef4444",
          icon: "shield-check",
          priority: "URGENT",
          status: "Active",
          community_id: commMap["#security"]?.id,
          owner_id: adminUser.id,
          start_date: new Date(Date.now() - 5 * 86400000),
          due_date: new Date(Date.now() + 5 * 86400000),
        },
      });
    }

    // Explicitly seed the core prompt example tasks
    const explicitTasks = [
      {
        title: "Authentication API",
        description: "JWT token validation, refresh tokens, and rate-limiting endpoints.",
        status: "IN_REVIEW",
        priority: "HIGH",
        project_id: projV2.id,
        community_id: commMap["#engineering"]?.id || commMap["#backend"]?.id,
        assignee_id: seededUsers.alex.id,
        creator_id: adminUser.id,
        labels: JSON.stringify(["Backend", "API", "Auth"]),
        subtasks: JSON.stringify([
          { id: "st-auth-1", title: "Implement JWT middleware", completed: true },
          { id: "st-auth-2", title: "Argon2 password hashing", completed: true },
          { id: "st-auth-3", title: "Unit test token rotation", completed: true },
        ]),
      },
      {
        title: "Database Migration",
        description: "Migrate SQLite models to include Community metadata and task activity hooks.",
        status: "COMPLETED",
        priority: "HIGH",
        project_id: projV2.id,
        community_id: commMap["#engineering"]?.id || commMap["#backend"]?.id,
        assignee_id: seededUsers.alex.id,
        creator_id: seededUsers.ram.id,
        labels: JSON.stringify(["Database", "Backend"]),
        subtasks: JSON.stringify([
          { id: "st-db-1", title: "Prisma schema revisions", completed: true },
          { id: "st-db-2", title: "Database migration execution", completed: true },
        ]),
      },
      {
        title: "API Security",
        description: "Audit endpoints for RBAC authorization checks and input sanitization.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        project_id: projSecurity.id,
        community_id: commMap["#security"]?.id || commMap["#engineering"]?.id,
        assignee_id: seededUsers.priya.id,
        creator_id: adminUser.id,
        labels: JSON.stringify(["Security", "Audit"]),
        subtasks: JSON.stringify([
          { id: "st-sec-1", title: "Rate limiting verification", completed: true },
          { id: "st-sec-2", title: "Encryption at rest validation", completed: false },
        ]),
      },
      {
        title: "Build Kanban Board with drag-and-drop",
        description: "Implement interactive columns (To Do, In Progress, In Review, Blocked, Completed) with status updates.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        project_id: projV2.id,
        community_id: commMap["#frontend"]?.id || commMap["#engineering"]?.id,
        assignee_id: seededUsers.ram.id,
        creator_id: adminUser.id,
        labels: JSON.stringify(["Frontend", "UI", "Sprint 14"]),
        subtasks: JSON.stringify([
          { id: "st-1", title: "Column view components", completed: true },
          { id: "st-2", title: "Optimistic status transitions", completed: true },
          { id: "st-3", title: "Drag handles & touch gestures", completed: false },
        ]),
      },
    ];

    for (const t of explicitTasks) {
      const existingTask = await prisma.task.findFirst({
        where: { workspace_id: defaultWorkspace.id, title: t.title },
      });
      if (!existingTask) {
        await prisma.task.create({
          data: {
            workspace_id: defaultWorkspace.id,
            ...t,
          },
        });
      } else if (!existingTask.community_id) {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: { community_id: t.community_id },
        });
      }
    }

    // Seed conversation messages and work activities in #engineering community
    const engChannel = commMap["#engineering"];
    if (engChannel) {
      const existingMsgs = await prisma.message.count({
        where: { conversation_id: engChannel.id },
      });

      if (existingMsgs === 0) {
        console.log("🌱 Seeding chat and real-time work events in #engineering...");
        const baseTime = Date.now() - 3600000;

        // 1. Normal message: Alex: "Can someone review the authentication API?"
        await prisma.message.create({
          data: {
            conversation_id: engChannel.id,
            sender_id: seededUsers.alex.id,
            content: encrypt("Can someone review the authentication API?"),
            message_type: "user",
            created_at: new Date(baseTime),
          },
        });

        // 2. Normal message: Priya: "I'll check it."
        await prisma.message.create({
          data: {
            conversation_id: engChannel.id,
            sender_id: seededUsers.priya.id,
            content: encrypt("I'll check it."),
            message_type: "user",
            created_at: new Date(baseTime + 120000),
          },
        });

        // 3. Work event: Alex moved "Authentication API" from In Progress → In Review
        await prisma.message.create({
          data: {
            conversation_id: engChannel.id,
            sender_id: seededUsers.alex.id,
            content: encrypt("Alex Rivera moved \"Authentication API\" In Progress → In Review"),
            message_type: "task_activity",
            event_id: `seed-act-auth-moved`,
            metadata: JSON.stringify({
              action: "status_changed",
              taskTitle: "Authentication API",
              previousStatus: "IN_PROGRESS",
              newStatus: "IN_REVIEW",
              actorName: "Alex Rivera",
              actorId: seededUsers.alex.id,
              priority: "HIGH",
            }),
            created_at: new Date(baseTime + 240000),
          },
        });

        // 4. Work event: Alex completed "Database Migration"
        await prisma.message.create({
          data: {
            conversation_id: engChannel.id,
            sender_id: seededUsers.alex.id,
            content: encrypt("Alex Rivera completed \"Database Migration\""),
            message_type: "task_activity",
            event_id: `seed-act-db-done`,
            metadata: JSON.stringify({
              action: "completed",
              taskTitle: "Database Migration",
              actorName: "Alex Rivera",
              actorId: seededUsers.alex.id,
              priority: "HIGH",
            }),
            created_at: new Date(baseTime + 360000),
          },
        });

        // 5. Work event: Priya was assigned "API Security"
        await prisma.message.create({
          data: {
            conversation_id: engChannel.id,
            sender_id: adminUser.id,
            content: encrypt("Priya Patel was assigned \"API Security\""),
            message_type: "task_activity",
            event_id: `seed-act-priya-assign`,
            metadata: JSON.stringify({
              action: "assigned",
              taskTitle: "API Security",
              actorName: "Admin",
              actorId: adminUser.id,
              assigneeName: "Priya Patel",
              priority: "URGENT",
            }),
            created_at: new Date(baseTime + 480000),
          },
        });

        // 6. Project progress event: Website Redesign / BlinkTalks reached 75% completion
        await prisma.message.create({
          data: {
            conversation_id: engChannel.id,
            sender_id: seededUsers.ram.id,
            content: encrypt("BlinkTalks V2 Workspace Suite reached 75% completion."),
            message_type: "project_activity",
            event_id: `seed-act-proj-75`,
            metadata: JSON.stringify({
              action: "project_activity",
              projectName: "BlinkTalks V2 Workspace Suite",
              completionPercentage: 75,
              actorName: "Ram Kumar",
            }),
            created_at: new Date(baseTime + 600000),
          },
        });
      }
    }

      // Default Tasks across Kanban columns
      const sampleTasks = [
        {
          project_id: projV2.id,
          title: "Build Kanban Board with drag-and-drop",
          description: "Implement interactive columns (To Do, In Progress, In Review, Blocked, Completed) with status updates.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assignee_id: seededUsers.ram.id,
          creator_id: adminUser.id,
          due_date: new Date(Date.now() + 2 * 86400000),
          labels: JSON.stringify(["Frontend", "UI", "Sprint 14"]),
          subtasks: JSON.stringify([
            { id: "st-1", title: "Column view components", completed: true },
            { id: "st-2", title: "Optimistic status transitions", completed: true },
            { id: "st-3", title: "Drag handles & touch gestures", completed: false },
          ]),
        },
        {
          project_id: projV2.id,
          title: "Chat-to-Task Quick Action",
          description: "Allow converting any conversation message into an actionable workspace task with 1-click.",
          status: "COMPLETED",
          priority: "MEDIUM",
          assignee_id: seededUsers.kiran.id,
          creator_id: seededUsers.alex.id,
          due_date: new Date(Date.now() - 1 * 86400000),
          labels: JSON.stringify(["Integration", "Chat"]),
          subtasks: JSON.stringify([
            { id: "st-4", title: "Message action dropdown item", completed: true },
            { id: "st-5", title: "Pre-filled task modal", completed: true },
          ]),
        },
        {
          project_id: projMobile.id,
          title: "Optimize Bottom Navigation on Mobile",
          description: "Design quick-switch drawer for channels, projects, and work tabs on small screens.",
          status: "IN_REVIEW",
          priority: "HIGH",
          assignee_id: seededUsers.priya.id,
          creator_id: seededUsers.alex.id,
          due_date: new Date(Date.now() + 4 * 86400000),
          labels: JSON.stringify(["Mobile", "UX"]),
          subtasks: JSON.stringify([
            { id: "st-6", title: "Bottom bar icons", completed: true },
            { id: "st-7", title: "Touch target sizing >= 44px", completed: true },
          ]),
        },
        {
          project_id: projSecurity.id,
          title: "Role Hierarchy & Permission Matrix",
          description: "Verify Owner, Admin, Manager, Member, and Guest role enforcement across API endpoints.",
          status: "TODO",
          priority: "URGENT",
          assignee_id: seededUsers.ram.id,
          creator_id: adminUser.id,
          due_date: new Date(Date.now() + 1 * 86400000),
          labels: JSON.stringify(["Security", "Backend"]),
          subtasks: JSON.stringify([
            { id: "st-8", title: "Middleware role validation", completed: false },
            { id: "st-9", title: "Audit log activity stream", completed: false },
          ]),
        },
        {
          project_id: projV2.id,
          title: "Company Analytics & Workload Distribution",
          description: "Real-time task completion rate, overdue metrics, and workload visualization by team member.",
          status: "TODO",
          priority: "MEDIUM",
          assignee_id: seededUsers.kiran.id,
          creator_id: seededUsers.alex.id,
          due_date: new Date(Date.now() + 5 * 86400000),
          labels: JSON.stringify(["Analytics", "Dashboard"]),
          subtasks: JSON.stringify([
            { id: "st-10", title: "Database aggregation queries", completed: true },
            { id: "st-11", title: "Workload distribution bars", completed: false },
          ]),
        },
        {
          project_id: projV2.id,
          title: "Payment gateway webhook integration",
          description: "Blocked waiting on external API key verification from vendor.",
          status: "BLOCKED",
          priority: "LOW",
          assignee_id: seededUsers.kiran.id,
          creator_id: seededUsers.alex.id,
          due_date: new Date(Date.now() + 7 * 86400000),
          labels: JSON.stringify(["Billing", "API"]),
          subtasks: JSON.stringify([
            { id: "st-12", title: "API credentials approval", completed: false },
          ]),
        },
      ];

      for (const t of sampleTasks) {
        const existingT = await prisma.task.findFirst({
          where: { workspace_id: defaultWorkspace.id, title: t.title },
        });
        if (!existingT) {
          await prisma.task.create({
            data: {
              workspace_id: defaultWorkspace.id,
              ...t,
            }
          });
        }
      }

      // Default Announcements
      const existingAnnounce = await prisma.announcement.count({
        where: { workspace_id: defaultWorkspace.id },
      });
      if (existingAnnounce === 0) {
        await prisma.announcement.create({
          data: {
            workspace_id: defaultWorkspace.id,
            author_id: adminUser.id,
            title: "🚀 Welcome to BlinkTalks Company Workspace & Collaboration Suite!",
            content: "We have upgraded BlinkTalks with Slack-style channels, Trello Kanban boards, Asana task management, team directories, and meeting schedules. Explore your dashboard!",
            priority: "URGENT",
          }
        });

        await prisma.announcement.create({
          data: {
            workspace_id: defaultWorkspace.id,
            author_id: seededUsers.alex.id,
            title: "📢 Sprint 14 Architecture Sync & Planning",
            content: "Sprint 14 review is scheduled for Friday at 3:00 PM. Please make sure all tasks have up-to-date status and comments.",
            priority: "NORMAL",
          }
        });
      }

      // Default Meetings
      const existingMeetings = await prisma.meeting.count({
        where: { workspace_id: defaultWorkspace.id },
      });
      if (existingMeetings === 0) {
        await prisma.meeting.create({
          data: {
            workspace_id: defaultWorkspace.id,
            project_id: projV2.id,
            title: "Sprint 14 Kickoff & Roadmap Review",
            description: "Reviewing milestones, backlog grooming, and team deliverables.",
            start_time: new Date(Date.now() + 24 * 3600000),
            end_time: new Date(Date.now() + 25 * 3600000),
            link: "https://meet.google.com/abc-defg-hij",
            created_by: seededUsers.alex.id,
          }
        });

        await prisma.meeting.create({
          data: {
            workspace_id: defaultWorkspace.id,
            project_id: projMobile.id,
            title: "Design System & Mobile UX Polish",
            description: "Syncing on typography scales, touch targets, and dark mode palette.",
            start_time: new Date(Date.now() + 48 * 3600000),
            end_time: new Date(Date.now() + 49 * 3600000),
            link: "https://meet.google.com/xyz-uvwx-rst",
            created_by: seededUsers.priya.id,
          }
        });
      }

      console.log("🌱 Seeding: Acme Innovations workspace and initial collaboration data created/updated!");

  } catch (error) {
    console.error("❌ Seeding Failed:", error);
  }
}
