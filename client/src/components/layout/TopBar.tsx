import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderCog, LayoutGrid, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/useUiStore';
import SaveLoadModal from './SaveLoadModal';

// Enough padding to clear the ~44px minimum touch target without changing how the icons
// read on desktop; the negative margin keeps the row from growing taller.
const ICON_BUTTON = '-m-1 rounded-md p-2.5 sm:p-2';

export default function TopBar() {
  const { user } = useAuth();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [savesOpen, setSavesOpen] = useState(false);
  const qc = useQueryClient();

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.setQueryData(['me'], null);
      window.location.href = '/login';
    },
  });

  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2 sm:px-4">
      {/* min-w-0 + truncate makes the title the part that gives way on a narrow phone,
          so the actions on the right never wrap onto a second line. */}
      <div className="flex min-w-0 items-center gap-2 text-slate-100">
        <LayoutGrid size={18} className="shrink-0" />
        <span className="truncate font-semibold">Dashboard</span>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <button
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 sm:py-1.5"
          onClick={toggleSidebar}
        >
          Add widget
        </button>
        <button
          className={`${ICON_BUTTON} text-slate-400 hover:text-slate-100`}
          onClick={() => setSavesOpen(true)}
          title="Save or load a dashboard layout"
          aria-label="Save or load a dashboard layout"
        >
          <FolderCog size={18} />
        </button>
        <Link
          to="/settings"
          className={`${ICON_BUTTON} text-slate-400 hover:text-slate-100`}
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>
        <span className="hidden text-sm text-slate-500 sm:inline">{user?.username}</span>
        <button
          className={`${ICON_BUTTON} text-slate-400 hover:text-red-400`}
          onClick={() => logout.mutate()}
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
      {savesOpen && <SaveLoadModal onClose={() => setSavesOpen(false)} />}
    </div>
  );
}
