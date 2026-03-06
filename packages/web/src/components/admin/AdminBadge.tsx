'use client';

export type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange';

export interface AdminBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-700',
};

export default function AdminBadge({ label, variant = 'gray' }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
      data-testid="admin-badge"
    >
      {label}
    </span>
  );
}
