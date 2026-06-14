import React, { useState, useMemo } from "react";
import {
  STUDENTS,
  SAMPLE_HW,
  SKILL_LABELS,
  ERRORS_BY_STUDENT,
} from "../lib/data";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Filter } from "lucide-react";

export default function AnalyticsDashboard() {
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [filterAssignment, setFilterAssignment] = useState("all");
  const [filterSession, setFilterSession] = useState("all");

  // --- Data Processors ---

  // 1. Student Performance Data
  // We mock a timeline by averaging skills across students or showing a specific student's skills
  const performanceData = useMemo(() => {
    let contextStudents = STUDENTS;
    if (filterSession !== "all") {
      contextStudents = contextStudents.filter(
        (s) => s.session.toString() === filterSession,
      );
    }
    if (filterStudent === "all") {
      return SKILL_LABELS.map((skill, index) => {
        let sum = 0;
        let count = 0;
        contextStudents.forEach((s) => {
          if (s.skills && s.skills[index]) {
            sum += s.skills[index];
            count++;
          }
        });
        return {
          skill,
          average: count > 0 ? Math.round(sum / count) : 0,
          score: 0,
        };
      });
    } else {
      const student = contextStudents.find((s) => s.id === filterStudent);
      return SKILL_LABELS.map((skill, index) => ({
        skill,
        average: 0,
        score: student?.skills ? student.skills[index] : 0,
      }));
    }
  }, [filterStudent, filterSession]);

  // 2. Homework Completion Rates (Pie)
  const completionData = useMemo(() => {
    let submitted = 0;
    let notStarted = 0;
    let inProgress = 0;
    let notAssigned = 0;

    let studentsInContext = STUDENTS;
    if (filterStudent !== "all") {
      studentsInContext = studentsInContext.filter(
        (s) => s.id === filterStudent,
      );
    }
    if (filterSession !== "all") {
      studentsInContext = studentsInContext.filter(
        (s) => s.session.toString() === filterSession,
      );
    }

    studentsInContext.forEach((student) => {
      let studentHws = SAMPLE_HW.filter((h) => h.studentId === student.id);

      if (filterAssignment !== "all") {
        studentHws = studentHws.filter((h) => h.id === filterAssignment);
      }

      if (studentHws.length === 0) {
        notAssigned++;
      } else {
        studentHws.forEach((hw) => {
          if (hw.status === "submitted" || hw.status === "reviewed")
            submitted++;
          else if (hw.status === "not-started") notStarted++;
          else inProgress++;
        });
      }
    });

    return [
      { name: "Completed", value: submitted },
      { name: "Not Started", value: notStarted },
      { name: "In Progress", value: inProgress },
      { name: "Not Assigned", value: notAssigned },
    ].filter((d) => d.value > 0);
  }, [filterStudent, filterAssignment, filterSession]);

  const PIE_COLORS = [
    "var(--success)",
    "var(--danger)",
    "var(--warning)",
    "var(--faint)",
  ];

  // 3. Common Errors / Misconceptions
  const errorData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(ERRORS_BY_STUDENT).forEach((sId) => {
      if (filterStudent !== "all" && sId !== filterStudent) return;

      const errors = ERRORS_BY_STUDENT[sId];
      errors.forEach((e) => {
        const type = e.type || "grammar";
        counts[type] = (counts[type] || 0) + 1;
      });
    });

    return Object.entries(counts).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
    }));
  }, [filterStudent]);

  // 4. Module Effectiveness (Mocked time series for assignments)
  const moduleEffectiveness = [
    { name: "Week 1", completion: 65, averageScore: 60 },
    { name: "Week 2", completion: 70, averageScore: 65 },
    { name: "Week 3", completion: 85, averageScore: 75 },
    { name: "Week 4", completion: 90, averageScore: 82 },
  ];

  return (
    <div className="page active">
      <div className="page-inner">
        <h1 className="page-title mb-2">Analytics</h1>
        <p className="page-sub mb-6">
          Track performance, completions, and error trends.
        </p>

        {/* Filters */}
        <div className="card p-[18px] mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-[var(--muted)] text-[13px] font-medium mr-2">
            <Filter size={16} /> Filters:
          </div>
          <select
            className="inp max-w-[200px]"
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
          >
            <option value="all">All Students</option>
            {STUDENTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="inp max-w-[200px]"
            value={filterAssignment}
            onChange={(e) => setFilterAssignment(e.target.value)}
          >
            <option value="all">All Assignments</option>
            {SAMPLE_HW.map((hw) => (
              <option key={hw.id} value={hw.id}>
                {hw.title}
              </option>
            ))}
          </select>
          <select
            className="inp max-w-[150px]"
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
          >
            <option value="all">All Sessions</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
              <option key={s} value={s.toString()}>
                Session {s}
              </option>
            ))}
          </select>
          <select
            className="inp max-w-[150px]"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Radar/Bar */}
          <div className="card p-5">
            <h2 className="sec-title mb-4">Skill Performance Breakdown</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="skill"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--bg-deep)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--sh-toast)",
                    }}
                  />
                  {filterStudent === "all" ? (
                    <Bar
                      dataKey="average"
                      name="Class Average"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  ) : (
                    <Bar
                      dataKey="score"
                      name="Student Score"
                      fill="var(--accent)"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Rates */}
          <div className="card p-5">
            <h2 className="sec-title mb-4">Homework Completion Rates</h2>
            <div className="h-[280px]">
              {completionData.reduce((acc, curr) => acc + curr.value, 0) ===
              0 ? (
                <div className="h-full flex items-center justify-center text-[var(--muted)] text-[13px]">
                  No homework data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Module Effectiveness Over Time */}
          <div className="card p-5">
            <h2 className="sec-title mb-4">Module Effectiveness Over Time</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={moduleEffectiveness}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    name="Completion Rate (%)"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageScore"
                    name="Avg Score (%)"
                    stroke="var(--success)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Common Errors */}
          <div className="card p-5">
            <h2 className="sec-title mb-4">Common Errors by Type</h2>
            <div className="h-[280px]">
              {errorData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--muted)] text-[13px]">
                  No error data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={errorData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                    />
                    <YAxis
                      dataKey="type"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--text)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--bg-deep)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Occurrences"
                      fill="var(--warning)"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
