import Image from "next/image";
import { initials } from "@/lib/format";

export function Avatar({
  fullName,
  url,
  size = 32,
}: {
  fullName: string;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt={fullName}
        width={size}
        height={size}
        className="shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className="flex shrink-0 items-center justify-center rounded-lg bg-accent/12 font-semibold text-accent"
    >
      {initials(fullName)}
    </span>
  );
}
