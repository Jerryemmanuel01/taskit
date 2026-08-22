"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { Lock, User as UserIcon, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { setAuthToken, setLoggedInUser, api } from "../../../utils/api";

const signupSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setError(null);
    try {
      const res = await api.post("/auth/signup", {
        username: values.username,
        password: values.password,
      });
      const data = res.data;

      setAuthToken(data.token);
      setLoggedInUser(data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-3">
            <span className="font-black text-white text-2xl">T</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Create account</h2>
          <p className="text-slate-500 text-sm mt-1.5">Start tracking your routines today</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Formik
            initialValues={{ username: "", password: "", confirmPassword: "" }}
            validationSchema={signupSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Field
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 text-sm transition-all"
                    />
                  </div>
                  <ErrorMessage name="username" component="p" className="text-red-500 text-xs mt-1.5 font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="p" className="text-red-500 text-xs mt-1.5 font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Field
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMessage name="confirmPassword" component="p" className="text-red-500 text-xs mt-1.5 font-medium" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer border border-transparent"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create account</span>
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        {/* Login redirection link */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-violet-600 hover:text-violet-500 font-semibold transition-colors text-decoration-none">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}