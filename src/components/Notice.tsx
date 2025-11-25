"use client";

import { Volume2 } from "lucide-react";

interface NoticeProps {
    text: string;
}

export function Notice({ text }: NoticeProps) {
    return (
        <div className="bg-card border-y border-border py-2 px-4 flex items-center gap-3 overflow-hidden">
            <Volume2 className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 overflow-hidden relative h-6">
                <div className="absolute whitespace-nowrap animate-marquee text-sm text-white font-medium">
                    {text}
                </div>
            </div>
        </div>
    );
}
