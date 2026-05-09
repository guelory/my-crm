import { Mail, Phone, Users, StickyNote, CheckSquare } from 'lucide-react';
import { ActivityType } from '../types';

const config: Record<ActivityType, { icon: typeof Mail; bg: string; color: string }> = {
  EMAIL:   { icon: Mail,        bg: 'bg-blue-50',   color: 'text-blue-600' },
  CALL:    { icon: Phone,       bg: 'bg-green-50',  color: 'text-green-600' },
  MEETING: { icon: Users,       bg: 'bg-purple-50', color: 'text-purple-600' },
  NOTE:    { icon: StickyNote,  bg: 'bg-yellow-50', color: 'text-yellow-600' },
  TASK:    { icon: CheckSquare, bg: 'bg-gray-50',   color: 'text-gray-600' },
};

export default function ActivityIcon({ type, size = 'md' }: { type: ActivityType; size?: 'sm' | 'md' }) {
  const { icon: Icon, bg, color } = config[type];
  const s = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const i = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className={`${s} ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${i} ${color}`} />
    </div>
  );
}
