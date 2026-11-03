import { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  // Bot settings (read-only for now)
  const [settings] = useState({
    botName: 'ARIES Verification Bot',
    version: '1.0.0',
    supabaseUrl: 'https://kqpipzaqpcktuwuxfgno.supabase.co',
    maxFileSize: '5MB',
    rateLimit: '3 attempts / 24 hours',
    ticketCategory: 'open-ticket-{username}',
    closedCategory: 'closed-ticket-{username}',
  });

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageMeta
        title="Settings | ARIES Admin"
        description="Bot settings and configuration"
      />
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Settings
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Bot configuration and system information
          </p>
        </div>

        {/* System Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                    {value}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(value)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Copy"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Admin Account
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-800 dark:text-white">
                {user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email || 'admin@aries.mw'}
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Security Features
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Rate Limiting', status: true, desc: '3 attempts per 24 hours' },
              { name: 'File Validation', status: true, desc: 'Max 5MB, images only' },
              { name: 'Duplicate Prevention', status: true, desc: 'One active ticket per user' },
              { name: 'Input Sanitization', status: true, desc: 'XSS and injection protection' },
              { name: 'Supabase Auth', status: true, desc: 'Email/password authentication' },
            ].map((feature) => (
              <div key={feature.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {feature.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  feature.status 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {feature.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Toast */}
        {saved && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Copied to clipboard!
          </div>
        )}
      </div>
    </>
  );
}
