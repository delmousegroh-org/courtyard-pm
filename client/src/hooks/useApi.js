import { useEffect, useState } from 'react'

// Generic fetch hook: re-runs `fn` whenever `deps` changes, exposes
// {data, loading, error, refetch} so pages don't hand-roll this each time.
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  function load() {
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }))
  }

  useEffect(() => {
    // eslint-disable-next-line courtyard-pm-hooks/set-state-in-effect
    load()
    // eslint-disable-next-line courtyard-pm-hooks/exhaustive-deps
  }, [...deps])

  return { ...state, refetch: load }
}
