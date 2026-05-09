import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: { owner: { select: { id: true, name: true } } },
    }),
    prisma.contact.count({ where }),
  ]);

  res.json({ data: contacts, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const contact = await prisma.contact.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true } },
      deals: { orderBy: { updatedAt: 'desc' } },
      activities: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!contact) {
    res.status(404).json({ message: 'Contact not found' });
    return;
  }
  res.json(contact);
});

router.post(
  '/',
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const {
      firstName, lastName, email, phone, company, jobTitle,
      status, tags, notes, linkedinUrl, website, address,
    } = req.body;
    const contact = await prisma.contact.create({
      data: {
        firstName, lastName, email, phone, company, jobTitle,
        status, tags: tags ?? [], notes, linkedinUrl, website, address,
        ownerId: req.user!.id,
      },
      include: { owner: { select: { id: true, name: true } } },
    });
    res.status(201).json(contact);
  }
);

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    firstName, lastName, email, phone, company, jobTitle,
    status, tags, notes, linkedinUrl, website, address,
  } = req.body;
  try {
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        firstName, lastName, email, phone, company, jobTitle,
        status, tags, notes, linkedinUrl, website, address,
      },
      include: { owner: { select: { id: true, name: true } } },
    });
    res.json(contact);
  } catch {
    res.status(404).json({ message: 'Contact not found' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ message: 'Contact not found' });
  }
});

export default router;
