import { QueryClient } from '@tanstack/react-query';

const getBackendUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_BACKEND_URL || 'https://thhepaak-backend.onrender.com';
  }
  return 'https://thhepaak-backend.onrender.com';
};

const fullUrl = (path: string) => {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${path}`;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export { fullUrl };
