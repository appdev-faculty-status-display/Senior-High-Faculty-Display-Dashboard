import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.svg";

type Status = "pending" | "approved" | "rejected";

export default function StatusPage() {
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get("requestId");

    const [status, setStatus] = useState<Status>("pending");
    const [rejectionReason, setRejectionReason] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const pollIntervalMs = 1500;

    useEffect(() => {
        if (!requestId) return;

        let mounted = true;

        const poll = async () => {
            try {
                const res = await fetch(`/api/requests/${requestId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setErrorMessage("This request is not available yet. Checking again soon.");
                        setLoading(true);
                    }
                    return;
                }

                setErrorMessage("");
                const data: { status: string; rejectionReason: string | null } = await res.json();
                if (!mounted) return;
                const s = (data.status as Status) || "pending";
                setStatus(s);
                setRejectionReason(data.rejectionReason || "");
                setLoading(false);
                if (s !== "pending") {
                    clearInterval(intervalId);
                }
            } catch {
                if (mounted) {
                    setErrorMessage("Unable to load request status right now.");
                    setLoading(false);
                }
            }
        };

        poll();
        const intervalId = setInterval(poll, pollIntervalMs);

        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, [requestId]);

    return (
        <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                <div
                    className="w-full"
                    style={{
                        background: "linear-gradient(135deg, #002f73 0%, #064db6 100%)",
                    }}
                >
                    <div className="flex items-center px-5 py-4">
                        <img src={logo} alt="logo" className="w-12 h-12" />
                        <div className="ml-4 text-white">
                            <div className="text-lg font-black">Consultation Status</div>
                            <div className="text-sm text-white/90">Track your consultation request in real time.</div>
                        </div>
                    </div>
                </div>
                <div className="h-2 bg-[#ffc107]" />

                <div className="bg-white border border-[#cbd5e1] px-5 py-6 mt-6">
                    {status === "pending" && (
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 bg-[#ffc107] animate-pulse" />
                                <h2 className="text-[#1a1a1a] font-black">Waiting for Teacher Response</h2>
                            </div>
                            <p className="text-sm text-[#4f4f4f]">This page updates automatically. Please keep it open.</p>
                            {loading && <div className="text-sm text-[#4f4f4f]">Loading…</div>}
                            {errorMessage && <div className="text-sm text-[#ed3a30]">{errorMessage}</div>}
                        </div>
                    )}

                    {status === "approved" && (
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#31ac52]/10">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 6L9 17l-5-5" stroke="#31ac52" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                                    </svg>
                                </div>
                                <h2 className="text-[#1a1a1a] font-black">Consultation Approved</h2>
                            </div>
                            <p className="text-sm text-[#4f4f4f]">Please proceed to the faculty room.</p>
                        </div>
                    )}

                    {status === "rejected" && (
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#ed3a30]/10">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 6l12 12M18 6L6 18" stroke="#ed3a30" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                                    </svg>
                                </div>
                                <h2 className="text-[#1a1a1a] font-black">Request Not Approved</h2>
                            </div>
                            <div className="bg-[#f5f6fa] border border-[#cbd5e1] px-4 py-3 w-full">
                                <p className="text-sm text-[#4f4f4f]">{rejectionReason || "No reason provided."}</p>
                            </div>
                        </div>
                    )}

                    {errorMessage && status !== "pending" && (
                        <div className="mt-4 text-sm text-[#ed3a30]">{errorMessage}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
