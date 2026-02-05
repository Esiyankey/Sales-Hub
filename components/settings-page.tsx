"use client";

import React from "react";

import { useAuth } from "@/lib/auth-context";
import {
  updateUser,
  exportUserData,
  importUserData,
  clearAllData,
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function SettingsPage() {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveSettings = () => {
    if (!user) return;
    if (!businessName.trim()) {
      setMessage("Business name cannot be empty");
      return;
    }

    setIsSaving(true);
    updateUser(user.id, businessName);
    setMessage("Settings saved successfully!");
    setTimeout(() => setMessage(""), 3000);
    setIsSaving(false);
  };

  const handleExport = () => {
    if (!user) return;
    const data = exportUserData(user.id);
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(data),
    );
    element.setAttribute(
      "download",
      `saleshub_backup_${new Date().toISOString().split("T")[0]}.json`,
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setMessage("Data exported successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        importUserData(content);
        setMessage("Data imported successfully!");
        setTimeout(() => setMessage(""), 3000);
      } catch (error) {
        setMessage("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (
      confirm(
        'Are you absolutely sure you want to delete ALL your data? This action cannot be undone. Type "YES" in the prompt to confirm.',
      )
    ) {
      const confirmation = prompt('Type "YES" to confirm:');
      if (confirmation === "YES") {
        clearAllData();
        setMessage("All data has been cleared.");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  };

  return (
    <div className="lg:ml-64 min-h-screen bg-background pt-16 lg:pt-0 pb-20 lg:pb-0">
      <div className="p-6 lg:p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your business preferences and data
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{message}</p>
          </div>
        )}

        {/* Business Settings */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Business Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Business Name
              </label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
              />
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Data Management
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Export your business data as a JSON file for backup or transfer
                to another device.
              </p>
              <Button
                onClick={handleExport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2m0 0v-8"
                  />
                </svg>
                Export Data
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Import a previously exported data file to restore or migrate
                your business data.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-center font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9-2-9-18-9 18 9 2m0 0v-8"
                    />
                  </svg>
                  Import Data
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-red-700 mb-4">Danger Zone</h2>
          <p className="text-sm text-red-600 mb-4">
            Clear all your business data. This action is permanent and cannot be
            undone.
          </p>
          <Button
            onClick={handleClearData}
            className="w-full bg-destructive text-white font-semibold rounded-lg hover:opacity-90"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear All Data
          </Button>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Info:</strong> All your data is stored locally in your
            browser and is never sent to any server. You have complete control
            over your data.
          </p>
        </div>
      </div>
    </div>
  );
}
