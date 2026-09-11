import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const OWNER_USERNAME = process.env.OWNER_USERNAME || process.argv[2] || "";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || process.argv[3] || "";

async function main() {
  if (!OWNER_USERNAME || OWNER_USERNAME.length < 3) {
    console.error("OWNER_USERNAME is required (min 3 chars). Set via env or pass as first argument.");
    process.exit(1);
  }
  if (!OWNER_PASSWORD || OWNER_PASSWORD.length < 8) {
    console.error("OWNER_PASSWORD is required (min 8 chars). Set via env or pass as second argument.");
    process.exit(1);
  }

  const existingCount = await prisma.user.count();

  const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { username: OWNER_USERNAME },
    update: {
      password_hash: hash,
      role: "admin",
      is_active: true,
    },
    create: {
      name: OWNER_USERNAME,
      username: OWNER_USERNAME,
      password_hash: hash,
      role: "admin",
      is_active: true,
    },
  });

  console.log(
    `User "${OWNER_USERNAME}" (id=${user.id}) ready. ${existingCount === 0 ? "(first user created)" : ""}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());