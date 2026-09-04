"use client";

import Image from "next/image";
import { useState } from "react";
import { avatarImageSrc, initialsFromName } from "@/lib/avatar";

export function UserAvatar({
  name,
  imageUrl,
  size = 28,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  const src = avatarImageSrc(imageUrl);
  const [failed, setFailed] = useState(false);
  const initials = initialsFromName(name);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper/20 font-label text-paper ring-1 ring-paper/35"
      style={{ width: size, height: size }}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage && src ? (
        <Image
          src={src}
          alt={`${name}'s profile photo`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[0.62rem] tracking-[0.06em]">{initials}</span>
      )}
    </span>
  );
}
