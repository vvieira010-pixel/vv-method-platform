import { useState } from "react";
import { STUDENTS, CYCLE_CONFIG } from "../lib/data";
import { Avatar, cycleLabel, cycleTone, toast } from "../lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Activity,
  BookOpen,
  Inbox,
  Sparkles,
  AlertOctagon,
  BarChart2,
  Settings,
  LineChart,
  Link,
  Download,
} from "lucide-react";
import {
  Students,
  CalendarPage,
  Diagnostics,
  Homework,
  Submissions,
  AIStudio,
  ErrorBank,
  Reports,
  SettingsPage,
} from "./TeacherPages";
import AnalyticsDashboard from "./AnalyticsDashboard";
import LMSMappingTool from "./LMSMappingTool";

export default function TeacherView({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState("p-dashboard");

  const handleDownloadReport = () => {
    // Define headers
    const headers = [
      "Student ID",
      "Full Name",
      "First Name",
      "Email",
      "Current Band",
      "Target Band",
      "Goal / Target",
      "Current Session",
      "Total Sessions",
      "Progress (%)",
      "Current Stage",
      "Speaking Score",
      "Writing Score",
      "Reading Score",
      "Listening Score",
      "Grammar Score",
      "Vocabulary Score",
      "Average Score (%)"
    ];

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return "";
      let str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = STUDENTS.map(s => {
      const skills = s.skills || [];
      const avg = skills.length > 0
        ? Math.round(skills.reduce((sum, curr) => sum + curr, 0) / skills.length)
        : 0;
      const progress = s.totalSessions > 0
        ? Math.round((s.session / s.totalSessions) * 100)
        : 0;

      return [
        s.id,
        s.name,
        s.firstName,
        s.email || "",
        s.band,
        s.bandTarget,
        s.goal,
        s.session,
        s.totalSessions,
        progress,
        s.cycle,
        skills[0] !== undefined ? skills[0] : "",
        skills[1] !== undefined ? skills[1] : "",
        skills[2] !== undefined ? skills[2] : "",
        skills[3] !== undefined ? skills[3] : "",
        skills[4] !== undefined ? skills[4] : "",
        skills[5] !== undefined ? skills[5] : "",
        avg
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.id = "download-anchor-element";
    link.setAttribute("href", url);
    link.setAttribute("download", `student_statistics_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast("Report downloaded successfully!");
  };

  const PAGE_LABELS: Record<string, string> = {
    "p-dashboard": "Dashboard",
    "p-students": "Students",
    "p-calendar": "Calendar",
    "p-diagnostics": "Diagnostics",
    "p-homework": "Homework",
    "p-submissions": "Submissions",
    "p-aistudio": "AI Studio",
    "p-errorbank": "Error Bank",
    "p-reports": "Reports",
    "p-analytics": "Analytics",
    "p-lms-mapping": "LMS Mapping",
    "p-settings": "Settings",
  };

  return (
    <div id="teacher-view" className="flex w-full overflow-hidden">
      <aside className="sidebar">
        <div className="sb-brand">
          <span className="sb-brand-name">V.V. Method</span>
          <span className="sb-brand-sub">MET Preparation</span>
        </div>
        <nav className="sb-nav">
          <span className="sb-nav-label">Main</span>
          <NavBtn
            id="p-dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-students"
            icon={Users}
            label="Students"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-calendar"
            icon={Calendar}
            label="Calendar"
            current={page}
            set={setPage}
          />

          <span className="sb-nav-label">Teaching</span>
          <NavBtn
            id="p-diagnostics"
            icon={Activity}
            label="Diagnostics"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-homework"
            icon={BookOpen}
            label="Homework"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-submissions"
            icon={Inbox}
            label="Submissions"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-aistudio"
            icon={Sparkles}
            label="AI Studio"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-errorbank"
            icon={AlertOctagon}
            label="Error Bank"
            current={page}
            set={setPage}
          />

          <span className="sb-nav-label">Reports</span>
          <NavBtn
            id="p-reports"
            icon={BarChart2}
            label="Reports"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-analytics"
            icon={LineChart}
            label="Analytics"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-lms-mapping"
            icon={Link}
            label="LMS Mapping"
            current={page}
            set={setPage}
          />
          <NavBtn
            id="p-settings"
            icon={Settings}
            label="Settings"
            current={page}
            set={setPage}
          />
        </nav>
        <div className="sb-user">
          <Avatar name="Vini V." size={30} />
          <div>
            <div className="sb-user-name">Vini V.</div>
            <div className="sb-user-role">Teacher</div>
          </div>
        </div>
      </aside>

      <div className="t-content">
        <header className="topbar">
          <div className="flex-1 text-[13px] text-[var(--muted)] font-medium">
            <span>{PAGE_LABELS[page] || page}</span>
          </div>
          <div className="topbar-right">
            <button
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
              onClick={handleDownloadReport}
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download Report</span>
            </button>
            <span className="topbar-role">Teacher</span>
            <Avatar name="Vini V." size={32} />
            <button className="btn btn-quiet btn-sm" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>

        <main className="t-main">
          {page === "p-dashboard" && <Dashboard setPage={setPage} />}
          {page === "p-students" && <Students />}
          {page === "p-calendar" && <CalendarPage />}
          {page === "p-diagnostics" && <Diagnostics />}
          {page === "p-homework" && <Homework />}
          {page === "p-submissions" && <Submissions />}
          {page === "p-aistudio" && <AIStudio />}
          {page === "p-errorbank" && <ErrorBank />}
          {page === "p-reports" && <Reports />}
          {page === "p-analytics" && <AnalyticsDashboard />}
          {page === "p-lms-mapping" && <LMSMappingTool />}
          {page === "p-settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

function NavBtn({ id, icon: Icon, label, current, set }: any) {
  return (
    <button
      className={"sb-btn " + (current === id ? "active" : "")}
      onClick={() => set(id)}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

/* --- Dashboard --- */
function Dashboard({ setPage }: { setPage: any }) {
  const h = new Date().getHours();
  const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const pending = STUDENTS.filter((s) => s.cycle === "submitted").length;
  const needsDx = STUDENTS.filter((s) => s.cycle === "needs-diagnosis").length;

  const sortedStudents = [...STUDENTS].sort((a, b) => {
    const ord = [
      "submitted",
      "needs-diagnosis",
      "diagnosed",
      "feedback-sent",
      "homework-assigned",
      "reviewed",
    ];
    return ord.indexOf(a.cycle) - ord.indexOf(b.cycle);
  });

  const needsAttention = STUDENTS.filter(
    (s) => s.cycle === "submitted" || s.cycle === "needs-diagnosis",
  );

  return (
    <div className="page active">
      <div className="page-inner">
        <div className="mb-7">
          <h1 className="page-title">Good {tod}, Vini.</h1>
          <p className="page-sub">{today}</p>
        </div>

        <div className="g-auto mb-7">
          <KPICard
            label="Students"
            value={STUDENTS.length}
            tone="var(--accent-deep)"
          />
          <KPICard label="Classes today" value={0} tone="var(--accent-deep)" />
          <KPICard
            label="Need diagnosis"
            value={needsDx}
            tone={needsDx > 0 ? "var(--warning)" : "var(--accent-deep)"}
          />
          <KPICard
            label="Pending review"
            value={pending}
            tone={pending > 0 ? "var(--danger)" : "var(--accent-deep)"}
          />
        </div>

        <div className="g2">
          <div className="flex flex-col gap-[14px]">
            <div
              className={
                "card " +
                (needsAttention.length
                  ? "border-[var(--warning-soft)] bg-[var(--warning-bg)]"
                  : "") +
                " p-[18px]"
              }
            >
              <div className="sec-hdr">
                <div className="sec-title flex items-center gap-[8px]">
                  {needsAttention.length ? (
                    <span className="text-[var(--warning)]">⚡</span>
                  ) : null}
                  {needsAttention.length
                    ? "Needs Your Attention"
                    : "Today's Classes"}
                </div>
              </div>
              {needsAttention.length ? (
                needsAttention.slice(0, 4).map((s) => (
                  <div key={s.id} className="list-row">
                    <Avatar name={s.name} size={28} />
                    <div className="flex-1">
                      <div className="row-title">{s.firstName}</div>
                      <div className="row-sub">{cycleLabel(s.cycle)}</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        toast("Opening " + s.firstName + " workflow")
                      }
                    >
                      {CYCLE_CONFIG[s.cycle]?.action || "Open"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[var(--muted)] text-[13px] italic mt-[10px]">
                  No classes today.
                </p>
              )}
            </div>

            <div className="card p-[18px]">
              <div className="sec-hdr">
                <div className="sec-title">Submissions Awaiting Review</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage("p-submissions")}
                >
                  All submissions
                </button>
              </div>
              {STUDENTS.filter((s) => s.cycle === "submitted").length ? (
                STUDENTS.filter((s) => s.cycle === "submitted").map((s) => (
                  <div key={s.id} className="list-row">
                    <Avatar name={s.name} size={28} />
                    <div className="flex-1">
                      <div className="row-title">{s.firstName}</div>
                      <div className="row-sub">Ready to review</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => toast("Opening submission review")}
                    >
                      Review
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[var(--muted)] text-[13px] italic mt-[10px]">
                  No submissions waiting.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[14px]">
            <div className="card p-[18px]">
              <div className="sec-hdr">
                <div className="sec-title">Quick Actions</div>
              </div>
              <div className="flex flex-col gap-[8px] mt-[4px]">
                {[
                  { icon: "👥", label: "Add new student", page: "p-students" },
                  { icon: "📅", label: "Schedule a class", page: "p-calendar" },
                  {
                    icon: "⚡",
                    label: "Run a diagnosis",
                    page: "p-diagnostics",
                  },
                  { icon: "📋", label: "Create homework", page: "p-homework" },
                  { icon: "⚠", label: "View error bank", page: "p-errorbank" },
                ].map((a) => (
                  <button
                    key={a.page}
                    className="qa-btn"
                    onClick={() => setPage(a.page)}
                  >
                    <span>{a.icon}</span> {a.label}
                    <span className="qa-arrow">›</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-[18px]">
              <div className="sec-hdr">
                <div className="sec-title">Student Cycle Board</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage("p-students")}
                >
                  All students
                </button>
              </div>
              <div className="mt-[4px] flex flex-col gap-[6px]">
                {sortedStudents.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-[10px] py-[8px] border-b border-[var(--divider)]"
                  >
                    <Avatar name={s.name} size={26} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[12.5px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {s.firstName}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        Session {s.session}/{s.totalSessions}
                      </div>
                    </div>
                    <span className={"pill " + cycleTone(s.cycle)}>
                      {cycleLabel(s.cycle)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  tone,
}: {
  label: string;
  value: any;
  tone: string;
}) {
  return (
    <div className="card kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}
