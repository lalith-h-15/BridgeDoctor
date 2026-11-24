import { useCallback, useEffect, useState } from 'react';

export type Route = 'overview' | 'workbench' | 'insights' | 'security' | 'judge';

export const ROUTES: { id: Route; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'workbench', label: 'Workbench' },
  { id: 'insights', label: 'Insights' },
  { id: 'security', label: 'Security' },
  { id: 'judge', label: 'Judge Mode' },
];

const VALID = new Set<string>(ROUTES.map((r) => r.id));

function readRoute(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return (VALID.has(raw) ? raw : 'overview') as Route;
}

/** Tiny hash router: every route is a real link (#/workbench) and unknown hashes fall back to Overview. */
export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((r: Route) => {
    if (window.location.hash !== `#/${r}`) window.location.hash = `#/${r}`;
    else setRoute(r);
  }, []);

  return [route, navigate];
}
