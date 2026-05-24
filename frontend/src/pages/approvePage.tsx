import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.svg";

type PageState = "loading" | "success" | "error";
type Urgency = "high" | "medium" | "low";

const URGENCY_STYLES: Record<Urgency, { label: string; color: string }> = {
    high: { label: "HIGH", color: "#ed3a30" },
    medium: { label: "MEDIUM", color: "#ff914d" },
    low: { label: "LOW", color: "#31ac52" },
};

export default function ApprovePage() {
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get("requestId");
    const studentName = searchParams.get("studentName") || "";
    const reason = searchParams.get("reason") || "";
    const urgency = ((searchParams.get("urgency") || "low").toLowerCase() as Urgency);

    const [pageState, setPageState] = useState<PageState>("loading");
    const [errorDetail, setErrorDetail] = useState<string>("");

    useEffect(() => {
        const handleApprove = async () => {
            if (!requestId) {
                setErrorDetail("No requestId found in URL.");
                setPageState("error");
                return;
            }

            try {
                const response = await fetch(`/api/requests/${requestId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "approved" }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    setErrorDetail(`Server responded with ${response.status}: ${text}`);
                    throw new Error("Request failed");
                }
                setPageState("success");
            } catch (err) {
                if (!errorDetail) setErrorDetail(String(err));
                setPageState("error");
            }
        };

        void handleApprove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId]);

    const urgencyConfig = URGENCY_STYLES[urgency] || URGENCY_STYLES.low;

    return (
        <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                <div
                    className="w-full"
                    style={{ background: "linear-gradient(135deg, #002f73 0%, #064db6 100%)" }}
                >
                    <div className="flex items-center px-5 py-4">
                        <img src={logo} alt="logo" className="w-12 h-12" />
                        <div className="ml-4 text-white">
                            <div className="text-lg font-black uppercase tracking-widest">Consultation Approval</div>
                            <div className="text-sm text-white/90">Approving student consultation request.</div>
                        </div>
                    </div>
                </div>
                <div className="h-2 bg-[#ffc107]" />

                <div className="bg-white border border-[#cbd5e1] px-5 py-6 mt-6">
                    <div className="grid grid-cols-3 gap-3 items-start mb-3">
                        <div className="uppercase tracking-widest font-black text-sm text-[#4f4f4f]">STUDENT</div>
                        <div className="col-span-2 text-sm text-[#1a1a1a]">{studentName}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-start mb-3">
                        <div className="uppercase tracking-widest font-black text-sm text-[#4f4f4f]">REASON</div>
                        <div className="col-span-2 text-sm text-[#1a1a1a]">{reason}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-center mb-6">
                        <div className="uppercase tracking-widest font-black text-sm text-[#4f4f4f]">URGENCY</div>
                        <div className="col-span-2">
                            <span
                                className="inline-block px-3 py-1 text-white uppercase tracking-widest font-black"
                                style={{ backgroundColor: urgencyConfig.color }}
                            >
                                {urgencyConfig.label}
                            </span>
                        </div>
                    </div>

                    {pageState === "loading" && (
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-[#064db6] animate-pulse" />
                            <div className="text-sm text-[#4f4f4f]">Processing approval...</div>
                        </div>
                    )}

                    {pageState === "success" && (
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 bg-[#31ac52]/10">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 6L9 17l-5-5" stroke="#31ac52" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                                </svg>
                            </div>
                            <div className="font-black uppercase tracking-widest text-[#1a1a1a]">Consultation Approved</div>
                            <div className="text-sm text-[#4f4f4f]">The student will see this update on their status page.</div>
                        </div>
                    )}

                    {pageState === "error" && (
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 bg-[#ed3a30]/10">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 6l12 12M18 6L6 18" stroke="#ed3a30" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                                </svg>
                            </div>
                            <div className="font-black uppercase tracking-widest text-[#ed3a30]">Something Went Wrong</div>
                            <div className="text-sm text-[#4f4f4f]">Please close this tab and try again from Teams.</div>
                            {errorDetail && (
                                <div className="text-xs text-[#ed3a30] bg-[#ed3a30]/5 border border-[#ed3a30]/20 px-3 py-2 w-full break-all">
                                    {errorDetail}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
