import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "@/router"

import "@/assets/font-awesome/css/fontawesome.css";
import "@/assets/font-awesome/css/all.min.css";
import "@/assets/base.css";

document.body.style = "";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router}/>
    </React.StrictMode>
);