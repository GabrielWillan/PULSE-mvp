import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type BottomBarActions = {
  addWorkoutRequestId: number;
  handledAddWorkoutRequestId: number;
  requestAddWorkout: () => void;
  markAddWorkoutHandled: (requestId: number) => void;
};

const BottomBarActionsContext = createContext<BottomBarActions | null>(null);

export function BottomBarActionsProvider({ children }: { children: ReactNode }) {
  const [addWorkoutRequestId, setAddWorkoutRequestId] = useState(0);
  const [handledAddWorkoutRequestId, setHandledAddWorkoutRequestId] = useState(0);

  const value = useMemo<BottomBarActions>(() => ({
    addWorkoutRequestId,
    handledAddWorkoutRequestId,
    requestAddWorkout: () => setAddWorkoutRequestId((current) => current + 1),
    markAddWorkoutHandled: (requestId) => setHandledAddWorkoutRequestId((current) => Math.max(current, requestId)),
  }), [addWorkoutRequestId, handledAddWorkoutRequestId]);

  return <BottomBarActionsContext.Provider value={value}>{children}</BottomBarActionsContext.Provider>;
}

export function useBottomBarActions() {
  const context = useContext(BottomBarActionsContext);
  if (!context) throw new Error('useBottomBarActions must be used inside BottomBarActionsProvider');
  return context;
}
