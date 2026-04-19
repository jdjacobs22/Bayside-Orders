"use client";

import { useState, useEffect } from "react";

/**
 * Manages the debug log system: persisted mode toggle, in-memory + localStorage logs,
 * and helpers to add/clear entries. Useful for diagnosing issues on mobile devices
 * where console access is limited.
 */
export function useDebugLogs() {
  const [debugMode, setDebugMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("debug_mode_enabled") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("debug_mode_enabled", debugMode.toString());
  }, [debugMode]);

  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Load persisted logs on mount and append a reload marker
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("photo_debug_logs");
      const logs = savedLogs ? JSON.parse(savedLogs) : [];
      const reloadEntry = `${new Date().toLocaleTimeString()}: --- PAGE RELOAD / SUCCESSFUL REBOOT ---`;
      const updatedLogs = [...logs, reloadEntry];
      setDebugLogs(updatedLogs);
      localStorage.setItem("photo_debug_logs", JSON.stringify(updatedLogs));
    } catch (e) {
      console.error("Failed to load debug logs", e);
    }
  }, []);

  /**
   * Appends a timestamped message to the log, including heap memory info on
   * browsers that expose it (Chrome/Android).
   */
  const addDebugLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    let memoryStatus = "";
    const perf = (window.performance as any);
    if (perf?.memory) {
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
