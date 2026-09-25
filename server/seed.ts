import { prisma } from './lib/prisma.ts';

async function main() {
  console.log('Clearing database...');
  await prisma.buyer_visibility_list.deleteMany();
  await prisma.want_to_lock_request_from_buyer_to_requester.deleteMany();
  await prisma.locked_requests.deleteMany();
  await prisma.locked_requests_that_got_unlocked_by_requester.deleteMany();
  await prisma.locked_requests_that_got_unlocked_by_buyer.deleteMany();
  await prisma.requester_visibility_list.deleteMany();
  await prisma.studentRefreshToken.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.request.deleteMany();
  await prisma.student.deleteMany();
  await prisma.college.deleteMany();

  console.log('Inserting colleges...');

  await prisma.college.createMany({
    data: [
      {
        name: 'IIIT Dharwad',
        location: 'Ittigatti Road, near Sattur Colony, Dharwad, Karnataka 580009',
        domain_name: 'iiitdwd.ac.in',
      },
      {
        name: 'IIT Bombay',
        location: 'Main Gate Rd, IIT Area, Powai, Mumbai, Maharashtra 400076',
        domain_name: 'iitb.ac.in',
      },
      {
        name: 'NIT Surathkal',
        location: 'NH 66, Srinivasnagar, Surathkal, Mangaluru, Karnataka 575025',
        domain_name: 'nitk.ac.in',
      },
      {
        name: 'BITS Pilani',
        location: 'Vidya Vihar, Pilani, Rajasthan 333031',
        domain_name: 'bits-pilani.ac.in',
      },
      {
        name: 'testing',
        location: 'Testing Location',
        domain_name: 'testing.com',
      }
    ],
    skipDuplicates: true,
  });

  console.log('Inserted colleges successfully.');
  
  const allColleges = await prisma.college.findMany();
  console.log('Current Colleges in DB:', allColleges);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
