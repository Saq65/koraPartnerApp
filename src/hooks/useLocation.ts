import { useEffect, useState } from 'react';

export function useLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    setLocation(null);
  }, []);

  return { location };
}
