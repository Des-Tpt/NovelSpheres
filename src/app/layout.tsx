// app/layout.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css'; 
import Header from '@/components/header/Header';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Tạo QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Tùy chỉnh mặc định cho queries
        staleTime: 60 * 1000, // Dữ liệu hết hạn sau 1 phút
        refetchOnWindowFocus: false, // Không refetch khi focus lại tab
      },
    },
  }));

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <Header />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}