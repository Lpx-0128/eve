"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Plus, Users, Star, User2 } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function OrganiserProgrammesPage() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });

    const fetchProgrammes = async () => {
      try {
        const res = await fetch("/api/programmes");
        const json = await res.json();
        if (res.ok && json.data) {
          setProgrammes(json.data);
        }
      } catch (error) {
        console.error("Error fetching programmes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgrammes();

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingState message="Syncing with the ecosystem..." variant="skeleton" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary tracking-tight">
            Ecosystem Programmes
          </h1>
          <p className="text-base text-text-muted font-body">
            Discover and join high-impact cohorts across the network.
          </p>
        </div>

        <Link href="/programmes/create">
          <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-md transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}>
            <Plus size={18} /> Publish Programme
          </button>
        </Link>
      </div>

      {programmes.length === 0 ? (
        <EmptyState
          title="No Active Programmes"
          message="The ecosystem is currently quiet. Publish a new cohort to get started."
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {programmes.map((prog) => {
            const isOwner = userId && prog.organiserId === userId;

            return (
              <motion.div
                key={prog.id}
                variants={itemVariants}
                onClick={() => router.push(`/programmes/${prog.id}`)}
                className="bg-card-bg rounded-[2rem] p-8 border border-border-warm shadow-sm flex flex-col justify-between group cursor-pointer hover:border-accent/40 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bg-base to-border-warm flex items-center justify-center border border-border-warm text-xl font-bold text-text-primary">
                      {prog.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                          Yours
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                        {prog.status}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl font-heading font-bold text-text-primary line-clamp-1 mb-2">
                    {prog.name}
                  </h2>
                  <p className="text-sm text-text-muted font-body leading-relaxed line-clamp-3 mb-6">
                    {prog.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {prog.industry_focus?.slice(0, 3).map((ind: string) => (
                      <span key={ind} className="px-2.5 py-1 rounded-md bg-bg-base border border-border-warm text-[11px] font-medium text-text-muted">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-border-warm space-y-3">
                  {/* Organiser attribution */}
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <User2 size={14} className="text-accent" />
                    <span className="font-medium">Hosted by <span className="text-text-primary font-semibold">{prog.organiserName || "Unknown"}</span></span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-text-muted font-medium">
                      <Users size={16} />
                      {prog.participants?.length || 0} Startups
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted font-medium">
                      <Star size={16} className="text-accent" />
                      {prog.mentors?.length || 0} Mentors
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
