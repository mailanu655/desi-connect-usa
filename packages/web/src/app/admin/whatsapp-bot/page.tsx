'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { StatsCard } from '@/components/admin';

// ── Types ────────────────────────────────────────────────

interface BotStats {
  totalMessages: number;
  activeUsers: number;
  activeSessions: number;
  avgResponseTime: number;
  intentBreakdown: Record<string, number>;
  messagesTrend: { date: string; count: number }[];
  topIntents: { intent: string; count: number; pct: number }[];
  errorRate: number;
}

interface RecentMessage {
  id: string;
  phone: string;
  message: string;
  intent: string;
  confidence: number;
  response: string;
  timestamp: string;
  sessionId: string;
}

interface LinkedUser {
  id: string;
  phone: string;
  userId: string;
  userName: string;
  linkedAt: string;
  lastActive: string;
  messageCount: number;
}

type TabId = 'overview' | 'messages' | 'intents' | 'users' | 'config';

// ── Mock Data ────────────────────────────────────────────

const MOCK_STATS: BotStats = {
  totalMessages: 12_847,
  activeUsers: 342,
  activeSessions: 28,
  avgResponseTime: 1.2,
  intentBreakdown: {
    search_businesses: 3214,
    job_search: 2105,
    immigration_alert: 1876,
    deals_nearby: 1543,
    event_info: 1290,
    help_onboarding: 987,
    daily_digest: 654,
    submit_business: 432,
    submit_deal: 321,
    consultancy_rating: 218,
    unknown: 207,
  },
  messagesTrend: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
    count: Math.floor(700 + Math.random() * 400),
  })),
  topIntents: [
    { intent: 'search_businesses', count: 3214, pct: 25.0 },
    { intent: 'job_search', count: 2105, pct: 16.4 },
    { intent: 'immigration_alert', count: 1876, pct: 14.6 },
    { intent: 'deals_nearby', count: 1543, pct: 12.0 },
    { intent: 'event_info', count: 1290, pct: 10.0 },
  ],
  errorRate: 1.6,
};

const MOCK_MESSAGES: RecentMessage[] = Array.from({ length: 20 }, (_, i) => ({
  id: `msg_${1000 + i}`,
  phone: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
  message: [
    'Find Indian restaurants near Edison NJ',
    'Any H1B visa updates?',
    'Looking for IT jobs in Bay Area',
    'Best deals on groceries this week',
    'Diwali events in Chicago?',
    'How do I use this bot?',
    'Rate ABC Immigration consultancy 4 stars',
    'List my business - Spice Kitchen',
    'Weekly digest please',
    'Any deals at Devon Street stores?',
  ][i % 10],
  intent: [
    'search_businesses', 'immigration_alert', 'job_search',
    'deals_nearby', 'event_info', 'help_onboarding',
    'consultancy_rating', 'submit_business', 'daily_digest',
    'deals_nearby',
  ][i % 10],
  confidence: parseFloat((0.72 + Math.random() * 0.25).toFixed(2)),
  response: 'Bot response generated successfully',
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
}));

const MOCK_LINKED_USERS: LinkedUser[] = Array.from({ length: 15 }, (_, i) => ({
  id: `link_${i}`,
  phone: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
  userId: `user_${100 + i}`,
  userName: ['Rahul Sharma', 'Priya Patel', 'Arun Kumar', 'Deepa Nair', 'Vikram Singh',
    'Anita Desai', 'Sanjay Gupta', 'Meera Reddy', 'Kiran Joshi', 'Ravi Krishnan',
    'Pooja Mehta', 'Amit Bose', 'Neha Iyer', 'Suresh Rao', 'Divya Kapoor'][i],
  linkedAt: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
  lastActive: new Date(Date.now() - i * 7200000).toISOString(),
  messageCount: Math.floor(5 + Math.random() * 200),
}));

const INTENT_COLORS: Record<string, string> = {
  search_businesses: 'bg-blue-100 text-blue-800',
  job_search: 'bg-green-100 text-green-800',
  immigration_alert: 'bg-red-100 text-red-800',
  deals_nearby: 'bg-yellow-100 text-yellow-800',
  event_info: 'bg-purple-100 text-purple-800',
  help_onboarding: 'bg-gray-100 text-gray-800',
  daily_digest: 'bg-indigo-100 text-indigo-800',
  submit_business: 'bg-teal-100 text-teal-800',
  submit_deal: 'bg-orange-100 text-orange-800',
  consultancy_rating: 'bg-pink-100 text-pink-800',
  unknown: 'bg-gray-200 text-gray-600',
};

// ── Helpers ──────────────────────────────────────────────

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatIntent(intent: string): string {
  return intent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Page Component ───────────────────────────────────────

export default function WhatsAppBotPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<BotStats | null>(null);
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [intentFilter, setIntentFilter] = useState('all');
  const [messageSearch, setMessageSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<RecentMessage | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Simulate API call — replace with real endpoint later
    await new Promise((r) => setTimeout(r, 400));
    setStats(MOCK_STATS);
    setMessages(MOCK_MESSAGES);
    setLinkedUsers(MOCK_LINKED_USERS);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMessages = messages.filter((m) => {
    if (intentFilter !== 'all' && m.intent !== intentFilter) return false;
    if (messageSearch && !m.message.toLowerCase().includes(messageSearch.toLowerCase())) return false;
    return true;
  });

  const TABS: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'messages', label: 'Messages' },
    { id: 'intents', label: 'Intent Analytics' },
    { id: 'users', label: 'Linked Users' },
    { id: 'config', label: 'Configuration' },
  ];

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading WhatsApp Bot data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bot Management</h1>
        <p className="text-gray-500 mt-1">
          Monitor bot activity, review conversations, and manage configuration.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Bot management tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} messages={messages} />
      )}
      {activeTab === 'messages' && (
        <MessagesTab
          messages={filteredMessages}
          intentFilter={intentFilter}
          onIntentFilterChange={setIntentFilter}
          messageSearch={messageSearch}
          onMessageSearchChange={setMessageSearch}
          selectedMessage={selectedMessage}
          onSelectMessage={setSelectedMessage}
        />
      )}
      {activeTab === 'intents' && (
        <IntentAnalyticsTab stats={stats} />
      )}
      {activeTab === 'users' && (
        <LinkedUsersTab users={linkedUsers} />
      )}
      {activeTab === 'config' && (
        <ConfigurationTab />
      )}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────

function OverviewTab({ stats, messages }: { stats: BotStats; messages: RecentMessage[] }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Messages" value={stats.totalMessages.toLocaleString()} />
        <StatsCard label="Active Users" value={stats.activeUsers.toLocaleString()} />
        <StatsCard label="Active Sessions" value={stats.activeSessions.toString()} />
        <StatsCard label="Avg Response Time" value={`${stats.avgResponseTime}s`} />
      </div>

      {/* Messages Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Message Volume (14 days)</h3>
        <div className="flex items-end gap-1 h-40">
          {stats.messagesTrend.map((day) => {
            const maxCount = Math.max(...stats.messagesTrend.map((d) => d.count));
            const heightPct = (day.count / maxCount) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 bg-orange-400 rounded-t hover:bg-orange-500 transition-colors group relative"
                style={{ height: `${heightPct}%` }}
                title={`${day.date}: ${day.count} messages`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {day.count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{stats.messagesTrend[0]?.date.slice(5)}</span>
          <span>{stats.messagesTrend[stats.messagesTrend.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Top Intents + Recent Messages side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Intents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Intents</h3>
          <div className="space-y-3">
            {stats.topIntents.map((item) => (
              <div key={item.intent} className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${INTENT_COLORS[item.intent] ?? 'bg-gray-100 text-gray-700'}`}>
                  {formatIntent(item.intent)}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-16 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.slice(0, 8).map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-sm border-b border-gray-100 pb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 truncate">{msg.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${INTENT_COLORS[msg.intent] ?? 'bg-gray-100'}`}>
                      {formatIntent(msg.intent)}
                    </span>
                    <span className="text-gray-400 text-xs">{timeAgo(msg.timestamp)}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono">{(msg.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Bot Health</h3>
            <p className="text-sm text-gray-500 mt-1">Current error rate and system status</p>
          </div>
          <div className={`text-2xl font-bold ${stats.errorRate < 5 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.errorRate}% errors
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Twilio</p>
            <p className="text-lg font-semibold text-green-700">Connected</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Redis</p>
            <p className="text-lg font-semibold text-green-700">Healthy</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">AI Classifier</p>
            <p className="text-lg font-semibold text-green-700">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Messages Tab ─────────────────────────────────────────

function MessagesTab({
  messages,
  intentFilter,
  onIntentFilterChange,
  messageSearch,
  onMessageSearchChange,
  selectedMessage,
  onSelectMessage,
}: {
  messages: RecentMessage[];
  intentFilter: string;
  onIntentFilterChange: (v: string) => void;
  messageSearch: string;
  onMessageSearchChange: (v: string) => void;
  selectedMessage: RecentMessage | null;
  onSelectMessage: (m: RecentMessage | null) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search messages..."
          value={messageSearch}
          onChange={(e) => onMessageSearchChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={intentFilter}
          onChange={(e) => onIntentFilterChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Intents</option>
          {Object.keys(INTENT_COLORS).map((intent) => (
            <option key={intent} value={intent}>
              {formatIntent(intent)}
            </option>
          ))}
        </select>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Message</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Intent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Confidence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {messages.map((msg) => (
              <tr
                key={msg.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectMessage(msg)}
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{formatPhone(msg.phone)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-800">{msg.message}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${INTENT_COLORS[msg.intent] ?? 'bg-gray-100'}`}>
                    {formatIntent(msg.intent)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${msg.confidence >= 0.8 ? 'text-green-600' : msg.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {(msg.confidence * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(msg.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {messages.length === 0 && (
          <div className="p-8 text-center text-gray-500">No messages match the current filters.</div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => onSelectMessage(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Message Detail</h3>
              <button onClick={() => onSelectMessage(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="font-mono">{formatPhone(selectedMessage.phone)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">User Message</p>
                <p className="bg-gray-50 rounded-lg p-3 text-sm">{selectedMessage.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Classified Intent</p>
                  <span className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${INTENT_COLORS[selectedMessage.intent]}`}>
                    {formatIntent(selectedMessage.intent)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Confidence</p>
                  <p className="text-lg font-semibold mt-1">{(selectedMessage.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Session ID</p>
                <p className="font-mono text-xs text-gray-600">{selectedMessage.sessionId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Timestamp</p>
                <p className="text-sm">{new Date(selectedMessage.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Intent Analytics Tab ─────────────────────────────────

function IntentAnalyticsTab({ stats }: { stats: BotStats }) {
  const totalMessages = Object.values(stats.intentBreakdown).reduce((a, b) => a + b, 0);
  const sortedIntents = Object.entries(stats.intentBreakdown)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Intent Distribution</h3>
        <div className="space-y-3">
          {sortedIntents.map(([intent, count]) => {
            const pct = ((count / totalMessages) * 100).toFixed(1);
            return (
              <div key={intent} className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs font-medium w-44 text-center ${INTENT_COLORS[intent] ?? 'bg-gray-100'}`}>
                  {formatIntent(intent)}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-24 text-right">
                  {count.toLocaleString()} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Total Classified</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalMessages.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Unknown Rate</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">
            {((stats.intentBreakdown.unknown / totalMessages) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-500">Unique Intents Used</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {Object.keys(stats.intentBreakdown).filter((k) => stats.intentBreakdown[k] > 0).length}
          </p>
        </div>
      </div>

      {/* AI Classifier Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">AI Classifier Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Avg Confidence</p>
            <p className="text-2xl font-bold text-green-700">87.3%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">AI Fallback Rate</p>
            <p className="text-2xl font-bold text-blue-700">12.4%</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Keyword Match Rate</p>
            <p className="text-2xl font-bold text-yellow-700">87.6%</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Avg AI Latency</p>
            <p className="text-2xl font-bold text-purple-700">340ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Linked Users Tab ─────────────────────────────────────

function LinkedUsersTab({ users }: { users: LinkedUser[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{users.length}</span> users have linked their WhatsApp accounts.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Linked</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Active</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Messages</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{user.userName}</p>
                    <p className="text-xs text-gray-500">{user.userId}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{formatPhone(user.phone)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(user.linkedAt)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(user.lastActive)}</td>
                <td className="px-4 py-3 font-medium text-gray-700">{user.messageCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Configuration Tab ────────────────────────────────────

function ConfigurationTab() {
  const [config, setConfig] = useState({
    aiProvider: 'anthropic',
    aiModel: 'claude-sonnet-4-5-20250929',
    aiConfidenceThreshold: '0.6',
    sessionTtlMin: '30',
    maxOtpAttempts: '3',
    otpTtlSec: '300',
    twilioFrom: '+14155238886',
    rateLimitPerMin: '60',
    enableAiFallback: true,
    enableTemplateMessages: true,
    enableMediaMessages: false,
  });

  const handleChange = (key: string, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* AI Classification */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">AI Classification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
            <select
              value={config.aiProvider}
              onChange={(e) => handleChange('aiProvider', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={config.aiModel}
              onChange={(e) => handleChange('aiModel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Threshold</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.aiConfidenceThreshold}
              onChange={(e) => handleChange('aiConfidenceThreshold', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="enableAiFallback"
              checked={config.enableAiFallback}
              onChange={(e) => handleChange('enableAiFallback', e.target.checked)}
              className="h-4 w-4 text-orange-600 rounded"
            />
            <label htmlFor="enableAiFallback" className="text-sm text-gray-700">Enable AI fallback for low-confidence intents</label>
          </div>
        </div>
      </div>

      {/* Session & Auth */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Session & Authentication</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session TTL (minutes)</label>
            <input
              type="number"
              value={config.sessionTtlMin}
              onChange={(e) => handleChange('sessionTtlMin', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max OTP Attempts</label>
            <input
              type="number"
              value={config.maxOtpAttempts}
              onChange={(e) => handleChange('maxOtpAttempts', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OTP TTL (seconds)</label>
            <input
              type="number"
              value={config.otpTtlSec}
              onChange={(e) => handleChange('otpTtlSec', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Twilio / WhatsApp */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Twilio / WhatsApp</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp From Number</label>
            <input
              type="text"
              value={config.twilioFrom}
              onChange={(e) => handleChange('twilioFrom', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (msgs/min)</label>
            <input
              type="number"
              value={config.rateLimitPerMin}
              onChange={(e) => handleChange('rateLimitPerMin', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableTemplateMessages"
              checked={config.enableTemplateMessages}
              onChange={(e) => handleChange('enableTemplateMessages', e.target.checked)}
              className="h-4 w-4 text-orange-600 rounded"
            />
            <label htmlFor="enableTemplateMessages" className="text-sm text-gray-700">Enable template messages (outside 24h window)</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableMediaMessages"
              checked={config.enableMediaMessages}
              onChange={(e) => handleChange('enableMediaMessages', e.target.checked)}
              className="h-4 w-4 text-orange-600 rounded"
            />
            <label htmlFor="enableMediaMessages" className="text-sm text-gray-700">Enable media message support</label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
          Save Configuration
        </button>
      </div>
    </div>
  );
}
