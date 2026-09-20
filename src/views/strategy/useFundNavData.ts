import { useState, useEffect } from 'react';
import { NavType } from '../../types/types';
import { fetchMFbySchemeCode } from '../../data/api/mfApi';
export function useFundNavData(schemeCode: string) {
  const [navData, setNavData] = useState<NavType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!schemeCode || !/^\d+$/.test(schemeCode)) return;
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);
    fetchMFbySchemeCode(schemeCode)
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setNavData(data);
          } else {
            setNavData([]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch NAV');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [schemeCode]);
  return { navData, isLoading, error };
}
