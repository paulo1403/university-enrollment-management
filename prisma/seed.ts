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

  const campusData = [
    {
      name: 'Campus Central',
      address: 'Av. Principal 123',
      city: 'Ciudad A',
      district: 'Centro',
      phone: '123456789',
      email: 'central@universidad.edu',
    },
    {
      name: 'Campus Norte',
      address: 'Calle Norte 456',
      city: 'Ciudad B',
      district: 'Norte',
      phone: '987654321',
      email: 'norte@universidad.edu',
    },
    {
      name: 'Campus Sur',
      address: 'Av. Sur 789',
      city: 'Ciudad C',
      district: 'Sur',
      phone: '555555555',
      email: 'sur@universidad.edu',
    },
    {
      name: 'Campus Este',
      address: 'Calle Este 101',
      city: 'Ciudad D',
      district: 'Este',
      phone: '444444444',
      email: 'este@universidad.edu',
    },
    {
      name: 'Campus Oeste',
      address: 'Av. Oeste 202',
      city: 'Ciudad E',
      district: 'Oeste',
      phone: '333333333',
      email: 'oeste@universidad.edu',
    },
  ];
  for (const campus of campusData) {
    await prisma.campus.upsert({
      where: { name: campus.name },
      update: {},
      create: campus,
    });
  }

  const periodNames = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
  ];
  const now = new Date();
  for (let i = 0; i < periodNames.length; i++) {
    const startDate = new Date(now.getFullYear(), i, 1);
    const endDate = new Date(now.getFullYear(), i + 1, 0);
    const existing = await prisma.academicPeriod.findFirst({
      where: { name: periodNames[i] },
    });
    if (!existing) {
      await prisma.academicPeriod.create({
        data: {
          name: periodNames[i],
          startDate,
          endDate,
          isEnrollmentOpen: false,
        },
      });
    }
  }

  // Asegurar que todos los usuarios con rol PROFESSOR tengan registro en Professor
  const professors = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
  });
  for (const prof of professors) {
    await prisma.professor.upsert({
      where: { userId: prof.id },
      update: {},
      create: { userId: prof.id },
    });
  }

  // Asegurar que todos los usuarios con rol STUDENT tengan registro en Student
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  for (const student of students) {
    await prisma.student.upsert({
      where: { userId: student.id },
      update: {},
      create: { userId: student.id },
    });
  }

  // Crear aulas de ejemplo para cada campus
  const allCampuses = await prisma.campus.findMany();
  for (const campus of allCampuses) {
    for (let i = 1; i <= 5; i++) {
      await prisma.room.upsert({
        where: { name_campusId: { name: `Aula ${i}`, campusId: campus.id } },
        update: {},
        create: {
          name: `Aula ${i}`,
          capacity: 30 + i * 5,
          campusId: campus.id,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
