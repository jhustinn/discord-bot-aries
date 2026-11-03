import { useEffect, useState } from 'react';
import { getTickets, VerificationTicket } from '../../lib/supabase';

export default function WeeklyChart() {
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getTickets();
    processWeeklyData(data);
  }

  function processWeeklyData(tickets: VerificationTicket[]) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weekData: { day: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const count = tickets.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate.toDateString() === date.toDateString();
      }).length;

      weekData.push({ day: dayName, count });
    }

    setWeeklyData(weekData);
  }

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Weekly Verification Activity
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last7 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Tickets</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-48">
        {weeklyData.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 gap-2">
            <div className="relative w-full flex items-end justify-center" style={{ height: '160px' }}>
              <div
                className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-500 hover:to-blue-300"
                style={{
                  height: `${(item.count / maxCount) * 100}%`,
                  minHeight: item.count > 0 ? '8px' : '2px'
                }}
              >
                {item.count > 0 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.count}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {item.day}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total this week
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {weeklyData.reduce((sum, d) => sum + d.count, 0)} tickets
          </span>
        </div>
      </div>
    </div>
  );
}
