import { useEffect, useState } from 'react';
import { getStats, Stats } from '../../lib/supabase';

export default function TicketStatusChart() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTickets: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const data = await getStats();
    setStats(data);
  }

  const total = stats.approved + stats.rejected + stats.pending;
  const approvedPercent = total > 0 ? Math.round((stats.approved / total) * 100) : 0;
  const rejectedPercent = total > 0 ? Math.round((stats.rejected / total) * 100) : 0;
  const pendingPercent = total > 0 ? Math.round((stats.pending / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Ticket Status Distribution
      </h3>

      {/* Donut Chart */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Approved */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#10B981"
              strokeWidth="12"
              strokeDasharray={`${approvedPercent * 2.51} ${251 - approvedPercent * 2.51}`}
              strokeDashoffset="0"
            />
            {/* Rejected */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#EF4444"
              strokeWidth="12"
              strokeDasharray={`${rejectedPercent * 2.51} ${251 - rejectedPercent * 2.51}`}
              strokeDashoffset={`${-approvedPercent * 2.51}`}
            />
            {/* Pending */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="12"
              strokeDasharray={`${pendingPercent * 2.51} ${251 - pendingPercent * 2.51}`}
              strokeDashoffset={`${-(approvedPercent + rejectedPercent) * 2.51}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800 dark:text-white">{total}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 dark:text-white">{stats.approved}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">({approvedPercent}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 dark:text-white">{stats.rejected}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">({rejectedPercent}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 dark:text-white">{stats.pending}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">({pendingPercent}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
