import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getAllRoutines, type Routine } from '@/api/pulse-api';

type RoutinesContextValue = {
  routines: Routine[];
  loadingRoutines: boolean;
  routinesError: string;
  refreshRoutines: () => Promise<void>;
};

const RoutinesContext = createContext<RoutinesContextValue | null>(null);

export function PulseRoutinesProvider({ children }: { children: ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [routinesError, setRoutinesError] = useState('');

  const refreshRoutines = useCallback(async () => {
    setLoadingRoutines(true);
    setRoutinesError('');
    try {
      const rows = await getAllRoutines();
      setRoutines(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setRoutinesError(error instanceof Error ? error.message : 'Could not load routines');
    } finally {
      setLoadingRoutines(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getAllRoutines()
      .then((rows) => { if (mounted) setRoutines(Array.isArray(rows) ? rows : []); })
      .catch((error: unknown) => { if (mounted) setRoutinesError(error instanceof Error ? error.message : 'Could not load routines'); })
      .finally(() => { if (mounted) setLoadingRoutines(false); });
    return () => { mounted = false; };
  }, []);
  const value = useMemo(() => ({ routines, loadingRoutines, routinesError, refreshRoutines }), [routines, loadingRoutines, routinesError, refreshRoutines]);
  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}

export function usePulseRoutines() {
  const context = useContext(RoutinesContext);
  if (!context) throw new Error('usePulseRoutines must be used inside PulseRoutinesProvider');
  return context;
}
