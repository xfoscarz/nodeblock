import { AlertProvider } from "@/Components/AlertsProviderContext";
import { Outlet } from "react-router-dom";

export default function Layout() {
    return <>
    RootLayout
        <AlertProvider>
            <Outlet/>
        </AlertProvider>
    </>;
}