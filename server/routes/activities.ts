import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { contactId, dealId, type, page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (contactId) where.contactId = contactId;
  if (dealId) where.dealId = dealId;
  if (type) where.type = type;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
        deal: { select: { id: true, title: true } },
      },
    }),
    prisma.activity.count({ where }),
  ]);

  res.json({ data: activities, total, page: parseInt(page), limit: parseInt(limit) });
});

router.post(
  '/',
  [body('type').notEmpty(), body('subject').trim().notEmpty()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { type, subject, body: bodyText, outcome, dueDate, completedAt, contactId, dealId } = req.body;
    const activity = await prisma.activity.create({
      data: {
        type,
        subject,
        body: bodyText,
        outcome,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        contactId,
        dealId,
        userId: req.user!.id,
      },
      include: {
        user: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } },
      },
    });
    res.status(201).json(activity);
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { subject, body: bodyText, outcome, dueDate, completedAt } = req.body;
  try {
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        subject,
        body: bodyText,
        outcome,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
    });
    res.json(activity);
  } catch {
    res.status(404).json({ message: 'Activity not found' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.activity.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ message: 'Activity not found' });
  }
});

export default router;
