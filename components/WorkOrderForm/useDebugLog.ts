"use client";

import React from "react";

export function useDebugLog() {
  const [debugMode, setDebugMode] = React.useState(false);

  // Sync from localStorage after hydration to avoid server/client mismatch.
  React.useEffect(() => {
    setDebugMode(localStorage.getItem("debug_mode_enabled") === "true");
  }, []);

  const [debugLogs, setDebugLogs] = React.useState<string[]>([]);

  React.useEffect(() => {
    localStorage.setItem("debug_mode_enabled", debugMode.toString());
  }, [debugMode]);

  React.useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("photo_debug_logs");
      let logs: string[] = [];
      if (savedLogs) {
        logs = JSON.parse(savedLogs);
      }
      const reloadEntry = `${new Date().toLocaleTimeString()}: --- PAGE RELOAD / SUCCESSFUL REBOOT ---`;
      const updatedLogs = [...logs, reloadEntry];
      setDebugLogs(updatedLogs);
      localStorage.setItem("photo_debug_logs", JSON.stringify(updatedLogs));
    } catch (e) {
      console.error("Failed to load debug logs", e);
    }
  }, []);

  const addDebugLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    let memoryStatus = "";
    const perf = (window.performance as any);
    if (perf && perf.memory) {
      const used = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024);
      memoryStatus = ` [RAM: ${used}MB/${total}MB]`;
    }
    const logEntry = `${timestamp}${memoryStatus}: ${msg}`;
    console.log("DEBUG:", msg);
    setDebugLogs((prev) => {
      const newLogs = [...prev, logEntry];
      try {
        localStorage.setItem("photo_debug_logs", JSON.stringify(newLogs));
      } catch (e) {
        console.error("Failed to save log to local storage", e);
      }
      return newLogs;
    });
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
    localStorage.removeItem("photo_debug_logs");
  };

  return { debugMode, setDebugMode, debugLogs, addDebugLog, clearDebugLogs };
}
