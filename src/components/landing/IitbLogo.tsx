"use client";

import { useState } from "react";

/**
 * The IIT Bombay logo from /public/iitb/logo.png. It takes no space until that
 * file exists and has loaded, so the text beside it stays aligned either way.
 */
export default function IitbLogo({ className = "" }: { className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={(el) => {
        // The image may finish loading before React attaches onLoad.
        if (el && !ok && el.complete && el.naturalWidth > 0) setOk(true);
      }}
      src="/iitb/logo.png"
      alt=""
      onLoad={() => setOk(true)}
      className={ok ? className : "pointer-events-none absolute h-0 w-0 opacity-0"}
    />
  );
}
