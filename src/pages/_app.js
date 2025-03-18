import { PrimeReactProvider } from 'primereact/api';
import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import { ToastProvider } from '@/hooks/useToast';
import { SessionProvider } from "next-auth/react"
import Layout from '@/components/Layout';
import '@/styles/globals.css'
import 'primereact/resources/themes/lara-dark-blue/theme.css'
import '@/styles/custom-theme.css'; // custom theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { useRouter } from 'next/router';
import { NDKProvider } from '@/context/NDKContext';
import { Analytics } from '@vercel/analytics/react';
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import BottomBar from '@/components/BottomBar';

const queryClient = new QueryClient()

export default function MyApp({
    Component, pageProps: { session, ...pageProps }
}) {
    const router = useRouter();

    return (
        <PrimeReactProvider>
            <SessionProvider session={session}>
                <NDKProvider>
                    <QueryClientProvider client={queryClient}>
                        <ToastProvider>
                            <Layout>
                                <div className="flex flex-col min-h-screen">
                                    <Navbar />
                                    <main>
                                        <Component {...pageProps} />
                                        <Analytics />
                                    </main>
                                    <BottomBar />
                                </div>
                            </Layout>
                        </ToastProvider>
                    </QueryClientProvider>
                </NDKProvider>
            </SessionProvider>
        </PrimeReactProvider>
    );
}