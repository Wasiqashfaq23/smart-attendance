import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const demoDeleted = await prisma.user.deleteMany({
    where: { username: { in: ["admin", "scheduler"] } },
  });

  const hash = await bcrypt.hash("mohib123098", 12);
  const mohib = await prisma.user.upsert({
    where: { username: "mohib123" },
    update: {
      name: "Mohib",
      password_hash: hash,
      role: "admin",
      is_active: true,
    },
    create: {
      name: "Mohib",
      username: "mohib123",
      password_hash: hash,
      role: "admin",
      is_active: true,
    },
  });

  console.log(
    `Deleted ${demoDeleted.count} demo account(s); mohib user id=${mohib.id} ready.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());