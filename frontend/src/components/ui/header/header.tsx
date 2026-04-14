import React from "react";
import { cn } from "@/lib/utils";
import nuLogo from "@/assets/logo.svg";

interface HeaderProps {
    variant?: "default" | "admin";
}

const Header = ({ variant = "default" }: HeaderProps) => {
    const isAdmin = variant === "admin";

    return (
        <header className={cn("w-full shadow-sm", isAdmin ? "bg-white" : "bg-secondary-active")}>

            <div className="flex items-center gap-4 px-4 py-2">
                <div className="h-16 w-16">
                    <img src={nuLogo} alt="NU Logo" className="h-full w-full object-contain" />
                </div>
                <div className={cn("flex flex-col leading-tight", isAdmin ? "text-secondary-active" : "text-white")}>
                    <h1 className="font-bold tracking-tight text-3xl">NU LAGUNA</h1>
                    <p className="text-sm font-medium opacity-95 text-base">SSHS Faculty Status Display Board</p>
                </div>
            </div>

            <div className="relative h-1.5 w-full overflow-hidden">
                <div className="absolute inset-0 flex">
                    <div className={cn("h-full w-full", 
                        isAdmin ? 
                            "bg-gradient-to-r from-secondary via-[#E8C35E] to-secondary" : 
                            "bg-gradient-to-r from-primary via-white to-primary"
                        )}> 
                    </div>
                </div>
            </div>
        </header>
    );
}   

export default Header;