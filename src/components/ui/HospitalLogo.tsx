import Image from "next/image";

interface HospitalLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: "dark" | "light";
  className?: string;
}

export function HospitalLogo({
  size = "md",
  showText = false,
  textColor = "dark",
  className = "",
}: HospitalLogoProps) {
  const pixelSizes = {
    sm: 32,
    md: 40,
    lg: 52,
    xl: 72,
  };

  const px = pixelSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-600/40 shadow-sm"
        style={{ width: px, height: px }}
      >
        <Image
          src="/images/logo/logo-103-photo.png"
          alt="Logo Bệnh viện Quân y 103"
          width={px}
          height={px}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {showText && (
        <div className="leading-tight">
          <p
            className={`text-xs font-black tracking-wider uppercase ${
              textColor === "light" ? "text-white" : "text-slate-900"
            }`}
          >
            Bệnh viện Quân y 103
          </p>
          <p
            className={`text-[11px] font-bold ${
              textColor === "light" ? "text-cyan-200" : "text-teal-700"
            }`}
          >
            Khoa Sinh hóa
          </p>
        </div>
      )}
    </div>
  );
}
