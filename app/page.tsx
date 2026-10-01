"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle, Clock, Award, Sparkles, ChevronRight, RefreshCw, Calendar, Filter, Zap, Target, TrendingUp, Flame } from "lucide-react";
import { api, getLoggedInUser } from "../utils/api";
import GlassCard from "../components/GlassCard";
import Link from "next/link";

interface Chore {
  _id: string;
  name: string;
  targetMinutes: number;
  category: string;
}

interface LogMap {
  [choreId: string]: number;
}

interface DashboardStats {
  currentMonth: string;
  selectedMonth: string;
  monthlyTotalMinutes: number;
  monthlyTotalHours: string;
  peakDay: string;
  peakMinutes: number;
  daysTracked: number;
  weeklyTotalMinutes: number;
  weeklyTotalHours: string;
  lifetimeTotalMinutes: number;
  lifetimeTotalHours: string;
  availableMonths: string[];
  totalMinutes: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  
  const [chores, setChores] = useState<Chore[]>([]);
  const [todayLogs, setTodayLogs] = useState<LogMap>({});
  
  // Custom manual input state for each chore card
  const [customInputs, setCustomInputs] = useState<{ [choreId: string]: string }>({});
  
  // Selected month filter for stats (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // Stats state
  const [stats, setStats] = useState<DashboardStats>({
    currentMonth: "",
    selectedMonth: "",
    monthlyTotalMinutes: 0,
    monthlyTotalHours: "0.0",
    peakDay: "",
    peakMinutes: 0,
    daysTracked: 0,
    weeklyTotalMinutes: 0,
    weeklyTotalHours: "0.0",
    lifetimeTotalMinutes: 0,
    lifetimeTotalHours: "0.0",
    availableMonths: [],
    totalMinutes: 0,
  });

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();

  useEffect(() => {
    const loggedUser = getLoggedInUser();
    if (!loggedUser) {
      router.push("/auth/login");
    } else {
      setUser(loggedUser);
      fetchData();
    }
  }, [router]);

  const fetchData = async (monthOverride?: string) => {
    try {
      setLoading(true);
      // Fetch active chores
      const choresRes = await api.get("/chores");
      setChores(choresRes.data);

      // Fetch today's logs
      const logsRes = await api.get(`/logs?date=${todayStr}`);
      const map: LogMap = {};
      logsRes.data.forEach((log: any) => {
        const cId = log.chore?._id || log.chore;
        if (cId) {
          map[cId] = log.minutes;
        }
      });
      setTodayLogs(map);

      // Fetch dashboard stats (scoped to month)
      const targetMonth = monthOverride || selectedMonth;
      const statsUrl = targetMonth ? `/logs/stats?month=${targetMonth}` : "/logs/stats";
      const statsRes = await api.get(statsUrl);
      setStats(statsRes.data);
      if (!selectedMonth && statsRes.data.selectedMonth) {
        setSelectedMonth(statsRes.data.selectedMonth);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    fetchData(newMonth);
  };

  const handleLogTime = async (choreId: string, currentMins: number, amount: number) => {
    const newMins = Math.max(0, currentMins + amount);
    
    // Optimistic Update
    setTodayLogs(prev => ({
      ...prev,
      [choreId]: newMins
    }));

    try {
      await api.post("/logs", {
        choreId,
        date: todayStr,
        minutes: newMins,
      });
      
      // Background refresh stats for active selected month
      const targetMonth = selectedMonth || stats.currentMonth;
      const statsUrl = targetMonth ? `/logs/stats?month=${targetMonth}` : "/logs/stats";
      const statsRes = await api.get(statsUrl);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error logging time:", err);
      // Rollback on failure
      setTodayLogs(prev => ({
        ...prev,
        [choreId]: currentMins
      }));
    }
  };

  const handleCustomInputSubmit = async (choreId: string, currentMins: number) => {
    const val = customInputs[choreId];
    if (!val || isNaN(Number(val))) return;
    
    const minutes = Math.max(0, parseInt(val, 10));
    
    // Optimistic Update
    setTodayLogs(prev => ({
      ...prev,
      [choreId]: minutes
    }));

    // Reset input
    setCustomInputs(prev => ({
      ...prev,
      [choreId]: ""
    }));

    try {
      await api.post("/logs", {
        choreId,
        date: todayStr,
        minutes,
      });

      const targetMonth = selectedMonth || stats.currentMonth;
      const statsUrl = targetMonth ? `/logs/stats?month=${targetMonth}` : "/logs/stats";
      const statsRes = await api.get(statsUrl);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error logging custom time:", err);
      // Rollback
      setTodayLogs(prev => ({
        ...prev,
        [choreId]: currentMins
      }));
    }
  };

  const formatMonthLabel = (monthStr: string, currentMonthStr?: string) => {
    if (!monthStr || monthStr.length < 7) return monthStr;
    const [y, m] = monthStr.split("-");
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (currentMonthStr && monthStr === currentMonthStr) {
      return `${label} (Current)`;
    }
    return label;
  };

  // Calculations
  const totalLoggedToday = chores.reduce((sum, chore) => {
    return sum + (todayLogs[chore._id] || 0);
  }, 0);

  const totalTargetToday = chores.reduce((sum, chore) => {
    return sum + chore.targetMinutes;
  }, 0);

  const remainingTargetToday = Math.max(0, totalTargetToday - totalLoggedToday);

  const completionPercent = totalTargetToday > 0 
    ? Math.round((totalLoggedToday / totalTargetToday) * 100) 
    : 0;

  // SVG circle setup
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(completionPercent, 100) / 100) * circumference;

  const getMotivationMsg = () => {
    if (chores.length === 0) return "Add your daily routines below to build a productive momentum!";
    if (totalLoggedToday === 0) return "Ready to take on today? Start logging your minutes to ignite your streak!";
    if (completionPercent < 50) return "Great initial push! Keep going to conquer your daily targets.";
    if (completionPercent < 100) return "You're in the home stretch! Almost reached 100% completion.";
    return "All daily goals completed! Outstanding dedication today! 🎉";
  };

  const isHistoricalMonth = selectedMonth && stats.currentMonth && selectedMonth !== stats.currentMonth;

  if (loading && chores.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin mb-4"></div>
        <p className="text-slate-500 font-semibold">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 relative">
      {/* Background glowing radial gradients */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-40 right-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none"></div>

      {/* Top Header Bar & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 capitalize">
            Welcome back, <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{user?.username || "there"}</span> 👋
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Custom Styled Month Selector Pill */}
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200/80 px-3.5 py-2 rounded-2xl shadow-xs hover:border-violet-300 transition-all">
            <Calendar size={16} className="text-violet-600 shrink-0" />
            <select
              value={selectedMonth || stats.currentMonth || ""}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-slate-700 outline-none cursor-pointer pr-1"
            >
              {stats.availableMonths && stats.availableMonths.length > 0 ? (
                stats.availableMonths.map((m) => (
                  <option key={m} value={m} className="bg-white text-slate-800 font-semibold">
                    {formatMonthLabel(m, stats.currentMonth)}
                  </option>
                ))
              ) : (
                <option value={stats.currentMonth}>
                  {formatMonthLabel(stats.currentMonth)}
                </option>
              )}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
            title="Refresh statistics"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Historical Month Archive Banner */}
      {isHistoricalMonth && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-sm font-medium flex items-center justify-between gap-4 backdrop-blur-xs"
        >
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-amber-600 shrink-0" />
            <span>
              Viewing archived monthly metrics for <strong>{formatMonthLabel(selectedMonth)}</strong>. Statistics auto-reset at the start of each month.
            </span>
          </div>
          <button
            onClick={() => handleMonthChange(stats.currentMonth)}
            className="text-xs font-bold bg-amber-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-amber-500 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Switch to Current Month
          </button>
        </motion.div>
      )}

      {/* 4-KPI High Efficiency Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* KPI 1: Monthly Total */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <GlassCard className="p-5 relative overflow-hidden bg-white/90 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                {isHistoricalMonth ? "Monthly Archive" : "This Month"}
              </span>
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 text-violet-600 border border-violet-500/20 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {stats.monthlyTotalHours || "0.0"} <span className="text-sm font-bold text-slate-500">hrs</span>
              </h3>
              <p className="text-xs font-semibold text-violet-600 mt-1 flex items-center gap-1">
                <span>{stats.monthlyTotalMinutes || 0} total mins</span>
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full" style={{ width: "100%" }}></div>
            </div>
          </GlassCard>
        </motion.div>

        {/* KPI 2: Weekly Total */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <GlassCard className="p-5 relative overflow-hidden bg-white/90 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                This Week
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-500/20 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {stats.weeklyTotalHours || "0.0"} <span className="text-sm font-bold text-slate-500">hrs</span>
              </h3>
              <p className="text-xs font-semibold text-blue-600 mt-1">
                {stats.weeklyTotalMinutes || 0} mins logged
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round(((stats.weeklyTotalMinutes || 0) / 600) * 100))}%` }}></div>
            </div>
          </GlassCard>
        </motion.div>

        {/* KPI 3: Peak Productivity */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <GlassCard className="p-5 relative overflow-hidden bg-white/90 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Peak Output
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center">
                <Flame size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {stats.peakMinutes > 0 ? `${stats.peakMinutes}m` : "N/A"}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 truncate" title={stats.peakDay}>
                {stats.peakDay ? `Best: ${stats.peakDay}` : "No records in month"}
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: stats.peakMinutes > 0 ? "100%" : "0%" }}></div>
            </div>
          </GlassCard>
        </motion.div>

        {/* KPI 4: Active Days Tracked */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
          <GlassCard className="p-5 relative overflow-hidden bg-white/90 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Active Days
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {stats.daysTracked || 0} <span className="text-sm font-bold text-slate-500">Days</span>
              </h3>
              <p className="text-xs font-semibold text-emerald-600 mt-1">
                Month consistency
              </p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, (stats.daysTracked / 30) * 100)}%` }}></div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Featured Today's Cumulative Focus Card */}
      <GlassCard className="p-8 mb-10 bg-gradient-to-br from-white via-slate-50/50 to-violet-50/20 border border-slate-200/80" hoverEffect={false}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Text & Breakdown Details */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/10 text-violet-600 border border-violet-500/20 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles size={14} />
              Today's Cumulative Goal
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daily Cumulative Progress</h2>
              <p className="text-slate-500 text-sm mt-1 max-w-lg leading-relaxed font-medium">
                {getMotivationMsg()}
              </p>
            </div>

            {/* Quick Metrics Chips */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-md mx-auto md:mx-0">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center md:text-left shadow-2xs">
                <span className="text-xxs font-extrabold uppercase tracking-wider text-slate-400 block">Logged</span>
                <span className="text-lg font-black text-violet-600">{totalLoggedToday}m</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center md:text-left shadow-2xs">
                <span className="text-xxs font-extrabold uppercase tracking-wider text-slate-400 block">Target</span>
                <span className="text-lg font-black text-slate-700">{totalTargetToday}m</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center md:text-left shadow-2xs">
                <span className="text-xxs font-extrabold uppercase tracking-wider text-slate-400 block">Remaining</span>
                <span className={`text-lg font-black ${remainingTargetToday === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {remainingTargetToday}m
                </span>
              </div>
            </div>
          </div>

          {/* SVG Animated Radial Gauge */}
          <div className="relative shrink-0 flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="12"
                fill="transparent"
              />
              <motion.circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-violet-600"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 tracking-tight">{completionPercent}%</span>
              <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Completed</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Daily Chores Section Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Daily Chores Tracker
            <span className="text-xs font-bold text-violet-600 bg-violet-600/10 px-3 py-1 rounded-full border border-violet-500/20">
              {chores.length} active
            </span>
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Log time entries directly to update your daily focus stats</p>
        </div>
        
        <Link
          href="/chores"
          className="flex items-center gap-1.5 text-xs font-extrabold text-violet-600 hover:text-violet-500 bg-violet-50 px-3.5 py-2 rounded-xl border border-violet-200 transition-all text-decoration-none group"
        >
          Manage Routines
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid of Chore Cards */}
      {chores.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200" hoverEffect={false}>
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 shadow-2xs">
            <Target size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-700">No active routines configured</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            Create daily chore routines to start tracking time spent and building daily momentum.
          </p>
          <Link
            href="/chores"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition-all text-decoration-none"
          >
            <Plus size={16} />
            Add First Chore Routine
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {chores.map((chore) => {
              const loggedMins = todayLogs[chore._id] || 0;
              const percent = Math.round((loggedMins / chore.targetMinutes) * 100);
              const isTargetMet = loggedMins >= chore.targetMinutes;

              return (
                <GlassCard key={chore._id} className="flex flex-col justify-between min-h-[260px] relative overflow-hidden bg-white/90 border border-slate-200/80" hoverEffect={true}>
                  {/* Top Glowing Gradient Accent Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                    isTargetMet ? "from-emerald-500 via-teal-400 to-emerald-600" : "from-violet-600 via-indigo-500 to-purple-600"
                  }`}></div>

                  <div className="space-y-4 pt-1">
                    {/* Category tag & status */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xxs font-extrabold text-slate-500 uppercase tracking-wider">
                        {chore.category}
                      </span>
                      {isTargetMet && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          <CheckCircle size={13} className="text-emerald-500" />
                          Target Met
                        </div>
                      )}
                    </div>

                    {/* Chore Title and Target */}
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800 leading-tight capitalize">{chore.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Goal: {chore.targetMinutes} mins/day</p>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div>
                      <div className="flex justify-between text-xs font-extrabold mb-1.5">
                        <span className="text-slate-600">Logged: {loggedMins}m</span>
                        <span className={isTargetMet ? "text-emerald-600" : "text-violet-600"}>{percent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percent, 100)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            isTargetMet ? "from-emerald-500 to-teal-400" : "from-violet-600 to-indigo-500"
                          }`}
                        ></motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Increment Quick Buttons & Manual Set */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                    {/* Quick increment buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, -10)}
                        className="py-1.5 text-xxs font-extrabold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                        title="-10m"
                      >
                        -10m
                      </button>
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, 5)}
                        className="py-1.5 text-xxs font-extrabold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-violet-600 rounded-xl transition-all cursor-pointer"
                        title="+5m"
                      >
                        +5m
                      </button>
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, 15)}
                        className="py-1.5 text-xxs font-extrabold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-violet-600 rounded-xl transition-all cursor-pointer"
                        title="+15m"
                      >
                        +15m
                      </button>
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, 30)}
                        className="py-1.5 text-xxs font-extrabold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-violet-600 rounded-xl transition-all cursor-pointer"
                        title="+30m"
                      >
                        +30m
                      </button>
                    </div>

                    {/* Custom input set */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Custom min"
                        value={customInputs[chore._id] || ""}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, [chore._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCustomInputSubmit(chore._id, loggedMins);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
                      />
                      <button
                        onClick={() => handleCustomInputSubmit(chore._id, loggedMins)}
                        className="px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer border border-transparent shadow-2xs"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
