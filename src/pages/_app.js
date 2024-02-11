import { PrimeReactProvider } from 'primereact/api';
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import Navbar from '@/components/navbar/Navbar';
import { ToastProvider } from '@/hooks/useToast';
import '@/styles/globals.css'
import 'primereact/resources/themes/lara-dark-indigo/theme.css';

export default function MyApp({
    Component, pageProps: { ...pageProps }
}) {
    return (
        <Provider store={store}>
            <PrimeReactProvider>
                <ToastProvider>
                    <Navbar />
                    <Component {...pageProps} />
                </ToastProvider>
            </PrimeReactProvider>
        </Provider>
    );
}