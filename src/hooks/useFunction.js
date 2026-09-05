import { useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';
import { useFetch } from './useFetch';

function unwrapFunctionResult(result) {
  if (result?.error) throw result.error;
  const value = result?.data;
  if (value && typeof value === 'object' && !Array.isArray(value) && (value.success === false || value.error)) {
    const message = typeof value.error === 'string' ? value.error : value.error?.message;
    throw new Error(message || value.message || 'Function call failed');
  }
  return value;
}

export function useFunction(functionName, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const fetcher = useCallback(async (body) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    return unwrapFunctionResult(await supabase.functions.invoke(functionName, { body }));
  }, [functionName]);
  const failedRef = useRef(null);
  const guardedFetcher = useCallback(async (...args) => { failedRef.current = null; try { return await fetcher(...args); } catch (err) { failedRef.current = err; throw err; } }, [fetcher]);
  const { data, loading, error, run, setData } = useFetch(guardedFetcher, { initialLoading: false });
  const invoke = useCallback(async (...args) => { const result = await run(...args); const { successMessage, showError } = optionsRef.current; const err = failedRef.current; if (err) { if (showError !== false) toast.error(err.message || 'Function call failed'); return undefined; } if (successMessage) toast.success(successMessage); return result; }, [run]);
  const reset = useCallback(() => setData(null), [setData]);
  return { invoke, loading, data, error, reset };
}
