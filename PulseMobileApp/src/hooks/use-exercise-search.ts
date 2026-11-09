import { useEffect, useState } from 'react';

import { searchExercises, type ExerciseSearchResult } from '@/api/pulse-api';

type SearchState = {
  query: string;
  results: ExerciseSearchResult[];
  loading: boolean;
  error: string;
};

const emptyState: SearchState = { query: '', results: [], loading: false, error: '' };

export function useExerciseSearch(query: string, enabled = true) {
  const normalizedQuery = query.trim();
  const canSearch = enabled && normalizedQuery.length >= 2;
  const [state, setState] = useState<SearchState>(emptyState);

  useEffect(() => {
    if (!canSearch) return undefined;

    let active = true;
    const timer = setTimeout(() => {
      setState({ query: normalizedQuery, results: [], loading: true, error: '' });
      searchExercises(normalizedQuery)
        .then((rows) => {
          if (!active) return;
          setState({ query: normalizedQuery, results: Array.isArray(rows) ? rows : [], loading: false, error: '' });
        })
        .catch((error: unknown) => {
          if (!active) return;
          setState({
            query: normalizedQuery,
            results: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Could not search exercises',
          });
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [canSearch, normalizedQuery]);

  const currentState = canSearch && state.query === normalizedQuery ? state : emptyState;
  return {
    results: currentState.results,
    loading: currentState.loading,
    error: currentState.error,
    searched: canSearch && currentState.query === normalizedQuery && !currentState.loading,
    canSearch,
  };
}
