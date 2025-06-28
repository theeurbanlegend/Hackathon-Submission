"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}

export default function Notification({
  message,
  type,
  isVisible,
  onClose,
}: NotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon =
    type === "success" ? (
      <CheckCircle className="w-5 h-5" />
    ) : (
      <XCircle className="w-5 h-5" />
    );

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300`}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
