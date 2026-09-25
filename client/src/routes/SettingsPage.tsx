import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import ApiKeyForm from '../components/settings/ApiKeyForm';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Settings</h1>
        <Link to="/" className="text-sm text-blue-400 hover:underline">
          Back to dashboard
        </Link>
      </div>

      <section>
        <h2 className="mb-2 font-medium text-slate-200">API keys</h2>
        <ApiKeyForm />
      </section>

      <section>
        <h2 className="mb-2 font-medium text-slate-200">Change password</h2>
        <form
          className="space-y-2 rounded-lg border border-slate-800 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            changePassword.mutate();
          }}
        >
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Current password"
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 sm:py-1"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password (min 8 characters)"
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 sm:py-1"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {changePassword.isError && <p className="text-xs text-red-400">Failed to change password.</p>}
          {changePassword.isSuccess && <p className="text-xs text-emerald-400">Password updated.</p>}
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 sm:py-1"
          >
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
