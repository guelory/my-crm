import { PrismaClient, UserRole, ContactStatus, DealStage, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  console.log('Seeding database...');

  // Users
  const adminHash = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mycrm.com' },
    update: {},
    create: {
      email: 'admin@mycrm.com',
      name: 'Alex Johnson',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
  });

  const salesHash = await bcrypt.hash('password123', 10);
  const salesRep = await prisma.user.upsert({
    where: { email: 'sarah@mycrm.com' },
    update: {},
    create: {
      email: 'sarah@mycrm.com',
      name: 'Sarah Williams',
      passwordHash: salesHash,
      role: UserRole.SALES_REP,
    },
  });

  // Contacts
  const contactsData = [
    {
      firstName: 'Marcus',
      lastName: 'Chen',
      email: 'marcus.chen@techcorp.io',
      phone: '+1 (555) 201-4400',
      company: 'TechCorp Inc.',
      jobTitle: 'CTO',
      status: ContactStatus.CUSTOMER,
      tags: ['enterprise', 'tech'],
      notes: 'Key decision maker. Prefers email communication.',
      ownerId: admin.id,
    },
    {
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya@startupx.co',
      phone: '+1 (555) 348-9921',
      company: 'StartupX',
      jobTitle: 'CEO',
      status: ContactStatus.PROSPECT,
      tags: ['startup', 'saas'],
      notes: 'Met at SaaStr conference. Very interested in the enterprise plan.',
      ownerId: admin.id,
    },
    {
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@globalops.com',
      phone: '+1 (555) 776-3310',
      company: 'GlobalOps LLC',
      jobTitle: 'VP Sales',
      status: ContactStatus.LEAD,
      tags: ['operations', 'mid-market'],
      notes: 'Inbound lead from website.',
      ownerId: salesRep.id,
    },
    {
      firstName: 'Amelia',
      lastName: 'Rodriguez',
      email: 'amelia@financeflow.com',
      phone: '+1 (555) 912-6650',
      company: 'FinanceFlow',
      jobTitle: 'CFO',
      status: ContactStatus.PROSPECT,
      tags: ['finance', 'enterprise'],
      notes: 'Evaluating multiple vendors. Budget approved for Q2.',
      ownerId: salesRep.id,
    },
    {
      firstName: 'James',
      lastName: 'O\'Brien',
      email: 'james@retailpro.net',
      phone: '+1 (555) 444-7823',
      company: 'RetailPro',
      jobTitle: 'Head of IT',
      status: ContactStatus.CUSTOMER,
      tags: ['retail', 'smb'],
      notes: 'Long-term customer. Upsell opportunity on analytics module.',
      ownerId: admin.id,
    },
    {
      firstName: 'Nina',
      lastName: 'Vasquez',
      email: 'nina.v@healthtech.org',
      phone: '+1 (555) 239-5500',
      company: 'HealthTech Solutions',
      jobTitle: 'Director of Operations',
      status: ContactStatus.LEAD,
      tags: ['health', 'compliance'],
      notes: 'HIPAA compliance requirements. Needs custom contract.',
      ownerId: salesRep.id,
    },
  ];

  const contacts = await Promise.all(
    contactsData.map((c) => prisma.contact.create({ data: c }))
  );

  // Deals
  const dealsData = [
    {
      title: 'TechCorp Enterprise License',
      value: 84000,
      stage: DealStage.CLOSED_WON,
      probability: 100,
      closeDate: new Date('2024-03-15'),
      contactId: contacts[0].id,
      ownerId: admin.id,
      notes: 'Annual enterprise license. Includes onboarding and premium support.',
    },
    {
      title: 'StartupX SaaS Subscription',
      value: 18000,
      stage: DealStage.PROPOSAL,
      probability: 60,
      closeDate: new Date('2024-06-30'),
      contactId: contacts[1].id,
      ownerId: admin.id,
      notes: 'Annual plan proposal sent. Awaiting legal review.',
    },
    {
      title: 'GlobalOps Pilot Program',
      value: 9500,
      stage: DealStage.QUALIFIED,
      probability: 30,
      closeDate: new Date('2024-07-15'),
      contactId: contacts[2].id,
      ownerId: salesRep.id,
      notes: '3-month pilot to prove ROI before full deployment.',
    },
    {
      title: 'FinanceFlow Analytics Module',
      value: 45000,
      stage: DealStage.NEGOTIATION,
      probability: 75,
      closeDate: new Date('2024-06-01'),
      contactId: contacts[3].id,
      ownerId: salesRep.id,
      notes: 'Negotiating multi-year discount. Legal reviewing MSA.',
    },
    {
      title: 'RetailPro Analytics Upsell',
      value: 12000,
      stage: DealStage.LEAD,
      probability: 20,
      closeDate: new Date('2024-08-01'),
      contactId: contacts[4].id,
      ownerId: admin.id,
      notes: 'Existing customer expansion. Need to schedule demo.',
    },
    {
      title: 'HealthTech Compliance Suite',
      value: 30000,
      stage: DealStage.QUALIFIED,
      probability: 40,
      closeDate: new Date('2024-09-01'),
      contactId: contacts[5].id,
      ownerId: salesRep.id,
      notes: 'Custom HIPAA compliance module required. Involve product team.',
    },
    {
      title: 'TechCorp Renewal 2025',
      value: 90000,
      stage: DealStage.LEAD,
      probability: 85,
      closeDate: new Date('2025-03-01'),
      contactId: contacts[0].id,
      ownerId: admin.id,
      notes: 'Early renewal outreach. 10% price increase expected.',
    },
    {
      title: 'StartupX Expansion - Team Plan',
      value: 6000,
      stage: DealStage.CLOSED_LOST,
      probability: 0,
      closeDate: new Date('2024-02-28'),
      contactId: contacts[1].id,
      ownerId: salesRep.id,
      notes: 'Lost to competitor. Price was the main objection.',
    },
  ];

  const deals = await Promise.all(
    dealsData.map((d) => prisma.deal.create({ data: d }))
  );

  // Activities
  const activitiesData = [
    {
      type: ActivityType.EMAIL,
      subject: 'Enterprise proposal sent',
      body: 'Sent the full enterprise proposal including pricing and SOW.',
      outcome: 'Awaiting response',
      contactId: contacts[1].id,
      dealId: deals[1].id,
      userId: admin.id,
      completedAt: new Date('2024-05-02'),
    },
    {
      type: ActivityType.CALL,
      subject: 'Discovery call with David Kim',
      body: 'Discussed pain points around current CRM. Very interested in our pipeline features.',
      outcome: 'Scheduled follow-up demo',
      contactId: contacts[2].id,
      dealId: deals[2].id,
      userId: salesRep.id,
      completedAt: new Date('2024-05-03'),
    },
    {
      type: ActivityType.MEETING,
      subject: 'Contract negotiation meeting – FinanceFlow',
      body: 'Met with Amelia and legal team. Agreed to 2-year term with 15% discount.',
      outcome: 'Contract redline to be sent by EOW',
      contactId: contacts[3].id,
      dealId: deals[3].id,
      userId: salesRep.id,
      completedAt: new Date('2024-05-05'),
    },
    {
      type: ActivityType.NOTE,
      subject: 'RetailPro upsell notes',
      body: 'James mentioned they are expanding their analytics team. Good time to pitch the advanced module.',
      contactId: contacts[4].id,
      dealId: deals[4].id,
      userId: admin.id,
      completedAt: new Date('2024-05-06'),
    },
    {
      type: ActivityType.EMAIL,
      subject: 'Follow-up: HealthTech compliance requirements',
      body: 'Sent HIPAA compliance documentation and reference customer list.',
      outcome: 'Waiting on security questionnaire back',
      contactId: contacts[5].id,
      dealId: deals[5].id,
      userId: salesRep.id,
      completedAt: new Date('2024-05-07'),
    },
    {
      type: ActivityType.CALL,
      subject: 'TechCorp QBR prep call',
      body: 'Reviewed Q1 usage metrics with Marcus. Customer is very happy. Discussed renewal timeline.',
      outcome: 'Marcus will loop in procurement for renewal',
      contactId: contacts[0].id,
      dealId: deals[6].id,
      userId: admin.id,
      completedAt: new Date('2024-05-08'),
    },
    {
      type: ActivityType.TASK,
      subject: 'Send StartupX references',
      body: 'Priya asked for 2 reference customers in the same industry.',
      dueDate: new Date('2024-05-12'),
      contactId: contacts[1].id,
      dealId: deals[1].id,
      userId: admin.id,
    },
    {
      type: ActivityType.MEETING,
      subject: 'GlobalOps product demo',
      body: 'Full pipeline and reporting demo for David and 3 team members.',
      outcome: 'Very positive. Moving to technical evaluation.',
      contactId: contacts[2].id,
      dealId: deals[2].id,
      userId: salesRep.id,
      completedAt: new Date('2024-05-04'),
    },
  ];

  await Promise.all(
    activitiesData.map((a) => prisma.activity.create({ data: a }))
  );

  console.log('Seed complete!');
  console.log(`  Users:      ${await prisma.user.count()}`);
  console.log(`  Contacts:   ${await prisma.contact.count()}`);
  console.log(`  Deals:      ${await prisma.deal.count()}`);
  console.log(`  Activities: ${await prisma.activity.count()}`);
  console.log('\nDefault login: admin@mycrm.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
