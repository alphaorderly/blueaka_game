import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <Toaster
                    position="bottom-center"
                    toastOptions={{
                        duration: 2400,
                        style: {
                            background: 'var(--foreground)',
                            color: 'var(--background)',
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 8px 24px -8px rgb(0 0 0 / 0.3)',
                        },
                        iconTheme: {
                            primary: 'var(--primary)',
                            secondary: 'var(--background)',
                        },
                    }}
                />
                <App />
            </QueryClientProvider>
        </BrowserRouter>
    </React.StrictMode>
);
