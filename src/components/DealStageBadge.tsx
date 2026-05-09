import { DealStage } from '../types';

const styles: Record<DealStage, string> = {
  LEAD:        'bg-gray-100 text-gray-700',
  QUALIFIED:   'bg-blue-100 text-blue-700',
  PROPOSAL:    'bg-yellow-100 text-yellow-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  CLOSED_WON:  'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-700',
};

const labels: Record<DealStage, string> = {
  LEAD:        'Lead',
  QUALIFIED:   'Qualified',
  PROPOSAL:    'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON:  'Won',
  CLOSED_LOST: 'Lost',
};

export default function DealStageBadge({ stage }: { stage: DealStage }) {
  return <span className={`badge ${styles[stage]}`}>{labels[stage]}</span>;
}
