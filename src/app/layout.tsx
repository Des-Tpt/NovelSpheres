'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { Toaster } from 'sonner';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 180 * 1000,
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
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            className: "bg-gray-900 text-white shadow-lg rounded-xl",
            duration: 4000,
            unstyled: false,
          }}
          closeButton />
      </body>
    </html>
  );
}