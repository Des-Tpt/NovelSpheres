'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { Toaster } from 'sonner';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() =>
        new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 180 * 1000,
                    refetchOnWindowFocus: false,
                },
            },
        })
    );

    const hidePathName = ['/chapter/', '/workspace/'];

    const pathname = usePathname();

    const hideHeader = hidePathName.some((path) => pathname.includes(path));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const adjustForKeyboard = () => {
            const targets = document.querySelectorAll<HTMLElement>('#send-form, .chat-input-wrapper');

            targets.forEach((el) => {
                const offset = window.innerHeight - (window.visualViewport?.height ?? window.innerHeight) - (window.visualViewport?.offsetTop ?? 0);
                el.style.setProperty('transform', `translateY(-${offset}px)`, 'important');
                el.style.setProperty('transition', 'transform 0.3s ease', 'important');
            });
        };

        const resetPosition = () => {
            const targets = document.querySelectorAll<HTMLElement>('#send-form, .chat-input-wrapper');
            targets.forEach((el) => {
                el.style.removeProperty('transform');
            });
        };

        const handleInputFocus = (e: Event) => {
            const input = e.target as HTMLInputElement | HTMLTextAreaElement;
            setTimeout(() => {
                input.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);
        };

        const handleInputBlur = () => {
            setTimeout(resetPosition, 300);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', adjustForKeyboard);
            window.visualViewport.addEventListener('scroll', adjustForKeyboard);
        }
        window.addEventListener('resize', adjustForKeyboard);

        // Input focus/blur handlers
        const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
            'input, textarea'
        );

        inputs.forEach((input) => {
            input.addEventListener('focus', handleInputFocus);
            input.addEventListener('blur', handleInputBlur);
        });

        // Observer để detect khi có input mới được thêm vào DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        const newInputs = element.querySelectorAll('input, textarea');
                        newInputs.forEach((input) => {
                            input.addEventListener('focus', handleInputFocus);
                            input.addEventListener('blur', handleInputBlur);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            // Cleanup với đúng function references
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', adjustForKeyboard);
                window.visualViewport.removeEventListener('scroll', adjustForKeyboard);
            }

            window.removeEventListener('resize', adjustForKeyboard);

            inputs.forEach((input) => {
                input.removeEventListener('focus', handleInputFocus);
                input.removeEventListener('blur', handleInputBlur);
            });

            observer.disconnect();

            // Reset positions khi component unmount
            resetPosition();
        };
    }, []);

    return (
        <html lang="en">
            <body>
                <QueryClientProvider client={queryClient}>
                    {!hideHeader && <Header />}
                    {children}
                    <Footer />
                </QueryClientProvider>
                <Toaster
                    theme="light"
                    position="bottom-right"
                    toastOptions={{
                        className: 'shadow-lg rounded-xl',
                        duration: 4000,
                        unstyled: false,
                    }}
                    closeButton
                />
            </body>
        </html>
    );
}