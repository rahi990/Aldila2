"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Date.now().toString();
        const newToast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="bg-card border border-border rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-bounce-in"
                        style={{
                            animation: "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
                        }}
                    >
                        {toast.type === "success" && (
                            <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                        )}
                        {toast.type === "error" && (
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                        )}
                        {toast.type === "info" && (
                            <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                        )}

                        <p className="text-white text-sm flex-1">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-muted-foreground hover:text-white transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
