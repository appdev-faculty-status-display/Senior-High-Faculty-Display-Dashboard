import Logo from "@/assets/logo.svg";

export default function LoginLeft() {
    return (
        <div className="hidden lg:flex flex-col items-center justify-center bg-secondary text-white p-12 w-1/2">
            <div className="mb-8">
                <img src={Logo} alt="NU Logo" className="w-48 h-auto" />
            </div>

            <div className="text-center space-y-0.5">
                <h1 className="text-4xl tracking-tight font-bold">NU Laguna</h1>
                <h2 className="text-3xl tracking-tight font-semibold">SSHS Display Board</h2>
            </div>
        </div>
    )
}