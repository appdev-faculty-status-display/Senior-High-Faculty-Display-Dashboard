import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface FooterProps {
  announcements?: string[];
}

const defaultAnnouncements = [
    "Developed by Keith, Krisha, Clarence, Aze, Eli, James, and Adrienne",
    "Developed by Keith, Krisha, Clarence, Aze, Eli, James, and Adrienne",
    "Developed by Keith, Krisha, Clarence, Aze, Eli, James, and Adrienne",
    "Developed by Keith, Krisha, Clarence, Aze, Eli, James, and Adrienne",
  ];

const requestURL = new URL("/request", window.location.origin).toString();

const Footer: React.FC<FooterProps> = ({ announcements = defaultAnnouncements }) => {
  return (
    <footer className="fixed left-0 bottom-0 w-full flex items-stretch z-50 font-sans">
      {/* Left side: Ticker section */}
      <div className="flex flex-1 items-center bg-[#ffb800] min-h-11 px-3 gap-2 overflow-hidden">
        <div className="w-8 h-8 min-w-8 rounded-full bg-[#f5a800] flex items-center justify-center text-white text-[15px] leading-none shrink-0">
          🔔
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1 min-w-0">
          <div className="inline-flex animate-ticker">
            {/* Doubling the array for a seamless infinite loop animation */}
            {[...announcements, ...announcements].map((msg, index) => (
              <span
                key={`${msg}-${index}`}
                className="text-[15px] font-semibold text-[#1a1a1a] mr-16"
              >
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: QR/Contact section */}
      <div className="w-67.5 h-11 bg-[#0a2f66] text-white flex items-center justify-between px-3 gap-2 shrink-0">
        <div className="min-w-0">
          <h3 className="m-0 text-[13px] leading-[1.1] font-bold">
            Consultation Request Form
          </h3>
          <p className="mt-1 text-[9px] leading-[1.2]">
            Scan to Schedule a Meeting
          </p>
        </div>

        <div className="w-10 h-10 shrink-0 bg-white p-0.5 rounded-none">
          <QRCodeSVG
            value={requestURL}
            size={36}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            role="img"
            aria-label="QR Code for consultation request form"
            title="QR Code for the consultation request form"
          />
        </div>

      </div>
    </footer>
  );
};

export default Footer;