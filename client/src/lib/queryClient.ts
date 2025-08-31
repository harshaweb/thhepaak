import { QueryClient } from '@tanstack/react-query';

const getBackendUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }
  return 'http://localhost:5173';
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
