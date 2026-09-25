import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authApi.login(username, password),
    onSuccess: (me) => {
      qc.setQueryData(['me'], me);
      navigate('/');
    },
  });

  return (
    <form
      className="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h1 className="text-xl font-semibold text-slate-100">Sign in to Dashboard</h1>
      <div className="space-y-1">
        <label className="text-sm text-slate-400">Username</label>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-slate-400">Password</label>
        <input
          type="password"
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-400">
          {(mutation.error as any)?.response?.data?.error || 'Invalid username or password.'}
        </p>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {mutation.isPending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-xs text-slate-500">
        First run? The generated username/password were printed once in the container logs
        (<code>docker logs</code>).
      </p>
    </form>
  );
}
