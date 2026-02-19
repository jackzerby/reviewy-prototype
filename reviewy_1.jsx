import { useState, useCallback, useMemo, useEffect, useRef } from "react";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

const P = {
  bg: "#FFFDF7", sand: "#F5F0E8", border: "#E8E0D4", borderLight: "#F0EAE0",
  text: "#1D1D1D", muted: "#8C8272", light: "#B0A898",
  green: "#1B7F3F", greenBg: "#E6F5EC", greenBorder: "#B8DFC8",
  amber: "#B8860B", amberBg: "#FFF5E0", amberBorder: "#F0DEB0",
  blue: "#2563EB", blueBg: "#EFF6FF", blueBorder: "#BFDBFE",
  purple: "#7C3AED", purpleBg: "#F3EEFF", purpleBorder: "#D8C9F5",
};

const RC = {
  job_owner: { accent: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  assigned_manager: { accent: "#B8860B", bg: "#FFF8E8", border: "#F0DEB0" },
  assigned_reviewer: { accent: "#7C3AED", bg: "#F3EEFF", border: "#D8C9F5" },
};

const PEOPLE = {
  david: { name: "David Park", short: "David", title: "AIA · Park & Associates", actor: "job_owner", initials: "DP" },
  linda: { name: "Linda Torres", short: "Linda", title: "Central Valley USD", actor: "assigned_manager", initials: "LT" },
  sarah: { name: "Sarah Chen", short: "Sarah", title: "PE · Structural Review", actor: "assigned_reviewer", initials: "SC" },
};

const ACTOR_TO_PERSON = { job_owner: "david", assigned_manager: "linda", assigned_reviewer: "sarah" };

const STEPS = [
  {
    id: "draft", label: "Create Project", actor: "job_owner",
    actionLabel: "Create project", actionKind: "create_draft",
    desc: "Fill out the initial project details, add buildings, and invite contacts.",
    waitingDesc: "create the project and submit project details",
    formType: "draft",
    completedData: {
      by: "david", at: "Jan 5 at 10:30am",
      fields: [
        { label: "Project Name", value: "New Auditorium Wing" },
        { label: "School District", value: "Central Valley USD" },
        { label: "Project Manager", value: "Linda Torres" },
        { label: "Buildings", value: "Auditorium, Corridor Connection" },
      ],
    },
  },
  {
    id: "submitted", label: "Submitted", actor: "assigned_manager",
    actionLabel: "Assign Control Number", actionKind: "assign_control_numbers",
    desc: "Assign control numbers for all buildings in this project.",
    waitingDesc: "assign control numbers for each building",
    formType: "control_numbers",
    completedData: {
      by: "linda", at: "Jan 8 at 9:12am",
      fields: [
        { label: "Primary Control Number", value: "CN-2025-0847" },
        { label: "Building A", value: "B-0847-A (Auditorium)" },
        { label: "Building B", value: "B-0847-B (Corridor Connection)" },
      ],
    },
  },
  {
    id: "control_number_assigned", label: "Control Number Assigned", actor: "job_owner",
    actionLabel: "Submit Prescreening Package", actionKind: "submit_prescreening_package",
    desc: "Upload the prescreening package including specifications and any required review documents.",
    waitingDesc: "upload the prescreening package with specifications and review documents",
    formType: "prescreening",
    completedData: {
      by: "david", at: "Jan 14 at 4:22pm",
      files: [
        "Specifications — Project Manual (326 pages)",
        "Architectural Review — Code Compliance Narrative",
        "MEP Review — Mechanical/Electrical/Plumbing Narrative",
      ],
    },
  },
  {
    id: "prescreening_submitted", label: "Prescreening Submitted", actor: "assigned_manager",
    actionLabel: "Queue for Technical Review", actionKind: "queue_technical_review",
    desc: "Confirm the prescreening package is complete and queue this project for technical review.",
    waitingDesc: "confirm the prescreening package and queue for technical review",
    attachedFiles: [
      "Specifications — Project Manual (326 pages)",
      "Architectural Review — Code Compliance Narrative",
      "MEP Review — Mechanical/Electrical/Plumbing Narrative",
    ],
    completedData: {
      by: "linda", at: "Jan 15 at 10:30am",
      fields: [{ label: "Action", value: "Queued for technical review" }],
    },
  },
  {
    id: "technical_review_queued", label: "Awaiting Technical Review", actor: "assigned_manager",
    actionLabel: "Start Technical Review", actionKind: "start_technical_review",
    desc: "Assign at least one reviewer and begin the technical review process.",
    waitingDesc: "assign reviewers and start the technical review",
    formType: "assign_reviewers",
    completedData: {
      by: "linda", at: "Jan 16 at 8:45am",
      fields: [
        { label: "Assigned Reviewers", value: "Sarah Chen, PE · James Wilson, RA" },
        { label: "Disciplines", value: "Structural, Architectural" },
      ],
    },
  },
  {
    id: "technical_review_started", label: "Technical Review In Progress",
    actor: "assigned_reviewer", type: "loop",
    loop: { submit: "david", review: "sarah" },
    actionLabel: "Complete Technical Review", actionKind: "complete_technical_review",
    desc: "All required files must be approved before technical review can be completed. Each file is reviewed individually.",
    completedData: {
      by: "sarah", at: "Feb 3 at 11:30am",
      summary: "All 1,500 files reviewed and approved across 8 disciplines and 3 buildings.",
    },
  },
  {
    id: "technical_review_completed", label: "Technical Review Complete", actor: "assigned_manager",
    actionLabel: "Start Fiscal Review", actionKind: "start_fiscal_review",
    desc: "Technical review is complete. Start the fiscal review phase.",
    waitingDesc: "start the fiscal review",
    completedData: {
      by: "linda", at: "Feb 4 at 9:00am",
      fields: [{ label: "Action", value: "Fiscal review started" }],
    },
  },
  {
    id: "fiscal_associate_review_started", label: "Fiscal Review In Progress", actor: "assigned_manager",
    actionLabel: "Approve Project", actionKind: "approve_project",
    desc: "Complete the fiscal review and approve this project.",
    waitingDesc: "complete the fiscal review and approve this project",
    completedData: {
      by: "linda", at: "Feb 10 at 3:15pm",
      fields: [
        { label: "Fiscal Status", value: "Approved — within budget allocation" },
        { label: "Funding Source", value: "Measure K Bond Fund" },
      ],
    },
  },
  {
    id: "project_approved", label: "Project Approved", actor: "job_owner",
    actionLabel: "Submit Certificate", actionKind: "submit_certificate",
    desc: "Upload the certificate of occupancy to finalize this project.",
    waitingDesc: "upload the certificate of occupancy",
    upload: true, guided: true,
    completedData: {
      by: "david", at: "Sep 15 at 2:00pm",
      files: ["Certificate of Occupancy — B-0847-A", "Certificate of Occupancy — B-0847-B"],
    },
  },
];

function generateFiles(count) {
  const D = [
    { code: "A", name: "Architectural" }, { code: "S", name: "Structural" },
    { code: "M", name: "Mechanical" }, { code: "E", name: "Electrical" },
    { code: "P", name: "Plumbing" }, { code: "L", name: "Landscape" },
    { code: "C", name: "Civil" }, { code: "FP", name: "Fire Protection" },
  ];
  const B = ["Building A", "Building B", "Building C"];
  const T = ["Plan", "Details", "Schedule", "Sections", "Elevations", "Diagram", "Layout", "Enlarged", "Specs", "Notes"];
  const FB = [
    "Dimensions missing on boundary. Add easement lines.",
    "Width undersized — code minimum not met.",
    "Callouts incomplete. Show finish elevations.",
    "Conflicts with adjacent discipline. Coordinate.",
    "Fire rating missing. Add UL assembly reference.",
    "Count doesn't match occupancy calc.",
    "Sizing undersized for load. Verify calculations.",
    "Exceeds max capacity. Split required.",
    "Slope missing. Verify ADA compliance.",
    "Connection needs clarification.",
    "Clearance dimensions missing.",
    "Non-standard detail. Confirm spec value.",
  ];
  const files = [];
  for (let i = 0; i < count; i++) {
    const dIdx = i % 8;
    const seq = Math.floor(i / 8);
    const d = D[dIdx];
    const b = B[seq % 3];
    const major = Math.floor(seq / 10) + 1;
    const minor = (seq % 10) + 1;
    const t = T[seq % 10];
    const h = (i * 7 + 3) % 100;
    const status = h < 56 ? "approved" : h < 84 ? "feedback" : "pending";
    files.push({
      id: i + 1,
      name: `${d.code}${major}.${minor} — ${t}`,
      discipline: d.name,
      building: b,
      status,
      rounds: [{ v: 1, status, fb: status === "feedback" ? FB[i % 12] : null, by: "sarah", date: `Jan ${15 + (i % 14)}` }],
    });
  }
  return files;
}

const INIT_FILES = generateFiles(1500);

const UM = { job_owner: "david", assigned_manager: "linda", assigned_reviewer: "sarah" };

/* ─── Primitives ─── */

function Av({ id, size = 28 }) {
  const p = PEOPLE[id];
  return (
    <div style={{
      width: size, height: size, borderRadius: size, background: RC[p.actor].accent, color: "white",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, flexShrink: 0,
    }}>{p.initials}</div>
  );
}

function WaitCard({ id, waitingFor }) {
  return (
    <div style={{ padding: 28, background: P.sand, borderRadius: 12, border: `1px solid ${P.border}`, textAlign: "center" }}>
      <Av id={id} size={44} />
      <div style={{ fontSize: 15, fontWeight: 600, color: P.text, marginTop: 12 }}>Waiting on {PEOPLE[id].name}</div>
      <div style={{ fontSize: 15, color: P.muted, marginTop: 4, lineHeight: 1.5 }}>
        {waitingFor ? `to ${waitingFor}` : "You'll be notified when it's your turn."}
      </div>
    </div>
  );
}

function Btn({ children, onClick, color = P.green, outline }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 28px", borderRadius: 8, fontSize: 16, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
      background: outline ? "white" : color, color: outline ? color : "white",
      border: outline ? `2px solid ${color}` : "2px solid transparent",
    }}>{children}</button>
  );
}

/* ─── Virtual List ─── */

function VirtualList({ items, rowHeight, containerHeight, renderRow }) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * rowHeight;
  const visibleCount = Math.ceil((containerHeight || 400) / rowHeight);
  const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
  const endIdx = Math.min(items.length, startIdx + visibleCount + 10);
  const offset = startIdx * rowHeight;
  return (
    <div onScroll={e => setScrollTop(e.target.scrollTop)}
      style={{ height: containerHeight || "100%", overflow: "auto" }}>
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offset}px)` }}>
          {items.slice(startIdx, endIdx).map((item, i) => renderRow(item, startIdx + i))}
        </div>
      </div>
    </div>
  );
}

/* ─── Completed Detail ─── */

function CompletedDetail({ step }) {
  const d = step.completedData;
  if (!d) return null;
  return (
    <div style={{ marginTop: 14, padding: 22, background: "white", borderRadius: 12, border: `1px solid ${P.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, marginBottom: 16, borderBottom: `1px solid ${P.borderLight}` }}>
        <Av id={d.by} size={24} />
        <span style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{PEOPLE[d.by].name}</span>
        <span style={{ fontSize: 14, color: P.light }}>· {d.at}</span>
      </div>
      {d.fields && d.fields.map((f, i) => (
        <div key={i} style={{ marginBottom: i < d.fields.length - 1 ? 14 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: P.light, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{f.label}</div>
          <div style={{ fontSize: 16, color: P.text, lineHeight: 1.45 }}>{f.value}</div>
        </div>
      ))}
      {d.files && d.files.map((f, i) => (
        <div key={i} style={{ padding: "10px 14px", background: P.sand, borderRadius: 8, fontSize: 15, color: P.text, marginBottom: 4 }}>📄 {f}</div>
      ))}
      {d.summary && <div style={{ fontSize: 16, color: P.text, lineHeight: 1.5 }}>{d.summary}</div>}
    </div>
  );
}

/* ─── Slideout Drawer ─── */

function Slideout({ open, onClose, children }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 200 }} />}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(480px, 90vw)", zIndex: 210,
        background: P.bg, borderLeft: `1px solid ${P.border}`,
        boxShadow: open ? "-8px 0 30px rgba(0,0,0,0.1)" : "none",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: P.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>File Review</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: P.light, cursor: "pointer", padding: "0 4px", lineHeight: 1, fontFamily: "inherit" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>{children}</div>
      </div>
    </>
  );
}

/* ─── File Detail (inside slideout) ─── */

function FileDetail({ file, user, onUpdate }) {
  const last = file.rounds[file.rounds.length - 1];
  const actor = PEOPLE[user].actor;
  const upload = () => onUpdate({ ...file, status: "pending", rounds: [...file.rounds, { v: file.rounds.length + 1, status: "pending", fb: null, by: "david", date: "Now" }] });
  const rev = (ok) => {
    const rs = [...file.rounds]; const l = { ...rs[rs.length - 1] };
    l.status = ok ? "approved" : "feedback"; l.fb = ok ? null : "Revision addresses most issues. Verify dimension at detail 3/A6.1."; l.by = "sarah";
    rs[rs.length - 1] = l;
    onUpdate({ ...file, status: ok ? "approved" : "feedback", rounds: rs });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: P.text }}>{file.name}</span>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
          color: file.status === "approved" ? P.green : file.status === "pending" ? P.purple : P.amber,
          background: file.status === "approved" ? P.greenBg : file.status === "pending" ? P.purpleBg : P.amberBg,
          padding: "4px 10px", borderRadius: 6 }}>
          {file.status === "approved" ? "Approved" : file.status === "pending" ? "Under Review" : "Changes Requested"}
        </span>
      </div>
      {file.rounds.map((r, i) => (
        <div key={i} style={{
          padding: "14px 16px",
          background: r.status === "approved" ? P.greenBg : r.status === "pending" ? "#FFFCE6" : P.sand,
          borderRadius: 10, marginBottom: 8, border: `1px solid ${r.status === "approved" ? P.greenBorder : P.border}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Av id={r.by} size={24} /><span style={{ fontSize: 15, fontWeight: 700 }}>Version {r.v}</span></div>
            <span style={{ fontSize: 14, color: P.light }}>{r.date}</span>
          </div>
          {r.fb && <div style={{ marginTop: 10, fontSize: 15, color: P.text, lineHeight: 1.55 }}>{r.fb}</div>}
          {r.status === "approved" && <div style={{ marginTop: 8, fontSize: 15, color: P.green, fontWeight: 700 }}>✓ Approved</div>}
          {r.status === "pending" && <div style={{ marginTop: 8, fontSize: 15, color: P.purple, fontWeight: 600 }}>Awaiting review…</div>}
        </div>
      ))}
      {file.status !== "approved" && <div style={{ marginTop: 16 }}>
        {last.status === "feedback" && actor === "job_owner" && (
          <div onClick={upload} style={{ border: `2px dashed ${P.blueBorder}`, borderRadius: 10, padding: 22, textAlign: "center", cursor: "pointer", background: P.blueBg }}>
            <span style={{ fontSize: 16, color: P.blue, fontWeight: 600 }}>Upload version {file.rounds.length + 1}</span>
          </div>
        )}
        {last.status === "feedback" && actor !== "job_owner" && <div style={{ textAlign: "center", padding: 16, color: P.muted, fontSize: 15 }}>Waiting on {PEOPLE.david.name} to upload a revised version addressing the feedback</div>}
        {last.status === "pending" && actor === "assigned_reviewer" && (
          <div style={{ display: "flex", gap: 10 }}><Btn onClick={() => rev(true)}>✓ Approve</Btn><Btn onClick={() => rev(false)} color={P.amber} outline>Request changes</Btn></div>
        )}
        {last.status === "pending" && actor !== "assigned_reviewer" && <div style={{ textAlign: "center", padding: 16, color: P.muted, fontSize: 15 }}>Waiting on {PEOPLE.sarah.name} to review version {last.v} and approve or request changes</div>}
      </div>}
    </div>
  );
}

/* FileLoop removed — replaced by ReviewDashboard */

/* ─── Step Forms ─── */

function DraftForm({ onComplete }) {
  const [buildings, setBuildings] = useState([{ name: "", code: "" }]);
  const [contacts, setContacts] = useState([{ name: "", email: "", phone: "", title: "", permission: "notify" }]);

  const inp = { width: "100%", padding: "12px 14px", border: `1.5px solid ${P.border}`, borderRadius: 8, fontSize: 16, fontFamily: "inherit", background: "white", boxSizing: "border-box" };
  const sel = { ...inp, appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23B0A898' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" };
  const sectionRow = { display: "flex", gap: 32, marginBottom: 36, alignItems: "flex-start" };
  const sidebar = { width: 240, flexShrink: 0 };
  const sideTitle = { fontSize: 20, fontWeight: 800, color: P.text, margin: 0 };
  const sideDesc = { fontSize: 14, color: P.muted, marginTop: 6, lineHeight: 1.5 };
  const fieldRow = { display: "flex", gap: 16, marginBottom: 16 };
  const label = { fontSize: 14, fontWeight: 700, color: P.text, display: "block", marginBottom: 6 };
  const removeBtn = { background: "none", border: `1.5px solid #D4524D`, borderRadius: 6, color: "#D4524D", fontSize: 13, fontWeight: 600, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" };
  const addBtn = { background: "none", border: `1.5px solid ${P.border}`, borderRadius: 8, color: P.text, fontSize: 15, fontWeight: 600, padding: "10px 18px", cursor: "pointer", fontFamily: "inherit" };

  const addBuilding = () => setBuildings(b => [...b, { name: "", code: "" }]);
  const removeBuilding = (i) => setBuildings(b => b.filter((_, j) => j !== i));
  const addContact = () => setContacts(c => [...c, { name: "", email: "", phone: "", title: "", permission: "notify" }]);
  const removeContact = (i) => setContacts(c => c.filter((_, j) => j !== i));

  return (
    <div>
      {/* Details */}
      <div style={sectionRow}>
        <div style={sidebar}>
          <h3 style={sideTitle}>Details</h3>
          <div style={sideDesc}>Fill out the basic details of your project, including project name, code, school district, project manager, and other key information.</div>
        </div>
        <div style={{ flex: 1, padding: 24, background: P.sand, borderRadius: 12, border: `1px solid ${P.border}` }}>
          <div style={fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={label}>Project name</label>
              <input type="text" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Project code</label>
              <input type="text" style={inp} />
            </div>
          </div>
          <div style={fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={label}>School district</label>
              <select style={sel}>
                <option value="">Please select</option>
                <option value="cvusd">Central Valley USD</option>
                <option value="lausd">Los Angeles USD</option>
                <option value="sfusd">San Francisco USD</option>
                <option value="bps">Buffalo Public Schools</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Project manager</label>
              <select style={sel}>
                <option value="">Please select</option>
                <option value="linda">Linda Torres</option>
                <option value="mike">Mike Reeves</option>
                <option value="janet">Janet Kim</option>
              </select>
            </div>
          </div>
          <div style={fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={label}>BEDS Code</label>
              <input type="text" placeholder="XX-XX-XX-XX" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>CSI Codes</label>
              <input type="text" style={inp} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Project type</label>
              <input type="text" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>LOI Document</label>
              <div style={{ ...inp, display: "flex", alignItems: "center", gap: 8, color: P.light, cursor: "pointer" }}>
                <span style={{ fontSize: 16 }}>📎</span> Upload LOI document…
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings */}
      <div style={sectionRow}>
        <div style={sidebar}>
          <h3 style={sideTitle}>Buildings</h3>
          <div style={sideDesc}>Add the buildings associated with this project.</div>
        </div>
        <div style={{ flex: 1 }}>
          {buildings.map((b, i) => (
            <div key={i} style={{ padding: 24, background: P.sand, borderRadius: 12, border: `1px solid ${P.border}`, marginBottom: 10 }}>
              <div style={fieldRow}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Name of building</label>
                  <input type="text" style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label}>Building code</label>
                  <input type="text" style={inp} />
                </div>
              </div>
              <button onClick={() => removeBuilding(i)} style={removeBtn}>Remove</button>
            </div>
          ))}
          <button onClick={addBuilding} style={addBtn}>+ Add building</button>
        </div>
      </div>

      {/* Invite contacts */}
      <div style={sectionRow}>
        <div style={sidebar}>
          <h3 style={sideTitle}>Invite contacts</h3>
          <div style={sideDesc}>Add or invite contacts to this job. These contacts will be notified when the job is published and can access job details.</div>
        </div>
        <div style={{ flex: 1 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ padding: 24, background: P.sand, borderRadius: 12, border: `1px solid ${P.border}`, marginBottom: 10 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={label}>Name</label>
                <input type="text" style={inp} />
              </div>
              <div style={fieldRow}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Email</label>
                  <input type="email" style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label}>Phone</label>
                  <input type="tel" style={inp} />
                </div>
              </div>
              <div style={fieldRow}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Title</label>
                  <input type="text" style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label}>Permission</label>
                  <select style={sel}>
                    <option value="notify">Only Receive Notifications</option>
                    <option value="view">View Only</option>
                    <option value="edit">Can Edit</option>
                  </select>
                </div>
              </div>
              <button onClick={() => removeContact(i)} style={removeBtn}>Remove</button>
            </div>
          ))}
          <button onClick={addContact} style={addBtn}>+ Add contact</button>
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onComplete} style={{
          padding: "14px 28px", borderRadius: 8, fontSize: 16, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          background: P.text, color: "white", border: "none",
        }}>Create project</button>
      </div>
    </div>
  );
}

const BUILDINGS = [
  { name: "Main Building", code: "001" },
  { name: "Annex", code: "002" },
];

function ControlNumbersForm({ onComplete }) {
  const [controlNums, setControlNums] = useState(BUILDINGS.map(() => ""));
  const inp = { width: "100%", padding: "12px 14px", border: `1.5px solid ${P.border}`, borderRadius: 8, fontSize: 16, fontFamily: "inherit", background: "white", boxSizing: "border-box" };
  const readOnly = { ...inp, background: "#F0F0F0", color: P.muted };
  const label = { fontSize: 14, fontWeight: 700, color: P.text, display: "block", marginBottom: 6 };

  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: P.text, margin: "0 0 16px 0" }}>Buildings</h3>
      {BUILDINGS.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Name</label>
            <input type="text" value={b.name} readOnly style={readOnly} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Code</label>
            <input type="text" value={b.code} readOnly style={readOnly} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Control number</label>
            <input type="text" value={controlNums[i]} onChange={e => { const c = [...controlNums]; c[i] = e.target.value; setControlNums(c); }} style={inp} />
          </div>
        </div>
      ))}
      <Btn onClick={onComplete} color={RC.assigned_manager.accent}>Assign Control Number →</Btn>
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width: 52, height: 30, borderRadius: 15, cursor: "pointer", flexShrink: 0,
      background: on ? P.green : "#E0DCD4", transition: "background 0.2s",
      position: "relative",
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 12, background: "white",
        position: "absolute", top: 3, left: on ? 25 : 3,
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }} />
    </div>
  );
}

const AVAILABLE_REVIEWERS = [
  { id: "sarah", name: "Sarah Chen, PE", discipline: "Structural" },
  { id: "james", name: "James Wilson, RA", discipline: "Architectural" },
  { id: "maria", name: "Maria Garcia, PE", discipline: "Mechanical / Electrical" },
  { id: "robert", name: "Robert Kim, PE", discipline: "Plumbing / Fire Protection" },
  { id: "anne", name: "Anne Foster, PLA", discipline: "Landscape" },
  { id: "tom", name: "Tom Nakamura, PE", discipline: "Civil" },
];

function AssignReviewersForm({ onComplete }) {
  const [selected, setSelected] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = (reviewer) => {
    setSelected(prev =>
      prev.find(r => r.id === reviewer.id)
        ? prev.filter(r => r.id !== reviewer.id)
        : [...prev, reviewer]
    );
  };

  const inp = { width: "100%", padding: "12px 14px", border: `1.5px solid ${P.border}`, borderRadius: 8, fontSize: 16, fontFamily: "inherit", background: "white", boxSizing: "border-box" };
  const label = { fontSize: 14, fontWeight: 700, color: P.text, display: "block", marginBottom: 6 };

  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: P.text, margin: "0 0 20px 0" }}>Assign Reviewers</h3>
      <p style={{ fontSize: 15, color: P.muted, margin: "0 0 20px 0", lineHeight: 1.55 }}>Select one or more reviewers for this technical review. Each reviewer will be assigned based on their discipline.</p>

      <label style={label}>Reviewers</label>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <div onClick={() => setDropdownOpen(!dropdownOpen)} style={{
          ...inp, cursor: "pointer", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minHeight: 48,
          borderColor: dropdownOpen ? P.blue : P.border,
        }}>
          {selected.length === 0 && <span style={{ color: P.light }}>Select reviewers...</span>}
          {selected.map(r => (
            <span key={r.id} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 6, fontSize: 14, fontWeight: 600,
              background: P.purpleBg, color: P.purple, border: `1px solid ${P.purpleBorder}`,
            }}>
              {r.name}
              <span onClick={(e) => { e.stopPropagation(); toggle(r); }} style={{ cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</span>
            </span>
          ))}
        </div>
        {dropdownOpen && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
            background: "white", border: `1.5px solid ${P.border}`, borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)", marginTop: 4, overflow: "hidden",
          }}>
            {AVAILABLE_REVIEWERS.map(r => {
              const isSelected = selected.find(s => s.id === r.id);
              return (
                <div key={r.id} onClick={() => toggle(r)} style={{
                  padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  background: isSelected ? P.purpleBg : "white", borderBottom: `1px solid ${P.borderLight}`,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, border: `2px solid ${isSelected ? P.purple : P.border}`,
                    background: isSelected ? P.purple : "white", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 13, fontWeight: 800, flexShrink: 0,
                  }}>{isSelected ? "✓" : ""}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: P.muted }}>{r.discipline}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Selected ({selected.length})</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {selected.map(r => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                background: P.sand, borderRadius: 10, border: `1px solid ${P.border}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 32, background: P.purple, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>{r.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: P.muted }}>{r.discipline}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Btn onClick={onComplete} color={RC.assigned_manager.accent}>
        {selected.length > 0 ? `Start Review with ${selected.length} Reviewer${selected.length > 1 ? "s" : ""} →` : "Select at least one reviewer"}
      </Btn>
    </div>
  );
}

function PrescreeningForm({ onComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const doUpload = () => {
    setUploading(true);
    let p = 0;
    const tick = () => {
      p += 2;
      if (p > 100) p = 100;
      setProgress(p);
      if (p < 100) setTimeout(tick, 40);
      else setDone(true);
    };
    setTimeout(tick, 40);
  };

  const fileNames = useMemo(() => {
    const codes = ["A","S","M","E","P","L","C","FP"];
    const types = ["Plan","Details","Schedule","Sections","Elevations","Diagram","Layout","Enlarged","Specs","Notes"];
    const names = [];
    for (let i = 0; i < 1500; i++) {
      const c = codes[i % 8];
      const s = Math.floor(Math.floor(i / 8) / 10) + 1;
      const t = types[Math.floor(i / 8) % 10];
      names.push(`${c}${s}.${(Math.floor(i / 8) % 10) + 1} — ${t}`);
    }
    return names;
  }, []);

  const visibleCount = Math.round((progress / 100) * 1500);

  if (!uploading) {
    return (
      <div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: P.text, margin: "0 0 24px 0" }}>Upload Project Files</h3>
        <div onClick={doUpload} style={{
          border: `2px dashed ${P.border}`, borderRadius: 12, padding: 40,
          textAlign: "center", cursor: "pointer", background: P.sand,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>☁️</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: P.text }}>Upload files</div>
          <div style={{ fontSize: 15, color: P.muted, marginTop: 4 }}>Click to upload ~1,500 project files</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: P.text, margin: "0 0 16px 0" }}>Uploading Files</h3>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: done ? P.green : P.text }}>{done ? "Upload complete" : "Uploading..."}</span>
          <span style={{ fontSize: 14, color: P.muted }}>{visibleCount.toLocaleString()} / 1,500</span>
        </div>
        <div style={{ height: 8, background: P.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", background: done ? P.green : P.blue, borderRadius: 4, width: `${progress}%`, transition: "width 0.08s" }} />
        </div>
      </div>
      <VirtualList
        items={fileNames.slice(0, visibleCount)}
        rowHeight={40}
        containerHeight={280}
        renderRow={(name, i) => (
          <div key={i} style={{ height: 40, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", fontSize: 14, color: P.text, borderBottom: `1px solid ${P.borderLight}` }}>
            <span style={{ color: P.green, fontWeight: 700, fontSize: 16 }}>✓</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          </div>
        )}
      />
      {done && <div style={{ marginTop: 16 }}><Btn onClick={onComplete}>Submit Prescreening Package →</Btn></div>}
    </div>
  );
}

function UploadStep({ onComplete, kind }) {
  const [f, setF] = useState(null);
  const labels = {
    submit_prescreening_package: { empty: "Click to upload prescreening package", done: "Prescreening_Package.zip", sub: "Specifications + review documents" },
    submit_certificate: { empty: "Click to upload certificate of occupancy", done: "Certificate_of_Occupancy.pdf", sub: "2 certificates ready" },
  };
  const l = labels[kind] || labels.submit_prescreening_package;
  return (
    <div>
      <div onClick={() => setF(l.done)} style={{ border: `2px dashed ${P.border}`, borderRadius: 12, padding: 32, textAlign: "center", cursor: "pointer", background: f ? P.greenBg : P.sand }}>
        <div style={{ fontSize: 28 }}>{f ? "📦" : "☁️"}</div>
        <div style={{ fontSize: 17, fontWeight: 600, marginTop: 10, color: f ? P.text : P.muted }}>{f || l.empty}</div>
        {f && <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>{l.sub}</div>}
      </div>
      {f && <div style={{ marginTop: 16 }}><Btn onClick={onComplete}>Submit →</Btn></div>}
    </div>
  );
}

/* ─── Review Dashboard ─── */

function Checkbox({ checked, indeterminate, onChange, size = 18 }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onChange(); }} style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0, cursor: "pointer",
      border: `2px solid ${checked || indeterminate ? P.blue : P.border}`,
      background: checked ? P.blue : indeterminate ? P.blue : "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize: size * 0.7, fontWeight: 800, lineHeight: 1,
    }}>{checked ? "✓" : indeterminate ? "–" : ""}</div>
  );
}

function ReviewDashboard({ files, setFiles, user, onComplete, onBack, isMobile }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [openFile, setOpenFile] = useState(null);
  const [checked, setChecked] = useState(new Set());

  const actor = PEOPLE[user].actor;
  const update = useCallback((u) => setFiles(prev => prev.map(f => f.id === u.id ? u : f)), [setFiles]);
  const openFileData = openFile !== null ? files.find(f => f.id === openFile) : null;

  const counts = useMemo(() => ({
    all: files.length,
    approved: files.filter(f => f.status === "approved").length,
    feedback: files.filter(f => f.status === "feedback").length,
    pending: files.filter(f => f.status === "pending").length,
  }), [files]);

  const flatList = useMemo(() => {
    let filtered = files;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.discipline.toLowerCase().includes(q) ||
        f.building.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") filtered = filtered.filter(f => f.status === statusFilter);
    if (groupBy === "none") return filtered.map(f => ({ type: "file", data: f }));

    const groups = {};
    filtered.forEach(f => {
      const key = groupBy === "discipline" ? f.discipline : f.building;
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    const result = [];
    Object.keys(groups).sort().forEach(key => {
      const items = groups[key];
      const approved = items.filter(f => f.status === "approved").length;
      result.push({ type: "header", label: key, count: items.length, approved });
      items.forEach(f => result.push({ type: "file", data: f }));
    });
    return result;
  }, [files, searchQuery, statusFilter, groupBy]);

  // All visible file IDs (excludes headers)
  const visibleFileIds = useMemo(() => flatList.filter(r => r.type === "file").map(r => r.data.id), [flatList]);
  const allVisibleChecked = visibleFileIds.length > 0 && visibleFileIds.every(id => checked.has(id));
  const someVisibleChecked = visibleFileIds.some(id => checked.has(id));

  const toggleOne = (id) => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (allVisibleChecked) {
      setChecked(prev => { const next = new Set(prev); visibleFileIds.forEach(id => next.delete(id)); return next; });
    } else {
      setChecked(prev => { const next = new Set(prev); visibleFileIds.forEach(id => next.add(id)); return next; });
    }
  };

  const bulkApprove = () => {
    setFiles(prev => prev.map(f => {
      if (!checked.has(f.id) || f.status === "approved") return f;
      const rounds = [...f.rounds];
      const last = { ...rounds[rounds.length - 1], status: "approved", fb: null, by: "sarah" };
      rounds[rounds.length - 1] = last;
      return { ...f, status: "approved", rounds };
    }));
    setChecked(new Set());
  };

  const allApproved = counts.approved === counts.all;
  const padH = isMobile ? 12 : 24;
  const listHeight = Math.max(200, (typeof window !== "undefined" ? window.innerHeight : 800) - (isMobile ? 380 : 350));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Breadcrumb */}
      <div style={{ padding: `0 ${padH}px`, height: 48, display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, borderBottom: `1px solid ${P.border}`, flexShrink: 0, background: "white" }}>
        <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: P.blue, fontSize: isMobile ? 13 : 14, fontWeight: 600, flexShrink: 0 }}>
          ← {isMobile ? "Back" : "Back to timeline"}
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: isMobile ? 13 : 14, fontWeight: 600, color: P.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isMobile ? "Technical Review" : `Step 6 of ${STEPS.length} · Technical Review`}
        </div>
        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: P.green, flexShrink: 0 }}>
          {counts.approved}/{counts.all}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: `12px ${padH}px`, borderBottom: `1px solid ${P.borderLight}`, flexShrink: 0, background: P.bg }}>
        <input
          type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${files.length.toLocaleString()} files...`}
          style={{ width: "100%", padding: isMobile ? "8px 12px" : "10px 14px", border: `1.5px solid ${P.border}`, borderRadius: 8, fontSize: isMobile ? 14 : 15, fontFamily: "inherit", background: "white", boxSizing: "border-box", marginBottom: 10 }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {[
            ["all", `All (${counts.all})`],
            ["approved", `Approved (${counts.approved})`],
            ["feedback", `Feedback (${counts.feedback})`],
            ["pending", `Pending (${counts.pending})`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setStatusFilter(key)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: statusFilter === key ? (key === "approved" ? P.greenBg : key === "feedback" ? P.amberBg : key === "pending" ? P.purpleBg : P.sand) : "white",
              color: statusFilter === key ? (key === "approved" ? P.green : key === "feedback" ? P.amber : key === "pending" ? P.purple : P.text) : P.muted,
              border: `1.5px solid ${statusFilter === key ? (key === "approved" ? P.greenBorder : key === "feedback" ? P.amberBorder : key === "pending" ? P.purpleBorder : P.border) : P.borderLight}`,
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["none", "discipline", "building"].map(g => (
            <button key={g} onClick={() => setGroupBy(g)} style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: groupBy === g ? P.text : "transparent",
              color: groupBy === g ? "white" : P.muted,
              border: groupBy === g ? "none" : `1px solid ${P.borderLight}`,
            }}>{g === "none" ? "None" : g === "discipline" ? "Discipline" : "Building"}</button>
          ))}
        </div>
      </div>

      {/* Bulk action bar — visible when files are checked */}
      {checked.size > 0 && (
        <div style={{
          padding: `8px ${padH}px`, display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
          background: P.blueBg, borderBottom: `1px solid ${P.blueBorder}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: P.blue }}>{checked.size} selected</span>
          <button onClick={bulkApprove} style={{
            padding: isMobile ? "5px 10px" : "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: P.green, color: "white", border: "none",
          }}>Approve Selected</button>
          <button onClick={() => setChecked(new Set())} style={{
            padding: isMobile ? "5px 10px" : "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: "white", color: P.muted, border: `1px solid ${P.border}`,
          }}>Clear</button>
        </div>
      )}

      {/* Column header with master checkbox */}
      <div style={{
        display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, padding: `8px ${padH}px`,
        borderBottom: `2px solid ${P.border}`, flexShrink: 0, background: "white",
      }}>
        <Checkbox checked={allVisibleChecked} indeterminate={!allVisibleChecked && someVisibleChecked} onChange={toggleAll} />
        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: P.light, textTransform: "uppercase", letterSpacing: "0.06em" }}>File</span>
        {!isMobile && <span style={{ fontSize: 12, fontWeight: 700, color: P.light, textTransform: "uppercase", letterSpacing: "0.06em", width: 90, textAlign: "center" }}>Discipline</span>}
        <span style={{ fontSize: 12, fontWeight: 700, color: P.light, textTransform: "uppercase", letterSpacing: "0.06em", width: 28, textAlign: "center" }}>Status</span>
        {!isMobile && <span style={{ width: 16 }} />}
      </div>

      {/* File list */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <VirtualList
          items={flatList}
          rowHeight={56}
          containerHeight={listHeight}
          renderRow={(item, idx) => {
            if (item.type === "header") {
              const groupFileIds = flatList.slice(idx + 1).filter(r => r.type === "file").map(r => r.data.id);
              const nextHeaderIdx = flatList.findIndex((r, j) => j > idx && r.type === "header");
              const groupItems = nextHeaderIdx === -1
                ? flatList.slice(idx + 1).filter(r => r.type === "file")
                : flatList.slice(idx + 1, nextHeaderIdx).filter(r => r.type === "file");
              const gIds = groupItems.map(r => r.data.id);
              const allGroupChecked = gIds.length > 0 && gIds.every(id => checked.has(id));
              const someGroupChecked = gIds.some(id => checked.has(id));
              const toggleGroup = () => {
                if (allGroupChecked) {
                  setChecked(prev => { const next = new Set(prev); gIds.forEach(id => next.delete(id)); return next; });
                } else {
                  setChecked(prev => { const next = new Set(prev); gIds.forEach(id => next.add(id)); return next; });
                }
              };
              return (
                <div key={`h-${item.label}`} style={{ height: 56, display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, padding: `0 ${padH}px`, background: P.sand, borderBottom: `1px solid ${P.borderLight}` }}>
                  <Checkbox checked={allGroupChecked} indeterminate={!allGroupChecked && someGroupChecked} onChange={toggleGroup} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: P.text }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: P.muted }}>{item.count} files · {item.approved} approved</span>
                </div>
              );
            }
            const f = item.data;
            const isChecked = checked.has(f.id);
            const mine = (f.status === "feedback" && actor === "job_owner") || (f.status === "pending" && actor === "assigned_reviewer");
            return (
              <div key={f.id} onClick={() => setOpenFile(f.id)} style={{
                height: 56, display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, padding: `0 ${padH}px`,
                cursor: "pointer", borderBottom: `1px solid ${P.borderLight}`,
                background: isChecked ? P.blueBg : mine ? RC[actor].bg : "white",
              }}>
                <Checkbox checked={isChecked} onChange={() => toggleOne(f.id)} />
                <div style={{
                  width: 28, height: 28, borderRadius: 28, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800,
                  background: f.status === "approved" ? P.green : f.status === "pending" ? P.purpleBg : P.amberBg,
                  color: f.status === "approved" ? "white" : f.status === "pending" ? P.purple : P.amber,
                  border: f.status === "approved" ? "none" : `2px solid ${f.status === "pending" ? P.purpleBorder : P.amberBorder}`,
                }}>{f.status === "approved" ? "✓" : f.status === "pending" ? "⟳" : "!"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: f.status === "approved" ? 400 : 600, color: f.status === "approved" ? P.muted : P.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                </div>
                {!isMobile && <span style={{ fontSize: 12, fontWeight: 600, color: P.light, background: P.sand, padding: "3px 8px", borderRadius: 4, flexShrink: 0 }}>{f.discipline}</span>}
                {mine && <span style={{ width: 8, height: 8, borderRadius: 4, background: RC[actor].accent, flexShrink: 0 }} />}
                {!isMobile && <span style={{ fontSize: 16, color: P.light, flexShrink: 0 }}>›</span>}
              </div>
            );
          }}
        />
      </div>

      {/* Completion bar */}
      {allApproved && (
        <div style={{ padding: `16px ${padH}px`, borderTop: `1px solid ${P.border}`, background: P.greenBg, flexShrink: 0, textAlign: "center" }}>
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: P.green, marginRight: 12 }}>All {counts.all.toLocaleString()} files approved!</span>
          <Btn onClick={() => onComplete(files)}>Complete Review →</Btn>
        </div>
      )}

      <Slideout open={openFile !== null} onClose={() => setOpenFile(null)}>
        {openFileData && <FileDetail file={openFileData} user={user} onUpdate={update} />}
      </Slideout>
    </div>
  );
}

/* ─── Timeline Node ─── */

function Node({ step, stepNum, state, isLast, user, onDone, expComp, onToggle, view, setView, files }) {
  const personId = ACTOR_TO_PERSON[step.actor] || null;
  const loopPeople = step.loop ? [step.loop.review, step.loop.submit] : null;
  const mine = step.type === "loop"
    ? user === step.loop.submit || user === step.loop.review
    : personId === user;
  const isExp = expComp === step.id;
  const dot = state === "complete" ? P.green
    : state === "active" ? (personId ? RC[PEOPLE[personId].actor].accent : P.amber)
    : P.border;

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 36, background: state === "locked" ? P.sand : dot,
          color: state === "locked" ? P.light : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: state === "complete" ? 18 : 15, fontWeight: 800, flexShrink: 0, zIndex: 1,
          border: state === "locked" ? `2px solid ${P.border}` : "none",
          boxShadow: state === "active" ? `0 0 0 5px ${dot}20` : "none",
        }}>{state === "complete" ? "✓" : state === "active" ? (step.type === "loop" ? "⟳" : "→") : stepNum}</div>
        {!isLast && <div style={{ width: 3, flex: 1, background: state === "complete" ? P.green : P.border, borderRadius: 2 }} />}
      </div>

      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 28 }}>
        <div onClick={state === "complete" ? () => onToggle(step.id) : undefined} style={{ cursor: state === "complete" ? "pointer" : "default" }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: state === "locked" ? P.light : P.text, lineHeight: 1.3 }}>
            {step.label}
            {state === "complete" && <span style={{ fontSize: 14, color: P.light, fontWeight: 400, marginLeft: 8 }}>{isExp ? "▾" : "▸"}</span>}
          </div>
          {state !== "complete" && personId && (
            <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {loopPeople ? (
                <>
                  <Av id={loopPeople[0]} size={20} /><span style={{ fontSize: 15, fontWeight: 500, color: state === "locked" ? P.light : P.muted }}>{PEOPLE[loopPeople[0]].name}</span>
                  <span style={{ color: P.light }}>&</span>
                  <Av id={loopPeople[1]} size={20} /><span style={{ fontSize: 15, fontWeight: 500, color: state === "locked" ? P.light : P.muted }}>{PEOPLE[loopPeople[1]].name}</span>
                </>
              ) : (
                <><Av id={personId} size={20} /><span style={{ fontSize: 15, fontWeight: 500, color: state === "locked" ? P.light : P.muted }}>{PEOPLE[personId].name}</span></>
              )}
            </div>
          )}
          {state === "complete" && personId && (
            <div style={{ fontSize: 15, color: P.muted, marginTop: 4, display: "flex", alignItems: "center", gap: 7 }}>
              <Av id={step.completedData?.by || personId} size={18} />
              Completed · {step.completedData?.at || ""}
              {!isExp && <span style={{ color: P.light }}> · View</span>}
            </div>
          )}
        </div>

        {state === "complete" && isExp && <CompletedDetail step={step} />}

        {state === "active" && (
          <div style={{ marginTop: 16, padding: 24, background: "white", borderRadius: 14, border: `1.5px solid ${mine ? RC[PEOPLE[user].actor].border : P.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            {step.formType === "draft" ? (
              <DraftForm onComplete={onDone} />
            ) : step.formType === "control_numbers" ? (
              mine ? <ControlNumbersForm onComplete={onDone} /> : <WaitCard id={personId} waitingFor={step.waitingDesc} />
            ) : step.formType === "assign_reviewers" ? (
              mine ? <AssignReviewersForm onComplete={onDone} /> : <WaitCard id={personId} waitingFor={step.waitingDesc} />
            ) : step.formType === "prescreening" ? (
              mine ? <PrescreeningForm onComplete={onDone} /> : <WaitCard id={personId} waitingFor={step.waitingDesc} />
            ) : (
              <>
                <p style={{ fontSize: 16, color: P.muted, margin: "0 0 20px 0", lineHeight: 1.55 }}>{step.desc}</p>
                {step.attachedFiles && (
                  <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                    {step.attachedFiles.map((f, i) => (
                      <div key={i} style={{ padding: "10px 14px", background: P.sand, borderRadius: 8, fontSize: 15, color: P.text }}>📄 {f}</div>
                    ))}
                  </div>
                )}
                {step.type === "loop" ? (() => {
                  const ok = files ? files.filter(f => f.status === "approved").length : 0;
                  const total = files ? files.length : 0;
                  return (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, padding: "14px 18px", background: P.sand, borderRadius: 10, border: `1px solid ${P.border}` }}>
                        <div style={{ flex: 1, height: 8, background: P.border, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 4, background: P.green, width: `${total ? (ok / total) * 100 : 0}%`, transition: "width 0.4s" }} />
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: P.text }}>{ok}/{total}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <Btn onClick={() => setView("review")} color={RC[PEOPLE[user].actor].accent}>Open File Review →</Btn>
                      </div>
                    </div>
                  );
                })()
                  : mine ? (
                    <>{step.upload && <UploadStep onComplete={onDone} kind={step.actionKind} />}
                      {!step.upload && <Btn onClick={onDone} color={RC[PEOPLE[user].actor].accent}>{step.actionLabel} →</Btn>}</>
                  ) : <WaitCard id={personId} waitingFor={step.waitingDesc} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Document Panel ─── */

const DOC_TITLES = [
  "Project Details",
  "Control Numbers",
  "Submitted Documents",
  null,
  "Review Team",
  "File Review",
  null,
  "Fiscal Approval",
  "Certificates",
];

function DocSection({ step, index, fileTable }) {
  const d = step.completedData;
  const title = DOC_TITLES[index];
  if (!d || !title) return null;

  const specFields = d.fields ? d.fields.filter(f => f.label !== "Action") : null;
  const hasContent = (specFields && specFields.length > 0) || (d.files && d.files.length > 0) || d.summary || fileTable;
  if (!hasContent) return null;

  const [docFileSearch, setDocFileSearch] = useState("");
  const filteredFiles = useMemo(() => {
    if (!fileTable) return null;
    if (!docFileSearch) return fileTable;
    const q = docFileSearch.toLowerCase();
    return fileTable.filter(f => f.name.toLowerCase().includes(q));
  }, [fileTable, docFileSearch]);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section header with left accent */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: `1.5px solid ${P.border}` }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: P.blue, flexShrink: 0 }} />
        <div style={{ fontSize: 13, fontWeight: 800, color: P.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </div>
      </div>

      {/* Field label/value pairs */}
      {specFields && specFields.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, marginBottom: d.files || d.summary || fileTable ? 16 : 0 }}>
          {specFields.map((f, i) => (
            <div key={i} style={{ padding: "8px 12px", borderRadius: 6, background: i % 2 === 0 ? P.sand : "transparent" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: P.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: P.text, lineHeight: 1.45 }}>{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* File entries with card treatment */}
      {d.files && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {d.files.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: P.sand, borderRadius: 8, border: `1px solid ${P.borderLight}`,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: P.text }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {d.summary && <div style={{ fontSize: 15, color: P.text, lineHeight: 1.55, padding: "8px 12px", background: P.sand, borderRadius: 8 }}>{d.summary}</div>}

      {fileTable && (
        <div style={{ marginTop: 8 }}>
          <input type="text" value={docFileSearch} onChange={e => setDocFileSearch(e.target.value)}
            placeholder="Search files..."
            style={{ width: "100%", padding: "8px 12px", border: `1.5px solid ${P.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: P.sand, boxSizing: "border-box", marginBottom: 10, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 12, fontSize: 13, marginBottom: 10 }}>
            <span style={{ color: P.green, fontWeight: 700 }}>{fileTable.filter(f => f.status === "approved").length} approved</span>
            <span style={{ color: P.amber, fontWeight: 700 }}>{fileTable.filter(f => f.status === "feedback").length} revision</span>
            <span style={{ color: P.purple, fontWeight: 700 }}>{fileTable.filter(f => f.status === "pending").length} pending</span>
          </div>
          <div style={{ borderRadius: 8, border: `1px solid ${P.borderLight}`, overflow: "hidden" }}>
            <VirtualList
              items={filteredFiles}
              rowHeight={36}
              containerHeight={320}
              renderRow={(f, i) => (
                <div key={f.id} style={{ height: 36, display: "flex", alignItems: "center", gap: 8, padding: "0 10px", fontSize: 13, color: P.text, borderBottom: `1px solid ${P.borderLight}`, background: i % 2 === 0 ? "white" : P.bg }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                    background: f.status === "approved" ? P.green : f.status === "feedback" ? P.amber : P.purple,
                  }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: P.muted, background: P.sand, padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>R{f.rounds.length}</span>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectDocument({ cur, stepData, isMobile }) {
  return (
    <div style={{
      background: "white", borderLeft: isMobile ? "none" : `1px solid ${P.border}`,
      height: "100%", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: isMobile ? "16px 16px" : "20px 24px", borderBottom: `1.5px solid ${P.border}`, flexShrink: 0, background: P.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: P.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "white", flexShrink: 0 }}>📋</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: P.text, lineHeight: 1.2 }}>Project Specification</div>
            <div style={{ fontSize: 13, color: P.muted, marginTop: 2, fontWeight: 500 }}>CN-2025-0847</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24 }}>
        {cur === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: P.light }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, lineHeight: 1.5 }}>Project specifications will populate as details are submitted</div>
          </div>
        )}

        {STEPS.slice(0, cur).map((step, i) => (
          <DocSection key={step.id} step={step} index={i} fileTable={stepData && stepData[i] ? stepData[i].fileTable : undefined} />
        ))}

        {cur >= STEPS.length && (
          <div style={{
            background: P.greenBg, border: `1px solid ${P.greenBorder}`,
            borderRadius: 10, padding: "16px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: P.green }}>✓ Specification Complete</div>
            <div style={{ fontSize: 13, color: P.muted, marginTop: 4 }}>All project data documented</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── App ─── */

export default function Reviewy() {
  const [cur, setCur] = useState(0);
  const [role, setRole] = useState("job_owner");
  const [expComp, setExpComp] = useState(null);
  const [view, setView] = useState("timeline");
  const [files, setFiles] = useState(INIT_FILES);
  const [stepData, setStepData] = useState({});
  const [mobileTab, setMobileTab] = useState("workflow");
  const isMobile = useIsMobile();

  const user = UM[role];
  const person = PEOPLE[user];
  const rc = RC[person.actor];
  const done = cur >= STEPS.length;
  const active = STEPS[cur];
  const myTurn = active
    ? active.type === "loop" ? user === active.loop.submit || user === active.loop.review
      : ACTOR_TO_PERSON[active.actor] === user
    : false;

  // Auto-enter review mode at step 5, auto-exit when leaving
  useEffect(() => {
    setView(cur === 5 ? "review" : "timeline");
  }, [cur]);

  const advance = useCallback((data) => {
    setExpComp(null);
    if (Array.isArray(data)) setStepData(prev => ({ ...prev, [cur]: { fileTable: data } }));
    setCur(c => Math.min(c + 1, STEPS.length));
  }, [cur]);

  const st = (i) => i < cur ? "complete" : i === cur ? "active" : "locked";

  const navHeight = isMobile ? 48 : 56;
  const contentHeight = `calc(100vh - ${navHeight}px${isMobile ? " - 44px" : ""})`;

  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Nav */}
      <div style={{ background: "white", borderBottom: `1px solid ${P.border}`, padding: isMobile ? "0 16px" : "0 32px", height: navHeight, display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
        <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: P.text, letterSpacing: "-0.03em" }}>reviewy</span>
        {!isMobile && <>
          <span style={{ color: P.border, fontSize: 20, fontWeight: 300 }}>/</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: P.muted }}>New Auditorium — Lincoln High</span>
        </>}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <Av id={user} size={isMobile ? 24 : 28} />
          {!isMobile && <span style={{ fontSize: 15, fontWeight: 600, color: P.text }}>{person.name}</span>}
        </div>
      </div>

      {/* Mobile tab bar */}
      {isMobile && (
        <div style={{ display: "flex", background: "white", borderBottom: `1px solid ${P.border}`, height: 44, flexShrink: 0 }}>
          {[
            ["workflow", view === "review" ? "File Review" : "Workflow"],
            ["spec", "Specification"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setMobileTab(key)} style={{
              flex: 1, background: "none", border: "none", fontFamily: "inherit", cursor: "pointer",
              fontSize: 14, fontWeight: 700, color: mobileTab === key ? P.blue : P.muted,
              borderBottom: mobileTab === key ? `2.5px solid ${P.blue}` : "2.5px solid transparent",
              padding: 0,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Layout: two-column desktop, single panel mobile */}
      <div style={isMobile
        ? { height: contentHeight }
        : { display: "grid", gridTemplateColumns: "1fr 420px", height: contentHeight }
      }>
        {/* Left column: timeline or review dashboard */}
        {(!isMobile || mobileTab === "workflow") && (
          view === "review" ? (
            <ReviewDashboard
              files={files} setFiles={setFiles} user={user}
              onComplete={advance} onBack={() => setView("timeline")}
              isMobile={isMobile}
            />
          ) : (
            <div style={{ overflowY: "auto", height: contentHeight }}>
              <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "24px 16px 100px" : "40px 32px 120px" }}>
                <div style={{ marginBottom: isMobile ? 24 : 36 }}>
                  <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: P.text, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    New Auditorium — Lincoln High School
                  </h1>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, fontSize: isMobile ? 13 : 15, color: P.muted, flexWrap: "wrap", alignItems: "center" }}>
                    <span>Central Valley USD</span>
                    <span style={{ color: P.light }}>·</span>
                    <span>CN-2025-0847</span>
                    <span style={{ color: P.light }}>·</span>
                    <span style={{ fontWeight: 700, color: done ? P.green : P.amber }}>
                      {done ? "✓ Complete" : `Step ${cur + 1} of ${STEPS.length}`}
                    </span>
                    {!done && <>
                      <span style={{ color: P.light }}>·</span>
                      {myTurn
                        ? <span style={{ fontWeight: 700, color: rc.accent }}>● Action needed</span>
                        : <span style={{ color: P.light }}>Waiting on {PEOPLE[ACTOR_TO_PERSON[active.actor]]?.short || "others"} to {active.waitingDesc || "complete this step"}</span>}
                    </>}
                  </div>
                </div>

                {done && (
                  <div style={{ background: P.greenBg, border: `2px solid ${P.greenBorder}`, borderRadius: 14, padding: isMobile ? "20px 16px" : "28px 32px", marginBottom: 32, textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: P.green }}>Project Complete</div>
                    <div style={{ fontSize: isMobile ? 14 : 16, color: P.muted, marginTop: 8 }}>All steps finished. Certificate of occupancy submitted.</div>
                  </div>
                )}

                {STEPS.map((step, i) => (
                  <Node key={step.id} step={step} stepNum={i} state={st(i)} isLast={i === STEPS.length - 1}
                    user={user} onDone={advance} expComp={expComp}
                    onToggle={id => setExpComp(prev => prev === id ? null : id)}
                    view={view} setView={setView} files={files} />
                ))}
              </div>
            </div>
          )
        )}

        {/* Document panel */}
        {(!isMobile || mobileTab === "spec") && (
          <ProjectDocument cur={cur} stepData={stepData} isMobile={isMobile} />
        )}
      </div>

      {/* Demo switcher */}
      <div style={{
        position: "fixed", bottom: isMobile ? 56 : 12, right: 12, zIndex: 100,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        borderRadius: 20, padding: "5px 8px",
        display: "flex", alignItems: "center", gap: 3, opacity: 0.7,
      }}>
        {Object.entries(UM).map(([r, uid]) => (
          <button key={r} onClick={() => setRole(r)} style={{
            width: 24, height: 24, borderRadius: 24, padding: 0,
            cursor: "pointer", border: role === r ? "2px solid white" : "2px solid transparent",
            background: role === r ? RC[r].accent : "#555",
            color: "white", fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
          }}>{PEOPLE[uid].initials}</button>
        ))}
        <button onClick={() => { setCur(0); setExpComp(null); setView("timeline"); setFiles(generateFiles(1500)); setStepData({}); }} style={{
          background: "none", border: "none", color: "#aaa", fontSize: 12,
          cursor: "pointer", fontFamily: "inherit", padding: "2px 4px", lineHeight: 1,
        }}>↺</button>
      </div>
    </div>
  );
}
