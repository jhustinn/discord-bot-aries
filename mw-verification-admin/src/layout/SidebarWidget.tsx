import { useAuth } from '../context/AuthContext';

export default function SidebarWidget() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]">
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        ARIES Admin
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Verification Dashboard v1.0.0
      </p>
      <button
        onClick={logout}
        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
