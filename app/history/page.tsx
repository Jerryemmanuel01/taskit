"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, BarChart2, Clock, Filter, ListTodo, Award, HelpCircle } from "lucide-react";
import { api, getLoggedInUser } from "../../utils/api";
import GlassCard from "../../components/GlassCard";

interface Chore {
  _id: string;
  name: string;
  targetMinutes: number;
  category: string;
}

interface TimeLog {
  _id: string;
  chore: Chore;
  date: string;
  minutes: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"date" | "chore">("date");
  const [loading, setLoading] = useState(true);
  
  // Date filter states
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [dateLogs, setDateLogs] = useState<TimeLog[]>([]);

  // Chore filter states
  const [chores, setChores] = useState<Chore[]>([]);
  const [selectedChoreId, setSelectedChoreId] = useState<string>("");
  const [choreLogs, setChoreLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    const loggedUser = getLoggedInUser();
    if (!loggedUser) {
      router.push("/auth/login");
    } else {
      loadInitialData();
    }
  }, [router]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Fetch chores first
      const choresRes = await api.get("/chores");
      const choresData = choresRes.data;
      setChores(choresData);
      if (choresData.length > 0) {
        setSelectedChoreId(choresData[0]._id);
      }
      
      // Fetch today's logs for date filter tab
      await fetchDateLogs(selectedDate);
    } catch (err) {
      console.error("Error loading initial history data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateLogs = async (date: string) => {
    try {
      const res = await api.get(`/logs?date=${date}`);
      setDateLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs for date:", err);
    }
  };

  const fetchChoreLogs = async (choreId: string) => {
    if (!choreId) return;
    try {
      const res = await api.get(`/logs?choreId=${choreId}`);
      setChoreLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs for chore:", err);
    }
  };

  // Trigger fetch when inputs change
  useEffect(() => {
    if (activeTab === "date") {
      fetchDateLogs(selectedDate);
    }
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === "chore" && selectedChoreId) {
      fetchChoreLogs(selectedChoreId);
    }
  }, [selectedChoreId, activeTab]);

  // Total daily minutes calculation
  const totalDailyMinutes = dateLogs.reduce((sum, log) => sum + log.minutes, 0);

  // Total chore minutes calculation
  const totalChoreMinutes = choreLogs.reduce((sum, log) => sum + log.minutes, 0);

  const selectedChore = chores.find(c => c._id === selectedChoreId);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 relative">
      {/* Background radial glows */}
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
          <BarChart2 className="text-violet-600" size={32} />
          Logs & History
        </h1>
        <p className="text-slate-500 mt-1.5 font-medium">
          Filter and manage time logs by specific date or individual daily chore.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-slate-200 pb-px mb-8">
        <button
          onClick={() => setActiveTab("date")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${
            activeTab === "date"
              ? "border-violet-650 text-violet-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Calendar size={16} />
          Filter by Date
        </button>
        <button
          onClick={() => setActiveTab("chore")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${
            activeTab === "chore"
              ? "border-violet-655 text-violet-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <ListTodo size={16} />
          Filter by Chore
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-10 h-10 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin mb-3"></div>
          <p className="text-slate-500 text-sm">Loading logs...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "date" ? (
            <motion.div
              key="date-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Date Filters Sidebar */}
              <div className="lg:col-span-1">
                <GlassCard className="p-6 bg-white/90" hoverEffect={false}>
                  <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Filter size={16} className="text-violet-500" />
                    Select Date
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Choose Day
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-205 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Summary card inside sidebar */}
                  <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Cumulative Minutes</p>
                        <h4 className="text-2xl font-black text-slate-800">{totalDailyMinutes} mins</h4>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Date Logs Table */}
              <div className="lg:col-span-2">
                {dateLogs.length === 0 ? (
                  <GlassCard className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-205" hoverEffect={false}>
                    <Calendar size={40} className="text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-500">No time logged</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm">
                      You haven't recorded minutes for any chores on {selectedDate}.
                    </p>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Daily Summary - {selectedDate} ({dateLogs.length} chores logged)
                    </h3>
                    <div className="space-y-4">
                      {dateLogs.map((log) => {
                        if (!log.chore) return null;
                        const isGoalMet = log.minutes >= log.chore.targetMinutes;

                        return (
                          <GlassCard key={log._id} className="p-5 bg-white/80" hoverEffect={true}>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-bold text-slate-800 capitalize leading-none">
                                    {log.chore.name}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xxs font-semibold text-slate-500 uppercase">
                                    {log.chore.category}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 font-semibold">
                                  Daily Target: {log.chore.targetMinutes}m
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`text-2xl font-black ${isGoalMet ? "text-emerald-650" : "text-violet-600"}`}>
                                  {log.minutes}m
                                </span>
                                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                  Logged
                                </p>
                              </div>
                            </div>

                            {/* Mini progress bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                              <div
                                style={{ width: `${Math.min((log.minutes / log.chore.targetMinutes) * 100, 100)}%` }}
                                className={`h-full rounded-full ${isGoalMet ? "bg-emerald-500" : "bg-violet-500"}`}
                              ></div>
                            </div>
                          </GlassCard>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chore-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Chore Filters Sidebar */}
              <div className="lg:col-span-1">
                <GlassCard className="p-6 bg-white/90" hoverEffect={false}>
                  <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <Filter size={16} className="text-violet-500" />
                    Select Chore
                  </h3>
                  <div className="space-y-4">
                    {chores.length === 0 ? (
                      <p className="text-slate-400 text-xs">No active chores to select.</p>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-505 mb-2">
                          Chore Item
                        </label>
                        <select
                          value={selectedChoreId}
                          onChange={(e) => setSelectedChoreId(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-205 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-700 text-sm transition-all"
                        >
                          {chores.map(chore => (
                            <option key={chore._id} value={chore._id} className="bg-white text-slate-800">
                              {chore.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Summary card inside sidebar */}
                  <div className="mt-8 pt-6 border-t border-slate-105 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-650 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Lifetime Duration</p>
                        <h4 className="text-2xl font-black text-slate-800">{totalChoreMinutes} mins</h4>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-650 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Award size={18} />
                      </div>
                      <div>
                        <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Total Days Done</p>
                        <h4 className="text-2xl font-black text-slate-800">{choreLogs.length} days</h4>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Chore Logs Timeline */}
              <div className="lg:col-span-2">
                {!selectedChoreId ? (
                  <GlassCard className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-205" hoverEffect={false}>
                    <HelpCircle size={40} className="text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-550">No chore selected</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm">
                      Please select or create a chore routine to view its logs.
                    </p>
                  </GlassCard>
                ) : choreLogs.length === 0 ? (
                  <GlassCard className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-205" hoverEffect={false}>
                    <Clock size={40} className="text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-500">No records found</h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm">
                      You haven't logged any minutes for "{selectedChore?.name}" yet.
                    </p>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-2">
                      History Logs - {selectedChore?.name}
                    </h3>
                    <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6 py-2">
                      {choreLogs.map((log) => {
                        const target = selectedChore?.targetMinutes || 30;
                        const isGoalMet = log.minutes >= target;

                        return (
                          <div key={log._id} className="relative">
                            {/* Dot indicator */}
                            <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                              isGoalMet ? "bg-emerald-500 border-white" : "bg-violet-500 border-white"
                            }`}></div>
                            
                            <GlassCard className="p-4 bg-white/80" hoverEffect={true}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-500">
                                    {new Date(log.date + "T00:00:00").toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </h4>
                                  <p className="text-xxs text-slate-400 mt-0.5">
                                    Goal: {target}m
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xl font-bold ${isGoalMet ? "text-emerald-600" : "text-violet-600"}`}>
                                    {log.minutes}m
                                  </span>
                                </div>
                              </div>
                            </GlassCard>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </main>
  );
}
