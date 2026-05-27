import Header from "@/components/ui/header/header";
import LoginForm  from "@/components/ui/admin-login/login-component";
import LoginLeft from "@/components/ui/admin-login/login-left";

export default function AdminLogin() {
    return (
        <main className="min-h-screen bg-background flex flex-col">
            <Header variant="default" />

            <div className="flex-1 w-full flex items-center justify-center">
            <div className="w-full max-w-6xl flex flex-row rounded-none shadow-xl -mt-10">
                <LoginLeft />
                <LoginForm />
            </div>
            </div>
        </main>
    );
}