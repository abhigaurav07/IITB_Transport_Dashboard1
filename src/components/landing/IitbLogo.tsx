"use client";

import { useState } from "react";

/** The IIT Bombay logo from /public/iitb/logo.png. Renders nothing until that file is added. */
export default function IitbLogo({ className = "" }: { className?: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/iitb/logo.png" alt="" onError={() => setMissing(true)} className={className} />;
}
