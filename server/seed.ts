import { getPrisma } from "./db.js";
import { hashPassword } from "./auth.js";

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

  } catch (error) {
    console.error("❌ Seeding Failed:", error);
  }
}
