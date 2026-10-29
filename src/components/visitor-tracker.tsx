"use client";
import { useEffect } from "react";

export function VisitorTracker() {
  useEffect(() => {
    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, userAgent: navigator.userAgent }),
    }).catch(() => {});
  }, []);
  return null;
}