import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';
import { DealStage } from '@prisma/client';

const router = Router();
router.use(authenticate);

router.get('/summary', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalContacts,
    totalDeals,
    wonDeals,
    lostDeals,
    activeDeals,
    dealsByStage,
    totalActivities,
    recentActivities,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.deal.aggregate({
      where: { stage: DealStage.CLOSED_WON },
      _sum: { value: true },
      _count: true,
    }),
    prisma.deal.count({ where: { stage: DealStage.CLOSED_LOST } }),
    prisma.deal.aggregate({
      where: { stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] } },
      _sum: { value: true },
      _count: true,
    }),
    prisma.deal.groupBy({
      by: ['stage'],
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.activity.count(),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    }),
  ]);

  const stageOrder: DealStage[] = [
    DealStage.LEAD,
    DealStage.QUALIFIED,
    DealStage.PROPOSAL,
    DealStage.NEGOTIATION,
    DealStage.CLOSED_WON,
    DealStage.CLOSED_LOST,
  ];

  const pipeline = stageOrder.map((stage) => {
    const found = dealsByStage.find((d) => d.stage === stage);
    return {
      stage,
      count: found?._count._all ?? 0,
      value: found?._sum.value ?? 0,
    };
  });

  const conversionRate = totalDeals > 0
    ? Math.round((wonDeals._count / totalDeals) * 100)
    : 0;

  res.json({
    totalContacts,
    totalDeals,
    wonRevenue: wonDeals._sum.value ?? 0,
    wonCount: wonDeals._count,
    lostCount: lostDeals,
    activePipelineValue: activeDeals._sum.value ?? 0,
    activeDealsCount: activeDeals._count,
    conversionRate,
    totalActivities,
    pipeline,
    recentActivities,
  });
});

router.get('/activities', async (_req: AuthRequest, res: Response): Promise<void> => {
  const byType = await prisma.activity.groupBy({
    by: ['type'],
    _count: { _all: true },
  });

  // Activities over the last 30 days grouped by day
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recent = await prisma.activity.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true, type: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date string
  const byDay: Record<string, number> = {};
  recent.forEach((a) => {
    const key = a.createdAt.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] ?? 0) + 1;
  });

  res.json({
    byType: byType.map((t) => ({ type: t.type, count: t._count._all })),
    byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
  });
});

router.get('/deals/monthly', async (_req: AuthRequest, res: Response): Promise<void> => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const wonDeals = await prisma.deal.findMany({
    where: {
      stage: DealStage.CLOSED_WON,
      closeDate: { gte: twelveMonthsAgo },
    },
    select: { closeDate: true, value: true },
    orderBy: { closeDate: 'asc' },
  });

  const byMonth: Record<string, { revenue: number; count: number }> = {};
  wonDeals.forEach((d) => {
    if (!d.closeDate) return;
    const key = d.closeDate.toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[key]) byMonth[key] = { revenue: 0, count: 0 };
    byMonth[key].revenue += d.value;
    byMonth[key].count += 1;
  });

  res.json(
    Object.entries(byMonth).map(([month, data]) => ({ month, ...data }))
  );
});

export default router;
