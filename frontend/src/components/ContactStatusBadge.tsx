import { ContactStatus } from '../types';

const styles: Record<ContactStatus, string> = {
  LEAD:     'bg-blue-100 text-blue-700',
  PROSPECT: 'bg-yellow-100 text-yellow-700',
  CUSTOMER: 'bg-green-100 text-green-700',
  CHURNED:  'bg-red-100 text-red-700',
};

export default function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span className={`badge ${styles[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
