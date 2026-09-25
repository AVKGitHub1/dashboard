import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';

export function useAuth() {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    retry: false,
    // Session identity doesn't change moment-to-moment. Without this, every fresh
    // mount of a component using this hook (e.g. navigating from /login to / right
    // after signing in) treats the just-primed cache as stale and silently re-fetches
    // /api/auth/me in the background — and if that background call ever hiccups for
    // any transient reason, isAuthenticated flips false and the whole dashboard
    // bounces back to the login screen despite a perfectly valid session.
    staleTime: 5 * 60 * 1000,
  });
  return {
    user: query.data,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data && !query.isError,
  };
}
