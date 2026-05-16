"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Star,
  Sparkles,
  Calendar,
  User2,
  Shield,
  X,
  Loader2,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Save,
  Plus,
  Trash2,
  MapPin,
  Globe,
  Clock,
  Trophy,
  Target,
} from "lucide-react";

const PROGRAMME_TYPES = ["Accelerator","Incubator","Hackathon","Bootcamp","Workshop","Demo Day","Fellowship","Grant Programme"];
import Link from "next/link";
import LoadingState from "@/components/LoadingState";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProgrammeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const programmeId = params.id as string;

  const [programme, setProgramme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("participant");

  // Registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Edit modal state (owner only)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [isSaving, setIsSaving] = useState(false);

  // New fields edit state
  const [editType, setEditType] = useState("Accelerator");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editMaxParticipants, setEditMaxParticipants] = useState(20);
  const [editEligibility, setEditEligibility] = useState("");
  const [editPerks, setEditPerks] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");

  // Application questions editing
  const defaultPredefined = [
    { id: "pitch_deck", label: "Company Pitch Deck (URL)" },
    { id: "funding_stage", label: "Current Funding Stage" },
    { id: "team_size", label: "Core Team Size" },
    { id: "market_size", label: "Estimated Market Size (TAM)" },
  ];
  const [editPredefinedEnabled, setEditPredefinedEnabled] = useState<Record<string, boolean>>({});
  const [editCustomQuestions, setEditCustomQuestions] = useState<{id: string, label: string}[]>([]);

  const isOwner = userId && programme?.organiserId === userId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Read role from cookie
        const match = document.cookie.match(new RegExp('(^| )user-role=([^;]+)'));
        if (match) setUserRole(match[2]);
      }
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
          setEditName(json.data.name);
          setEditDescription(json.data.description);
          setEditStatus(json.data.status || "active");
          setEditType(json.data.programmeType || "Accelerator");
          setEditStartDate(json.data.startDate || "");
          setEditEndDate(json.data.endDate || "");
          setEditDeadline(json.data.applicationDeadline || "");
          setEditLocation(json.data.location || "");
          setEditMaxParticipants(json.data.maxParticipants || 20);
          setEditEligibility(json.data.eligibility || "");
          setEditPerks(json.data.perks || "");
          setEditWebsiteUrl(json.data.websiteUrl || "");
          // Hydrate application question state
          const existingQs: any[] = json.data.applicationQuestions || [];
          const enabledMap: Record<string, boolean> = {};
          defaultPredefined.forEach(p => {
            enabledMap[p.id] = existingQs.some((q: any) => q.label === p.label && !q.isCustom);
          });
          setEditPredefinedEnabled(enabledMap);
          setEditCustomQuestions(
            existingQs.filter((q: any) => q.isCustom).map((q: any) => ({ id: Math.random().toString(36).substr(2, 9), label: q.label }))
          );
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
    setRegisterError("");
    try {
      const res = await fetch("/api/programmes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmeId: programme.id,
          participantId: userId,
          name: participantName,
          email: participantEmail,
          answers: formAnswers,
        }),
      });
      if (res.ok) {
        setRegistrationSuccess(true);
        // Optimistically update the programme's participants array
        setProgramme((prev: any) => ({
          ...prev,
          participants: [...(prev.participants || []), userId],
        }));
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegistrationSuccess(false);
          setFormAnswers({});
          setParticipantName("");
          setParticipantEmail("");
        }, 2500);
      } else {
        const data = await res.json();
        setRegisterError(data.error || "An error occurred during registration.");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setRegisterError("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setIsSaving(true);
    try {
      const applicationQuestions = [
        ...defaultPredefined.filter(p => editPredefinedEnabled[p.id]).map(p => ({ label: p.label, type: "text", isCustom: false })),
        ...editCustomQuestions.filter(q => q.label.trim().length > 0).map(q => ({ label: q.label, type: "text", isCustom: true })),
      ];
      const payload = {
        name: editName, description: editDescription, status: editStatus, applicationQuestions,
        programmeType: editType, startDate: editStartDate || null, endDate: editEndDate || null,
        applicationDeadline: editDeadline || null, location: editLocation || null,
        maxParticipants: editMaxParticipants, eligibility: editEligibility || null,
        perks: editPerks || null, websiteUrl: editWebsiteUrl || null,
      };
      const res = await fetch(`/api/programmes/${programmeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setProgramme((prev: any) => ({ ...prev, ...payload }));
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Edit failed:", error);
    } finally {
      setIsSaving(false);
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
        <button onClick={() => router.back()} className="text-accent font-semibold text-sm hover:underline">
          ← Back to Programmes
        </button>
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
      <button
        onClick={() => router.push("/programmes")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to Programmes
      </button>

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

          {/* Hosted By / Going Section */}
          <div className="bg-card-bg rounded-[2rem] p-6 border border-border-warm shadow-sm space-y-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Hosted By</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                {(programme.organiserName || "O").charAt(0)}
              </div>
              <p className="text-sm font-semibold text-text-primary flex-1">{programme.organiserName || "Unknown Organiser"}</p>
            </div>

            {/* Going */}
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

          {/* Key Details Card */}
          <div className="bg-card-bg rounded-2xl border border-border-warm shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {programme.programmeType && (
                <div className="flex items-center gap-3"><Target size={16} className="text-accent shrink-0" /><div><p className="text-[10px] text-text-muted font-bold uppercase">Type</p><p className="text-sm font-semibold text-text-primary">{programme.programmeType}</p></div></div>
              )}
              {programme.startDate && (
                <div className="flex items-center gap-3"><Calendar size={16} className="text-green-500 shrink-0" /><div><p className="text-[10px] text-text-muted font-bold uppercase">Starts</p><p className="text-sm font-semibold text-text-primary">{new Date(programme.startDate).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</p></div></div>
              )}
              {programme.endDate && (
                <div className="flex items-center gap-3"><Calendar size={16} className="text-red-400 shrink-0" /><div><p className="text-[10px] text-text-muted font-bold uppercase">Ends</p><p className="text-sm font-semibold text-text-primary">{new Date(programme.endDate).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</p></div></div>
              )}
              {programme.applicationDeadline && (
                <div className="flex items-center gap-3"><Clock size={16} className="text-amber-500 shrink-0" /><div><p className="text-[10px] text-text-muted font-bold uppercase">Apply By</p><p className="text-sm font-semibold text-text-primary">{new Date(programme.applicationDeadline).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</p></div></div>
              )}
              {programme.location && (
                <div className="flex items-center gap-3"><MapPin size={16} className="text-blue-500 shrink-0" /><div><p className="text-[10px] text-text-muted font-bold uppercase">Location</p><p className="text-sm font-semibold text-text-primary">{programme.location}</p></div></div>
              )}
              {programme.maxParticipants && (
                <div className="flex items-center gap-3"><Users size={16} className="text-purple-500 shrink-0" /><div><p className="text-[10px] text-text-muted font-bold uppercase">Capacity</p><p className="text-sm font-semibold text-text-primary">{programme.maxParticipants} participants</p></div></div>
              )}
            </div>
            {programme.websiteUrl && (
              <a href={programme.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-accent hover:underline pt-2 border-t border-border-warm"><Globe size={14} /> Visit Programme Website</a>
            )}
          </div>

          {/* Registration Card — Only for participants (startups), not organisers */}
          {!isOwner && userRole === "participant" && (
            <div className="bg-card-bg rounded-2xl border border-border-warm shadow-sm p-6 space-y-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Registration</p>
              <p className="text-sm text-text-muted font-body">Welcome! To join the programme, please register below.</p>
              {programme.applicationDeadline && new Date(programme.applicationDeadline) < new Date() ? (
                <p className="text-sm text-red-500 font-semibold">Applications are now closed.</p>
              ) : (
                <button onClick={() => setShowRegisterModal(true)} className="w-full py-3.5 rounded-xl text-text-primary font-semibold text-sm border-2 border-border-warm hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2">Register</button>
              )}
            </div>
          )}

          {/* Owner Controls — Only for the owner */}
          {isOwner && (
            <div className="bg-card-bg rounded-2xl border border-accent/20 shadow-sm p-6 space-y-4">
              <p className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5"><Shield size={12} /> Owner Controls</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button className="py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #736278, #00508B)" }} onClick={() => setShowEditModal(true)}><Edit3 size={16} /> Edit Programme</button>
                <button className="py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #736278, #00508B)" }} onClick={() => router.push(`${pathname}/responses`)}><Users size={16} /> See Responses</button>
                <button className="py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #736278, #00508B)" }} onClick={() => router.push(`${pathname}/ai-screening`)}><Sparkles size={16} /> Live AI Screening</button>
              </div>
            </div>
          )}

          {/* About Event */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">About Programme</h2>
            <div className="prose prose-sm max-w-none text-text-primary font-body leading-relaxed"><p className="whitespace-pre-wrap">{programme.description}</p></div>
          </div>

          {/* Eligibility & Perks */}
          {(programme.eligibility || programme.perks) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {programme.eligibility && (
                <div className="bg-card-bg rounded-2xl border border-border-warm p-5 space-y-2">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Target size={14} /> Eligibility</p>
                  <p className="text-sm text-text-primary font-body leading-relaxed">{programme.eligibility}</p>
                </div>
              )}
              {programme.perks && (
                <div className="bg-card-bg rounded-2xl border border-border-warm p-5 space-y-2">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Trophy size={14} /> Perks & Benefits</p>
                  <p className="text-sm text-text-primary font-body leading-relaxed">{programme.perks}</p>
                </div>
              )}
            </div>
          )}

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

      {/* ─── Registration Modal (non-owners) ─── */}
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
                <button onClick={() => setShowRegisterModal(false)} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
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
                    <h2 className="text-2xl font-heading font-extrabold text-text-primary">Registration Submitted!</h2>
                    <p className="text-text-muted font-body">The organiser has been notified. You&apos;ll hear back soon.</p>
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
                      <p className="text-text-muted font-body text-sm leading-relaxed">Fill out the form below to apply.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                      {registerError && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">
                          {registerError}
                        </div>
                      )}
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Company Name</label>
                          <input
                            type="text"
                            required
                            value={participantName}
                            onChange={(e) => setParticipantName(e.target.value)}
                            placeholder="Jane Doe"
                            className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Email Address</label>
                          <input
                            type="email"
                            required
                            value={participantEmail}
                            onChange={(e) => setParticipantEmail(e.target.value)}
                            placeholder="jane@example.com"
                            className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-sm"
                          />
                        </div>
                      </div>

                      {programme.applicationQuestions?.map((q: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <label className="text-xs font-bold text-text-primary uppercase tracking-wider">{q.label}</label>
                          <input
                            type="text"
                            required
                            placeholder="Your answer..."
                            onChange={(e) => setFormAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))}
                            className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-sm"
                          />
                        </div>
                      ))}

                      {(!programme.applicationQuestions || programme.applicationQuestions.length === 0) && (
                        <div className="p-4 rounded-xl bg-bg-base border border-border-warm text-sm text-text-muted italic">
                          No specific questions. Just click below to register!
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
                      >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Submit Registration"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Edit Modal (owner only) ─── */}
      <AnimatePresence>
        {showEditModal && isOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-bg-base/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-card-bg rounded-[2.5rem] border border-border-warm shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 z-10">
                <button onClick={() => setShowEditModal(false)} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 md:p-10 space-y-8 max-h-[90vh] overflow-y-auto">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                    <Edit3 size={24} />
                  </div>
                  <h2 className="text-3xl font-heading font-extrabold text-text-primary tracking-tight">
                    Edit Programme
                  </h2>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Programme Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Description</label>
                    <textarea
                      required
                      rows={5}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all font-body text-sm resize-none"
                    />
                  </div>

                  {/* ─── Schedule & Location ─── */}
                  <div className="pt-6 border-t border-border-warm space-y-4">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Schedule & Location</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Programme Type</label>
                        <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm">
                          {PROGRAMME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Location</label>
                        <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder='e.g. Virtual or Kuala Lumpur' className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Start Date</label>
                        <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">End Date</label>
                        <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Application Deadline</label>
                        <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Max Participants</label>
                        <input type="number" value={editMaxParticipants} onChange={(e) => setEditMaxParticipants(parseInt(e.target.value) || 0)} min="1" className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* ─── Eligibility, Perks & Website ─── */}
                  <div className="pt-6 border-t border-border-warm space-y-4">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Value Proposition</h3>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Eligibility Criteria</label>
                      <input type="text" value={editEligibility} onChange={(e) => setEditEligibility(e.target.value)} placeholder="e.g. Pre-seed to Series A startups" className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Perks & Benefits</label>
                      <textarea rows={2} value={editPerks} onChange={(e) => setEditPerks(e.target.value)} placeholder="e.g. $50K funding, mentorship, co-working space" className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm resize-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Website URL</label>
                      <input type="url" value={editWebsiteUrl} onChange={(e) => setEditWebsiteUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-sm" />
                    </div>
                  </div>

                  {/* ─── Application Questions Section ─── */}
                  <div className="pt-6 border-t border-border-warm space-y-4">
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Application Questions</h3>

                    {/* Predefined toggles */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Predefined</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {defaultPredefined.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setEditPredefinedEnabled(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-medium ${
                              editPredefinedEnabled[p.id]
                                ? "bg-accent/10 border-accent text-accent"
                                : "bg-bg-base border-border-warm text-text-muted hover:border-accent/50"
                            }`}
                          >
                            <span className="text-left">{p.label}</span>
                            {editPredefinedEnabled[p.id] && <Sparkles size={12} className="shrink-0 ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom questions */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Custom Questions</label>
                        <button
                          type="button"
                          onClick={() => setEditCustomQuestions(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), label: "" }])}
                          className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {editCustomQuestions.map((q, idx) => (
                          <div key={q.id} className="flex gap-2">
                            <input
                              type="text"
                              value={q.label}
                              onChange={(e) => setEditCustomQuestions(prev => prev.map(cq => cq.id === q.id ? { ...cq, label: e.target.value } : cq))}
                              placeholder={`Question #${idx + 1}`}
                              className="flex-1 px-4 py-3 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all text-xs font-body text-text-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setEditCustomQuestions(prev => prev.filter(cq => cq.id !== q.id))}
                              className="p-3 text-text-muted hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {editCustomQuestions.length === 0 && (
                          <p className="text-xs text-text-muted italic py-2">No custom questions yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
