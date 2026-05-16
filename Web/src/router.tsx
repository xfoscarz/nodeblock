import { createBrowserRouter } from "react-router-dom";
import Home from "@/Pages/Home";
import RootLayout from "@/Layouts/RootLayout";

export default createBrowserRouter([
    {
        Component: RootLayout,

        children: [
            {
                index: true,
                Component: Home
            }
        ]
    }
]);