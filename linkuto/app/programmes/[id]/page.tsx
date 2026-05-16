"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Star,
  Sparkles,
  Calendar,
  MapPin,
  User2,
  Shield,
  X,
  Loader2,
  CheckCircle2,
  ClipboardList,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import LoadingState from "@/components/LoadingState";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProgrammeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;

  const [programme, setProgramme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});

  const isOwner = userId && programme?.organiserId === userId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!programmeId) return;
    const fetchProgramme = async () => {
      try {
        const res = await fetch(`/api/programmes/${programmeId}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setProgramme(json.data);
        }
      } catch (error) {
        console.error("Error fetching programme:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgramme();
  }, [programmeId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !programme) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/programmes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmeId: programme.id,
          participantId: userId,
          answers: formAnswers,
        }),
      });
      if (res.ok) {
        setRegistrationSuccess(true);
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegistrationSuccess(false);
          setFormAnswers({});
        }, 2500);
      }
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading programme details..." variant="skeleton" />;
  }

  if (!programme) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Programme Not Found</h1>
        <p className="text-text-muted font-body">This programme may have been removed or the link is incorrect.</p>
        <Link href="/programmes" className="text-accent font-semibold text-sm hover:underline">
          ← Back to Programmes
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href="/programmes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to Programmes
      </Link>

      {/* ─── Luma-style Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

        {/* ─── LEFT COLUMN: Event Card / Host Info ─── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 lg:sticky lg:top-24"
        >
          {/* Event Visual Card */}
          <div className="rounded-[2rem] overflow-hidden border border-border-warm shadow-sm">
            {/* Gradient Header Image */}
            <div
              className="h-52 flex items-center justify-center relative"
              style={{ background: "linear-gradient(135deg, #736278, #3A4F6E, #00508B)" }}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 text-center space-y-2 px-6">
                <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-3xl font-extrabold mx-auto shadow-lg">
                  {programme.name.charAt(0)}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="bg-card-bg p-6 space-y-4">
              {/* Industry Tags */}
              {programme.industry_focus?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {programme.industry_focus.map((ind: string) => (
                    <span
                      key={ind}
                      className="px-2.5 py-1 rounded-md bg-bg-base border border-border-warm text-[10px] font-semibold text-text-muted uppercase tracking-wider"
                    >
                      # {ind}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Presented By Section */}
          <div className="bg-card-bg rounded-[2rem] p-6 border border-border-warm shadow-sm space-y-5">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Presented by</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white text-lg font-bold shadow-md">
                {(programme.organiserName || "O").charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-base font-heading font-bold text-text-primary">{programme.organiserName || "Unknown Organiser"}</p>
                <p className="text-xs text-text-muted">Programme Host</p>
              </div>
              {isOwner && (
                <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
                  <Shield size={10} /> You
                </span>
              )}
            </div>

            {programme.description && (
              <p className="text-sm text-text-muted font-body leading-relaxed line-clamp-4 border-t border-border-warm pt-4">
                {programme.description.substring(0, 200)}{programme.description.length > 200 ? "..." : ""}
              </p>
            )}
          </div>

          {/* Hosted By Section */}
          <div className="bg-card-bg rounded-[2rem] p-6 border border-border-warm shadow-sm space-y-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Hosted By</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                {(programme.organiserName || "O").charAt(0)}
              </div>
              <p className="text-sm font-semibold text-text-primary flex-1">{programme.organiserName || "Unknown Organiser"}</p>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-border-warm">
              <p className="text-sm font-semibold text-text-primary mb-3">
                {(programme.participants?.length || 0) + (programme.mentors?.length || 0)} Going
              </p>
              <div className="flex -space-x-2 mb-3">
                {[...Array(Math.min(5, (programme.participants?.length || 0) + (programme.mentors?.length || 0) + 1))].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-card-bg flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      background: `hsl(${200 + i * 30}, 60%, ${45 + i * 5}%)`,
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── RIGHT COLUMN: Event Details ─── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Title & Status */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[programme.status] || statusColors.draft}`}
              >
                {programme.status}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-text-primary tracking-tight leading-tight">
              {programme.name}
            </h1>
          </div>

          {/* Meta Row: Date + Location (if available) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-text-muted">
              <div className="w-10 h-10 rounded-xl bg-bg-base border border-border-warm flex flex-col items-center justify-center">
                <span className="text-[8px] font-bold text-accent uppercase leading-none">
                  {new Date(programme.createdAt).toLocaleDateString("en", { month: "short" })}
                </span>
                <span className="text-sm font-extrabold text-text-primary leading-none">
                  {new Date(programme.createdAt).getDate()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {new Date(programme.createdAt).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <p className="text-xs text-text-muted">Programme Published</p>
              </div>
            </div>
          </div>

          {/* Registration Card — Only for non-owners */}
          {!isOwner && (
            <div className="bg-card-bg rounded-2xl border border-border-warm shadow-sm p-6 space-y-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Registration</p>
              <p className="text-sm text-text-muted font-body">
                Welcome! To join the programme, please register below.
              </p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full py-3.5 rounded-xl text-text-primary font-semibold text-sm border-2 border-border-warm hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
              >
                Register
              </button>
            </div>
          )}

          {/* Owner Controls — Only for the owner */}
          {isOwner && (
            <div className="bg-card-bg rounded-2xl border border-accent/20 shadow-sm p-6 space-y-4">
              <p className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} /> Owner Controls
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
                  onClick={() => router.push(`/organiser/programmes/${programmeId}`)}
                >
                  <Edit3 size={16} /> Edit Programme
                </button>
                <button
                  className="py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
                  onClick={() => router.push(`/organiser/programmes/${programmeId}/responses`)}
                >
                  <Sparkles size={16} /> See Responses
                </button>
              </div>
            </div>
          )}

          {/* About Event */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">About Programme</h2>
            <div className="prose prose-sm max-w-none text-text-primary font-body leading-relaxed">
              <p className="whitespace-pre-wrap">{programme.description}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Startups", value: programme.participants?.length || 0, icon: Users, color: "text-blue-500" },
              { label: "Mentors", value: programme.mentors?.length || 0, icon: Star, color: "text-amber-500" },
              { label: "Sponsors", value: programme.sponsors?.length || 0, icon: Sparkles, color: "text-purple-500" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card-bg rounded-2xl p-5 border border-border-warm text-center space-y-1"
              >
                <stat.icon size={20} className={`mx-auto ${stat.color}`} />
                <p className="text-2xl font-heading font-extrabold text-text-primary">{stat.value}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Application Questions — Owner Only */}
          {isOwner && programme.applicationQuestions?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <ClipboardList size={16} /> Application Form Questions
              </h2>
              <div className="bg-card-bg rounded-2xl border border-border-warm p-6 space-y-3">
                {programme.applicationQuestions.map((q: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-bg-base border border-border-warm">
                    <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{q.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Registration Modal ─── */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegisterModal(false)}
              className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-card-bg rounded-[2.5rem] border border-border-warm shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 z-10">
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 md:p-10 space-y-8 max-h-[90vh] overflow-y-auto">
                {registrationSuccess ? (
                  <div className="py-12 flex flex-col items-center text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"
                    >
                      <CheckCircle2 size={48} />
                    </motion.div>
                    <h2 className="text-2xl font-heading font-extrabold text-text-primary">
                      Registration Submitted!
                    </h2>
                    <p className="text-text-muted font-body">
                      The organiser has been notified. You&apos;ll hear back soon.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                        <Sparkles size={24} />
                      </div>
                      <h2 className="text-3xl font-heading font-extrabold text-text-primary tracking-tight">
                        Register for {programme.name}
                      </h2>
                      <p className="text-text-muted font-body text-sm leading-relaxed">
                        Fill out the form below to apply for this programme.
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                      {programme.applicationQuestions?.map((q: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                            {q.label}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Your answer..."
                            onChange={(e) =>
                              setFormAnswers((prev) => ({
                                ...prev,
                                [q.label]: e.target.value,
                              }))
                            }
                            className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-sm"
                          />
                        </div>
                      ))}

                      {(!programme.applicationQuestions ||
                        programme.applicationQuestions.length === 0) && (
                        <div className="p-4 rounded-xl bg-bg-base border border-border-warm text-sm text-text-muted italic">
                          No specific questions for this programme. Just click below to register!
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
                      >
                        {isSubmitting ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          "Submit Registration"
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
