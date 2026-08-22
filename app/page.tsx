"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle, Clock, Award, Sparkles, ChevronRight, RefreshCw, PlusCircle, MinusCircle } from "lucide-react";
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

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  
  const [chores, setChores] = useState<Chore[]>([]);
  const [todayLogs, setTodayLogs] = useState<LogMap>({});
  
  // Custom manual input state for each chore card
  const [customInputs, setCustomInputs] = useState<{ [choreId: string]: string }>({});
  
  // Stats
  const [stats, setStats] = useState({
    totalMinutes: 0,
    peakDay: "",
    peakMinutes: 0,
    daysTracked: 0,
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

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch chores
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

      // Fetch overall stats
      const statsRes = await api.get("/logs/stats");
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
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
      
      // Update overall stats background refresh
      const statsRes = await api.get("/logs/stats");
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

      const statsRes = await api.get("/logs/stats");
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

  // Calculations
  const totalLoggedToday = chores.reduce((sum, chore) => {
    return sum + (todayLogs[chore._id] || 0);
  }, 0);

  const totalTargetToday = chores.reduce((sum, chore) => {
    return sum + chore.targetMinutes;
  }, 0);

  const completionPercent = totalTargetToday > 0 
    ? Math.round((totalLoggedToday / totalTargetToday) * 100) 
    : 0;

  // SVG circle setup
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(completionPercent, 100) / 100) * circumference;

  const getMotivationMsg = () => {
    if (chores.length === 0) return "Add some chores to begin your daily streak!";
    if (totalLoggedToday === 0) return "Chore time! Log your first minutes to kickstart today.";
    if (completionPercent < 50) return "Off to a good start! Step by step, you'll get there.";
    if (completionPercent < 100) return "You're past the halfway mark! Keep pushing.";
    return "Outstanding! You've crushed all your daily chore goals today! 🎉";
  };

  if (loading && chores.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin mb-4"></div>
        <p className="text-slate-500 font-semibold">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 relative">
      {/* Background radial glows */}
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      {/* Greeting and Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 capitalize">
            Hey, {user?.username || "there"} 👋
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="self-start flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-205 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer shadow-sm shadow-slate-100/50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats and Radial Ring Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Radial Progress Ring */}
        <GlassCard className="lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-8 p-8" hoverEffect={false}>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} />
              Today's Focus
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800">Daily Cumulative Progress</h2>
            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              {getMotivationMsg()}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-600"></div>
                <span className="text-xs font-semibold text-slate-600">Logged: {totalLoggedToday}m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <span className="text-xs font-semibold text-slate-600">Target: {totalTargetToday}m</span>
              </div>
            </div>
          </div>

          {/* SVG Progress Circle */}
          <div className="relative shrink-0 flex items-center justify-center w-40 h-40">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-violet-600"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800">{completionPercent}%</span>
              <span className="text-sm text-slate-400 uppercase tracking-widest font-bold">Completed</span>
            </div>
          </div>
        </GlassCard>

        {/* Global Lifetime Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifetime Active</p>
              <h4 className="text-xl font-bold text-slate-800 mt-0.5">{stats.totalMinutes} minutes</h4>
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peak Productivity</p>
              <h4 className="text-xl font-bold text-slate-800 mt-0.5">
                {stats.peakMinutes > 0 ? `${stats.peakMinutes}m (${stats.peakDay})` : "N/A"}
              </h4>
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Days Tracked</p>
              <h4 className="text-xl font-bold text-slate-800 mt-0.5">{stats.daysTracked} days</h4>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Daily Chores Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Daily Chores Tracker
          <span className="text-sm font-semibold text-violet-600 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
            {chores.length} active
          </span>
        </h2>
        <Link
          href="/chores"
          className="flex items-center gap-1.5 text-sm font-bold text-violet-600 hover:text-violet-500 transition-colors text-decoration-none group"
        >
          Manage Chores
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid of Chore Cards */}
      {chores.length === 0 ? (
        <GlassCard className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200" hoverEffect={false}>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
            <Award size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-600">No chores set up yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            To start tracking daily minutes, you must list the chore routines you do daily.
          </p>
          <Link
            href="/chores"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/35 transition-all text-decoration-none"
          >
            <Plus size={16} />
            Add Your First Chore
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {chores.map((chore, index) => {
              const loggedMins = todayLogs[chore._id] || 0;
              const percent = Math.round((loggedMins / chore.targetMinutes) * 100);
              const isTargetMet = loggedMins >= chore.targetMinutes;

              return (
                <GlassCard key={chore._id} className="flex flex-col justify-between min-h-[250px] relative overflow-hidden bg-white/80" hoverEffect={true}>
                  {/* Glowing Top line indicator */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    isTargetMet ? "from-emerald-500 to-teal-500" : "from-violet-500 to-indigo-500"
                  }`}></div>

                  <div className="space-y-4">
                    {/* Category tag & check */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xxs font-bold text-slate-500 uppercase tracking-wider">
                        {chore.category}
                      </span>
                      {isTargetMet && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle size={12} className="text-emerald-500" />
                          Target Met
                        </div>
                      )}
                    </div>

                    {/* Title and Target */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 leading-tight capitalize">{chore.name}</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Goal: {chore.targetMinutes} mins/day</p>
                    </div>

                    {/* Progress details */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-500">Time logged: {loggedMins}m</span>
                        <span className={isTargetMet ? "text-emerald-600" : "text-violet-600"}>{percent}%</span>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percent, 100)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            isTargetMet ? "from-emerald-500 to-teal-400" : "from-violet-500 to-indigo-400"
                          }`}
                        ></motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Increment and input section */}
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                    {/* Quick increment buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, -10)}
                        className="py-1.5 text-xxs font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-red-650 rounded-lg transition-all cursor-pointer"
                        title="-10m"
                      >
                        -10m
                      </button>
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, 5)}
                        className="py-1.5 text-xxs font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-violet-600 rounded-lg transition-all cursor-pointer"
                        title="+5m"
                      >
                        +5m
                      </button>
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, 15)}
                        className="py-1.5 text-xxs font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-violet-600 rounded-lg transition-all cursor-pointer"
                        title="+15m"
                      >
                        +15m
                      </button>
                      <button
                        onClick={() => handleLogTime(chore._id, loggedMins, 30)}
                        className="py-1.5 text-xxs font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 hover:text-violet-600 rounded-lg transition-all cursor-pointer"
                        title="+30m"
                      >
                        +30m
                      </button>
                    </div>

                    {/* Manual input */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Set custom min"
                        value={customInputs[chore._id] || ""}
                        onChange={(e) => setCustomInputs(prev => ({ ...prev, [chore._id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCustomInputSubmit(chore._id, loggedMins);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none text-slate-800 placeholder-slate-400 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/10"
                      />
                      <button
                        onClick={() => handleCustomInputSubmit(chore._id, loggedMins)}
                        className="px-3.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer border border-transparent"
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
