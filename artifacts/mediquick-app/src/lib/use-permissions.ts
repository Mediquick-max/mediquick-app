import { useEffect } from "react";

/**
 * Auto-requests all browser permissions used by MediQuick on app load.
 * - Notifications: for medicine reminders
 * - Camera + Microphone: for video consultation (Jitsi) and AI voice input
 */
export function usePermissions() {
  useEffect(() => {
    requestNotificationPermission();
    requestCameraAndMicPermission();
  }, []);
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // Permission API not supported or denied silently
    }
  }
}

async function requestCameraAndMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    // Request both camera and mic; immediately stop the stream after permission granted
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach(track => track.stop());
  } catch {
    // User denied or device not available — handled gracefully per-feature
    try {
      // Fallback: try mic only (for AI voice input)
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getTracks().forEach(track => track.stop());
    } catch {
      // Mic also denied — no action needed, features will show manual prompts
    }
  }
}
