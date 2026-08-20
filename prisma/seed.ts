import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.createMany({
      data: [
        {
          name: "System Admin",
          username: "admin",
          password_hash: await bcrypt.hash("admin123", 12),
          role: "admin",
          is_active: true,
        },
        {
          name: "Scheduler Staff",
          username: "scheduler",
          password_hash: await bcrypt.hash("scheduler123", 12),
          role: "scheduler",
          is_active: true,
        },
      ],
    });
    console.log("Seeded users: admin/admin123, scheduler/scheduler123");
  }

  const settingCount = await prisma.setting.count();
  if (settingCount === 0) {
    await prisma.setting.create({
      data: {
        id: 1,
        school_name: "Smart Timetable School",
        academic_session: "2026-2027",
        working_days: "monday,tuesday,wednesday,thursday,friday",
        default_dashboard_view: "today",
      },
    });
    console.log("Seeded settings");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());