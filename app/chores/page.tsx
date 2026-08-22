"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ListTodo, Sparkles, Clock, Tag, AlertCircle, Loader2 } from "lucide-react";
import { api, getLoggedInUser } from "../../utils/api";
import GlassCard from "../../components/GlassCard";

interface Chore {
  _id: string;
  name: string;
  targetMinutes: number;
  category: string;
}

const choreSchema = Yup.object().shape({
  name: Yup.string().required("Chore name is required"),
  targetMinutes: Yup.number()
    .min(1, "Must be at least 1 minute")
    .max(1440, "Cannot exceed 1440 minutes (24 hours)")
    .required("Target minutes is required"),
  category: Yup.string().required("Category is required"),
});

const CATEGORIES = ["General", "Work", "Health", "Study", "Chores", "Leisure", "Custom"];

export default function ChoresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chores, setChores] = useState<Chore[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loggedUser = getLoggedInUser();
    if (!loggedUser) {
      router.push("/auth/login");
    } else {
      fetchChores();
    }
  }, [router]);

  const fetchChores = async () => {
    try {
      setLoading(true);
      const res = await api.get("/chores");
      setChores(res.data);
    } catch (err) {
      setError("Failed to fetch chores");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChore = async (values: any, { resetForm, setSubmitting }: any) => {
    setError(null);
    try {
      const res = await api.post("/chores", values);
      const newChore = res.data;
      setChores(prev => [newChore, ...prev]);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Could not save the chore.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChore = async (id: string) => {
    setError(null);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chore? It will be removed from your daily list, but past history will remain."
    );
    if (!confirmDelete) return;

    try {
      // Optimistic delete
      setChores(prev => prev.filter(chore => chore._id !== id));

      await api.delete(`/chores/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to delete chore.");
      // Rollback
      fetchChores();
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 relative">
      {/* Background radial glows */}
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
          <ListTodo className="text-violet-600" size={32} />
          Chore Directory
        </h1>
        <p className="text-slate-500 mt-1.5 font-medium">
          Create, edit, and manage the list of chores you perform daily.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Chore Form */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-28 p-6 bg-white/90" hoverEffect={false}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              Add Daily Chore
            </h2>

            <Formik
              initialValues={{ name: "", targetMinutes: 30, category: "General" }}
              validationSchema={choreSchema}
              onSubmit={handleAddChore}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Chore Name
                    </label>
                    <Field
                      type="text"
                      name="name"
                      placeholder="e.g., Learn React, Workout"
                      className="w-full px-4 py-3 bg-white border border-slate-205 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 text-sm transition-all"
                    />
                    <ErrorMessage name="name" component="p" className="text-red-500 text-xs mt-1.5 font-medium" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Daily Target (Minutes)
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field
                        type="number"
                        name="targetMinutes"
                        min="1"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-205 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 text-sm transition-all"
                      />
                    </div>
                    <ErrorMessage name="targetMinutes" component="p" className="text-red-500 text-xs mt-1.5 font-medium" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Category Tag
                    </label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field
                        as="select"
                        name="category"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-205 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-700 text-sm transition-all"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} className="bg-white text-slate-800">
                            {cat}
                          </option>
                        ))}
                      </Field>
                    </div>
                    <ErrorMessage name="category" component="p" className="text-red-500 text-xs mt-1.5 font-medium" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer border border-transparent"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Create Chore</span>
                      </>
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          </GlassCard>
        </div>

        {/* Chores List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin mb-3"></div>
              <p className="text-slate-500 text-sm">Loading chores...</p>
            </div>
          ) : chores.length === 0 ? (
            <GlassCard className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-205" hoverEffect={false}>
              <ListTodo size={40} className="text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-500">Your directory is empty</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">
                Add chores using the sidebar form to populate your directory and start tracking daily logs.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-2">
                Active Chores Directory ({chores.length})
              </h3>
              <AnimatePresence mode="popLayout">
                {chores.map(chore => (
                  <motion.div
                    key={chore._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <GlassCard className="flex items-center justify-between p-5" hoverEffect={true}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-bold text-slate-800 leading-tight capitalize">
                            {chore.name}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xxs font-bold text-slate-500 uppercase tracking-wider">
                            {chore.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                          <Clock size={12} />
                          Daily Target: {chore.targetMinutes} minutes
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteChore(chore._id)}
                        className="p-3 text-slate-400 hover:text-red-650 bg-slate-50 border border-slate-200 hover:bg-red-500/5 hover:border-red-500/10 rounded-xl transition-all hover:scale-105 cursor-pointer"
                        title="Delete Chore"
                      >
                        <Trash2 size={16} />
                      </button>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
