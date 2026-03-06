'use client';

export interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' | 'flat' };
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

const variantStyles: Record<string, { bg: string; text: string; iconBg: string }> = {
  default: { bg: 'bg-white', text: 'text-gray-900', iconBg: 'bg-orange-100 text-orange-600' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-900', iconBg: 'bg-yellow-100 text-yellow-600' },
  danger: { bg: 'bg-red-50', text: 'text-red-900', iconBg: 'bg-red-100 text-red-600' },
  success: { bg: 'bg-green-50', text: 'text-green-900', iconBg: 'bg-green-100 text-green-600' },
};

export default function StatsCard({ label, value, icon, trend, variant = 'default' }: StatsCardProps) {
  const styles = variantStyles[variant] ?? variantStyles.default;

  return (
    <div className={`${styles.bg} rounded-lg shadow p-6`} data-testid="stats-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className={`text-3xl font-bold ${styles.text} mt-2`}>{value}</p>
          {trend && (
            <p
              className={`text-sm mt-1 ${
                trend.direction === 'up'
                  ? 'text-green-600'
                  : trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
              {trend.value}% from last period
            </p>
          )}
        </div>
        {icon && <div className={`${styles.iconBg} rounded-full p-4`}>{icon}</div>}
      </div>
    </div>
  );
}
