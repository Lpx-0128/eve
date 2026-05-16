"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert, Download } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoadingState from "@/components/LoadingState";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ResponsesPage() {
  const { id } = useParams();
  const pathname = usePathname();
  const [applications, setApplications] = useState<any[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [programme, setProgramme] = useState<any>(null);

  const isOwner = userId && programme?.organiserId === userId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch programme for access control
    const fetchProgramme = async () => {
      try {
        const res = await fetch(`/api/programmes/${id}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setProgramme(json.data);
        }
      } catch (error) {
        console.error("Error fetching programme:", error);
      }
    };

    // Fetch raw applications and questions
    const fetchResponses = async () => {
      try {
        const res = await fetch(`/api/programmes/${id}/responses`);
        const json = await res.json();
        if (res.ok && json.data) {
          setApplications(json.data.applications);
          setQuestions(json.data.applicationQuestions);
        }
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProgramme();
      fetchResponses();
    }
  }, [id]);

  if (loading) return <LoadingState variant="skeleton" />;

  // Access control: block non-owners from seeing responses
  if (!loading && programme && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Access Denied</h1>
        <p className="text-text-muted font-body max-w-md mx-auto">
          You don&apos;t have permission to view responses for this programme. Only the programme host can access this data.
        </p>
        <Link href="/programmes" className="text-accent font-semibold text-sm hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Programmes
        </Link>
      </div>
    );
  }

  const exportToCSV = () => {
    const headers = [
      "Company Name",
      "Email Address",
      ...questions.map((q: any) => typeof q === 'string' ? q : q.label),
      "Applied On"
    ];

    const rows = applications.map(app => {
      const rowData = [
        `"${(app.name || "Unknown").replace(/"/g, '""')}"`,
        `"${(app.email || "N/A").replace(/"/g, '""')}"`
      ];
      
      questions.forEach((q: any) => {
        const qLabel = typeof q === 'string' ? q : q.label;
        const answer = app.answers?.[qLabel] || "No answer provided";
        rowData.push(`"${answer.replace(/"/g, '""')}"`);
      });

      rowData.push(`"${app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown"}"`);
      return rowData.join(",");
    });

    const csvContent = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${programme?.name || 'programme'}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[95%] mx-auto space-y-8 pb-12">
      <Link 
        href={pathname.split('/').slice(0, -1).join('/')} 
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Programme Management
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title="Raw Application Responses" 
          subtitle={`Viewing ${applications.length} total applications for this programme.`}
        />
        <button 
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-base border border-border-warm rounded-lg text-sm font-semibold text-text-primary hover:bg-border-warm/30 transition-colors"
        >
          <Download size={16} />
          Export to CSV
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-bg rounded-[2rem] border border-border-warm shadow-sm overflow-hidden"
      >
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-text-muted font-body">No applications have been submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-border-warm bg-bg-base/50">
                  <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-wider min-w-[200px] border-r border-border-warm/50">
                    Company Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-wider min-w-[250px] border-r border-border-warm/50">
                    Email Address
                  </th>
                  {questions.map((q: any, idx) => {
                    const qLabel = typeof q === 'string' ? q : q.label;
                    return (
                    <th key={idx} className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-wider min-w-[300px] max-w-[400px] border-r border-border-warm/50 truncate" title={qLabel}>
                      {qLabel}
                    </th>
                  )})}
                  <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-wider min-w-[200px]">
                    Applied On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-bg-base/30 transition-colors">
                    <td className="px-6 py-4 border-r border-border-warm/50">
                      <span className="font-heading font-semibold text-text-primary">{app.name || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-4 border-r border-border-warm/50">
                      <span className="font-body text-sm text-text-muted">{app.email || "N/A"}</span>
                    </td>
                    {questions.map((q: any, idx) => {
                      const qLabel = typeof q === 'string' ? q : q.label;
                      const answer = app.answers?.[qLabel];
                      return (
                      <td key={idx} className="px-6 py-4 border-r border-border-warm/50 min-w-[300px] max-w-[400px] whitespace-normal">
                        <p className="text-sm text-text-muted font-body leading-relaxed line-clamp-3" title={answer || "No answer provided"}>
                          {answer || <span className="italic text-text-muted/50">No answer provided</span>}
                        </p>
                      </td>
                    )})}
                    <td className="px-6 py-4">
                      <span className="font-body text-sm text-text-muted">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
