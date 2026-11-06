"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Plus, Check, AlertCircle, Sparkles, Loader2, History } from "lucide-react";
import { api } from "../utils/api";

interface Chore {
  _id: string;
  name: string;
  targetMinutes: number;
  category: string;
}

interface LogPastTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  chores: Chore[];
  defaultDate?: string;
  onSuccess: (message?: string) => void;
}

export default function LogPastTaskModal({
  isOpen,
  onClose,
  chores,
  defaultDate,
  onSuccess,
}: LogPastTaskModalProps) {
  const getLocalDateString = (offsetDays: number = 0) => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(-1);
  const twoDaysAgoStr = getLocalDateString(-2);

  const [date, setDate] = useState<string>(yesterdayStr);
  const [choreId, setChoreId] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("30");
  const [logMode, setLogMode] = useState<"add" | "set">("add");
  const [existingMinutes, setExistingMinutes] = useState<number | null>(null);
  const [checkingExisting, setCheckingExisting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected chore when opened or chores change
  useEffect(() => {
    if (chores.length > 0 && (!choreId || !chores.some(c => c._id === choreId))) {
      setChoreId(chores[0]._id);
    }
  }, [chores, choreId]);

  // Reset date on modal open (prefers defaultDate if provided, otherwise yesterday)
  useEffect(() => {
    if (isOpen) {
      setDate(defaultDate || yesterdayStr);
      setError(null);
      if (chores.length > 0) {
        setChoreId(chores[0]._id);
      }
    }
  }, [isOpen, defaultDate]);

  // Check if a time log already exists for selected chore & date
  useEffect(() => {
    if (!isOpen || !choreId || !date) return;

    let isCancelled = false;
    const checkExistingLog = async () => {
      try {
        setCheckingExisting(true);
        const res = await api.get(`/logs?date=${date}&choreId=${choreId}`);
        if (!isCancelled) {
          if (res.data && res.data.length > 0) {
            setExistingMinutes(res.data[0].minutes || 0);
          } else {
            setExistingMinutes(0);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error checking existing log:", err);
          setExistingMinutes(0);
        }
      } finally {
        if (!isCancelled) {
          setCheckingExisting(false);
        }
      }
    };

    checkExistingLog();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, choreId, date]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const parsedInputMinutes = Math.max(0, parseInt(minutes, 10) || 0);
  const currentLogged = existingMinutes || 0;
  const finalMinutes = logMode === "add" && currentLogged > 0
    ? currentLogged + parsedInputMinutes
    : parsedInputMinutes;

  const selectedChore = chores.find(c => c._id === choreId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!choreId) {
      setError("Please select a chore routine");
      return;
    }

    if (!date) {
      setError("Please pick a valid date");
      return;
    }

    if (finalMinutes <= 0) {
      setError("Please enter a valid duration greater than 0 minutes");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/logs", {
        choreId,
        date,
        minutes: finalMinutes,
      });

      const choreName = selectedChore?.name || "Chore";
      onSuccess(`Successfully logged ${finalMinutes}m for "${choreName}" on ${date}!`);
      onClose();
    } catch (err: any) {
      console.error("Error logging past task:", err);
      setError(err.response?.data?.message || err.message || "Failed to log past task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const presetMinutes = [15, 30, 45, 60, 90, 120];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
        {/* Backdrop click dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !submitting && onClose()}
          className="fixed inset-0"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden z-10"
        >
          {/* Header Bar */}
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <History size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Log Past Task</h3>
                <p className="text-xs font-semibold text-slate-400">Record minutes for a previous day's activity</p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-semibold flex items-center gap-2.5"
              >
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* 1. Date Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar size={14} className="text-violet-600" />
                  Select Date
                </label>
                {/* Date Shortcut Pills */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate(yesterdayStr)}
                    className={`px-2.5 py-1 text-xxs font-extrabold rounded-lg border transition-all cursor-pointer ${
                      date === yesterdayStr
                        ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(twoDaysAgoStr)}
                    className={`px-2.5 py-1 text-xxs font-extrabold rounded-lg border transition-all cursor-pointer ${
                      date === twoDaysAgoStr
                        ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    2 Days Ago
                  </button>
                </div>
              </div>

              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
              />
            </div>

            {/* 2. Chore Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-violet-600" />
                Select Chore Routine
              </label>

              {chores.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  No active routines found. Please create a chore routine first.
                </div>
              ) : (
                <select
                  value={choreId}
                  onChange={(e) => setChoreId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                >
                  {chores.map((chore) => (
                    <option key={chore._id} value={chore._id} className="text-slate-800">
                      {chore.name} ({chore.category}) — Target: {chore.targetMinutes}m
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Existing log notification / Mode selector */}
            {currentLogged > 0 && (
              <div className="p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-violet-600" />
                    Already logged on this day:
                  </span>
                  <span className="text-xs font-extrabold text-violet-700 bg-violet-200/70 px-2 py-0.5 rounded-md">
                    {currentLogged} mins
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setLogMode("add")}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      logMode === "add"
                        ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Add to existing (+{parsedInputMinutes}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogMode("set")}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      logMode === "set"
                        ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Overwrite total ({parsedInputMinutes}m)
                  </button>
                </div>
              </div>
            )}

            {/* 3. Duration Input & Preset Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock size={14} className="text-violet-600" />
                  {currentLogged > 0 && logMode === "add" ? "Minutes to Add" : "Total Minutes Spent"}
                </label>
                <span className="text-xs font-extrabold text-violet-600">
                  {parsedInputMinutes}m ({(parsedInputMinutes / 60).toFixed(1)} hrs)
                </span>
              </div>

              {/* Number Input */}
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  minutes
                </span>
              </div>

              {/* Quick minute pills */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {presetMinutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(String(m))}
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                      parsedInputMinutes === m
                        ? "bg-violet-100 border-violet-400 text-violet-700"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xxs font-extrabold uppercase tracking-wider text-slate-400 block">
                  New Total for {date}
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {selectedChore?.name || "Selected Chore"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-violet-600">
                  {finalMinutes}m
                </span>
                <span className="text-xs font-bold text-slate-400 block">
                  ({(finalMinutes / 60).toFixed(1)} hrs)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || chores.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-violet-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Save Past Task
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

