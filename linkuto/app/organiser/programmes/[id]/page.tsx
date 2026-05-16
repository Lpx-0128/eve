"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";

export default function ProgrammeDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams();
  
  const [programme, setProgramme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    const fetchProgramme = async () => {
      try {
        const res = await fetch(`/api/programmes/${id}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setProgramme(json.data);
          setName(json.data.name);
          setDescription(json.data.description);
          setStatus(json.data.status || "active");
        }
      } catch (error) {
        console.error("Error fetching programme:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProgramme();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/programmes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, status })
      });
      if (res.ok) {
        // Handle success
      }
    } catch (error) {
      console.error("Error updating programme:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState variant="skeleton" />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link 
        href={pathname.split('/').slice(0, -1).join('/')} 
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Programmes
      </Link>

      <PageHeader 
        title="Programme Management" 
        subtitle="Review details and view applicant screening results."
        action={
          <Link href={`${pathname}/responses`}>
            <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-md hover:opacity-90 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}>
              <Sparkles size={18} /> See Responses
            </button>
          </Link>
        }
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-bg rounded-[2rem] p-8 md:p-10 border border-border-warm shadow-sm"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Programme Name</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-text-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Status</label>
            <select 
              value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-text-primary"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Description</label>
            <textarea
              required rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-border-warm bg-bg-base focus:border-accent outline-none transition-all font-body text-text-primary resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit" disabled={saving}
              className="px-8 py-3 rounded-xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #736278, #00508B)" }}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
