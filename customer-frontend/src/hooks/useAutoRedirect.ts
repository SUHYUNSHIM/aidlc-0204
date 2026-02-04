import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAutoRedirect(
  enabled: boolean,
  delay: number = 5000,
  redirectPath: string = '/customer/menu'
): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      navigate(redirectPath);
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, delay, redirectPath, navigate]);
}
