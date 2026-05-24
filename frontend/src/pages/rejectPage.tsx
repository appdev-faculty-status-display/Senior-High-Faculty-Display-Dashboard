import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.svg";

type PageState = "idle" | "loading" | "success" | "error";
type Urgency = "high" | "medium" | "low";

const REJECTION_REASONS = [
    "I am currently unavailable",
    "Please consult another teacher",
    "Outside consultation hours",
    "Please email me instead",
    "Other",
];

const URGENCY_STYLES: Record<Urgency, { label: string; color: string }> = {
    high: { label: "HIGH", color: "#ed3a30" },
    medium: { label: "MEDIUM", color: "#ff914d" },
    low: { label: "LOW", color: "#31ac52" },
};

export default function RejectPage() {
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get("requestId");
    const studentName = searchParams.get("studentName") || "";
    const reason = searchParams.get("reason") || "";
    const urgency = ((searchParams.get("urgency") || "low").toLowerCase() as Urgency);

    const [pageState, setPageState] = useState<PageState>("idle");
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [customReason, setCustomReason] = useState<string>("");
    const [selectionError, setSelectionError] = useState<string>("");
    const [errorDetail, setErrorDetail] = useState<string>("");

    const urgencyConfig = URGENCY_STYLES[urgency] || URGENCY_STYLES.low;

    const handleReject = async () => {
        if (!requestId) {
            setPageState("error");
            return;
        }

        if (!selectedReason) {
            setSelectionError("Please select a reason before confirming.");
            return;
        }

        if (selectedReason === "Other" && !customReason.trim()) {
            setSelectionError("Please type a custom reason.");
            return;
        }

        const finalReason = selectedReason === "Other" ? customReason.trim() : selectedReason;

        setSelectionError("");
        setPageState("loading");

        try {
            const response = await fetch(`/api/requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "rejected", rejectionReason: finalReason }),
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
                            <div className="text-lg font-black uppercase tracking-widest">Consultation Rejection</div>
                            <div className="text-sm text-white/90">Provide a reason for rejecting this request.</div>
                        </div>
                    </div>
                </div>
                <div className="h-2 bg-[#ffc107]" />

                <div className="bg-white border border-[#cbd5e1] px-5 py-6 mt-6">
                    {pageState === "success" ? (
                        <div className="flex flex-col items-start gap-4">
                            <div className="p-3 bg-[#ed3a30]/10">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 6l12 12M18 6L6 18" stroke="#ed3a30" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                                </svg>
                            </div>
                            <div className="font-black uppercase tracking-widest text-[#1a1a1a]">Rejection Submitted</div>
                            <div className="text-sm text-[#4f4f4f]">The student will see this update on their status page.</div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3 items-start mb-3">
                                <div className="uppercase tracking-widest font-black text-sm text-[#4f4f4f]">STUDENT</div>
                                <div className="col-span-2 text-sm text-[#1a1a1a]">{studentName}</div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 items-start mb-3">
                                <div className="uppercase tracking-widest font-black text-sm text-[#4f4f4f]">REASON</div>
                                <div className="col-span-2 text-sm text-[#1a1a1a]">{reason}</div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 items-center mb-3">
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

                            <div className="uppercase tracking-widest font-black text-sm mb-2">REASON FOR REJECTION:</div>

                            <div className="mb-3">
                                {REJECTION_REASONS.map((reasonOption) => {
                                    const isSelected = selectedReason === reasonOption;
                                    return (
                                        <button
                                            key={reasonOption}
                                            type="button"
                                            className={isSelected
                                                ? "w-full text-left border border-[#064db6] bg-[#064db6]/5 px-4 py-2 text-sm text-[#064db6] font-black mb-2"
                                                : "w-full text-left border border-[#cbd5e1] px-4 py-2 text-sm text-[#1a1a1a] font-medium mb-2"
                                            }
                                            onClick={() => {
                                                setSelectedReason(reasonOption);
                                                setSelectionError("");
                                            }}
                                        >
                                            {reasonOption}
                                        </button>
                                    );
                                })}

                                {selectedReason === "Other" && (
                                    <textarea
                                        className="w-full border border-[#cbd5e1] px-3 py-2 text-sm text-[#1a1a1a] mt-1 mb-2"
                                        placeholder="Type your custom reason here..."
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                    />
                                )}
                            </div>

                            {selectionError && <div className="text-[#ed3a30] text-sm mb-2">{selectionError}</div>}

                            {pageState === "error" && (
                                <div className="text-[#ed3a30] text-sm mb-3">
                                    Something went wrong. Please try again.
                                    {errorDetail && (
                                        <div className="text-xs bg-[#ed3a30]/5 border border-[#ed3a30]/20 px-3 py-2 mt-2 break-all">
                                            {errorDetail}
                                        </div>
                                    )}
                                </div>
                            )}

                            {pageState === "loading" ? (
                                <div className="text-sm text-[#4f4f4f]">Processing rejection...</div>
                            ) : (
                                <button
                                    type="button"
                                    className="w-full bg-[#ed3a30] text-white uppercase font-black tracking-widest px-4 py-2"
                                    onClick={handleReject}
                                >
                                    CONFIRM REJECTION
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
