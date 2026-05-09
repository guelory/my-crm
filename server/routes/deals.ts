import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { DealStage } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { stage, search } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (stage) where.stage = stage;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { contact: { firstName: { contains: search, mode: 'insensitive' } } },
      { contact: { company: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const deals = await prisma.deal.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, company: true } },
      owner: { select: { id: true, name: true } },
    },
  });
  res.json(deals);
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const deal = await prisma.deal.findUnique({
    where: { id: req.params.id },
    include: {
      contact: true,
      owner: { select: { id: true, name: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!deal) {
    res.status(404).json({ message: 'Deal not found' });
    return;
  }
  res.json(deal);
});

router.post(
  '/',
  [body('title').trim().notEmpty(), body('value').optional().isFloat({ min: 0 })],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { title, value, stage, probability, closeDate, notes, contactId } = req.body;
    const deal = await prisma.deal.create({
      data: {
        title,
        value: value ?? 0,
        stage: stage ?? DealStage.LEAD,
        probability: probability ?? 10,
        closeDate: closeDate ? new Date(closeDate) : null,
        notes,
        contactId,
        ownerId: req.user!.id,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        owner: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(deal);
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, value, stage, probability, closeDate, notes, contactId } = req.body;
  try {
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        title, value, stage, probability,
        closeDate: closeDate ? new Date(closeDate) : undefined,
        notes, contactId,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        owner: { select: { id: true, name: true } },
      },
    });
    res.json(deal);
  } catch {
    res.status(404).json({ message: 'Deal not found' });
  }
});

router.patch('/:id/stage', async (req: AuthRequest, res: Response): Promise<void> => {
  const { stage } = req.body;
  const validStages = Object.values(DealStage);
  if (!validStages.includes(stage)) {
    res.status(400).json({ message: 'Invalid stage', validStages });
    return;
  }
  const probMap: Record<DealStage, number> = {
    LEAD: 10,
    QUALIFIED: 30,
    PROPOSAL: 60,
    NEGOTIATION: 75,
    CLOSED_WON: 100,
    CLOSED_LOST: 0,
  };
  try {
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: { stage, probability: probMap[stage as DealStage] },
    });
    res.json(deal);
  } catch {
    res.status(404).json({ message: 'Deal not found' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ message: 'Deal not found' });
  }
});

export default router;
