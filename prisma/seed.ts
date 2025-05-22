import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('testPWD', 10);
  const user = await prisma.user.upsert({
    where: { email: 'paulollanosc@gmail.com' },
    update: {},
    create: {
      email: 'paulollanosc@gmail.com',
      password,
      name: 'Paulo Llanos',
      role: 'ADMIN',
      admin: {
        create: {
          permissions: 'ALL',
        },
      },
    },
  });
  console.log('Admin user created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
