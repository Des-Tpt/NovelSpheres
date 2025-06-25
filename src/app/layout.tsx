// app/layout.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css'; 
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Tạo QueryClient instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Tùy chỉnh mặc định cho queries
        staleTime: 180 * 1000, // Dữ liệu hết hạn sau 3 phút
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <Header />
          {children}
          <Footer />
        </QueryClientProvider>
      </body>
    </html>
  );
}