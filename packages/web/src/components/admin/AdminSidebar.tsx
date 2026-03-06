'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Moderation', href: '/admin/moderation', icon: '🛡️' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Content', href: '/admin/content', icon: '📝' },
  { label: 'Approvals', href: '/admin/approvals', icon: '✅' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: '📋' },
  { label: 'WhatsApp Bot', href: '/admin/whatsapp-bot', icon: '💬' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen" data-testid="admin-sidebar">
      <div className="p-6">
        <h2 className="text-xl font-bold text-orange-500">Admin Panel</h2>
        <p className="text-sm text-gray-400 mt-1">Desi Connect USA</p>
      </div>

      <nav className="px-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-orange-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
