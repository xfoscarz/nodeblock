import React, { createContext, useContext, useState } from "react";

type Alert = {
    id: number;
    message: string;
    icon: { name: string, color?: string };
};

type AlertContextType = {
    showAlert(message: string, icon?: { name: string, color?: string } | string): void;
};

const ALERT_DURATION = 4000;

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [ alerts, setAlerts ] = useState<Alert[]>([]);

    const showAlert: AlertContextType["showAlert"] = (message: string, icon?: { name: string, color?: string } | string) => {
        const ID = Date.now();

        setAlerts([...alerts, {
            id: ID,
            icon: {
                color: (typeof icon == "string") ? "" : (icon?.color),
                name: (typeof icon == "string") ? icon : (icon?.name || "")
            },
            message
        }]);

        setTimeout(() => {
            setAlerts(previous => previous.filter(alert => alert.id != ID));
        }, ALERT_DURATION);
    };

    return <AlertContext.Provider value={{ showAlert }}>
        {children}
        <div className="absolute top-0 left-0 w-screen h-screen flex flex-row justify-end p-3.5 pointer-events-none overflow-hidden">
            <div className="flex flex-col-reverse w-fit max-w-[50%] h-full gap-4 items-end">{alerts.map(alert => {
                return <div className="pointer-events-auto bg-bg-primary animate-alert-in-right space-x-1.5 py-2 px-3 rounded-lg text-sm w-fit" style={{ animationDuration: `${ALERT_DURATION}ms` }} key={alert.id}>
                    {
                        alert.icon.name
                            ? <i className={`fas fa-${alert.icon.name}`} style={{ color: alert.icon.color }}></i>
                            : ""
                    }
                    <span>{alert.message}</span>
                </div>;
            })}</div>
        </div>
    </AlertContext.Provider>;
}

export function useAlerts(): AlertContextType["showAlert"] {
    const context = useContext(AlertContext);

    if (!context) {
        throw new Error("useAlerts() must be wrapped in <AlertProvider>");
    }

    return context.showAlert;
}