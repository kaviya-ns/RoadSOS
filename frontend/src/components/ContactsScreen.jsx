import { useState, useEffect } from "react";
import { fetchContacts, addContact, deleteContact } from "../api";

export default function ContactsScreen({ deviceId, onBack }) {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [adding,   setAdding]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    fetchContacts(deviceId)
      .then((d) => { setContacts(d.contacts); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  async function handleAdd() {
    setError(""); setSuccess("");
    if (!name.trim() || !phone.trim()) {
      setError("Both name and phone are required."); return;
    }
    // basic phone validation
    const cleaned = phone.replace(/\s/g, "");
    if (!/^\+?[\d]{7,15}$/.test(cleaned)) {
      setError("Enter a valid phone number (e.g. +919876543210)"); return;
    }

    setAdding(true);
    try {
      const data = await addContact(deviceId, name.trim(), cleaned);
      setContacts((prev) => [...prev, data.contact]);
      setName(""); setPhone("");
      setSuccess(`${data.contact.name} added successfully.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(contactId, contactName) {
    try {
      await deleteContact(deviceId, contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setSuccess(`${contactName} removed.`);
    } catch {
      setError("Failed to remove contact.");
    }
  }

  const canAdd = contacts.length < 3;

  return (
    <div style={styles.container}>

      {/*  header  */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h2 style={styles.headerTitle}>Emergency Contacts</h2>
        <span style={styles.headerCount}>{contacts.length}/3</span>
      </div>

      <div style={styles.scroll}>
        {/* info banner */}
        <div style={styles.infoBanner}>
          <span style={styles.infoIcon}>ℹ️</span>
          <p style={styles.infoText}>
            These contacts will receive an automatic SMS with your location
            if an accident is detected and you don't respond in time.
          </p>
        </div>

        {/* saved contacts */}
        <p style={styles.sectionLabel}>SAVED CONTACTS</p>

        {loading && <p style={styles.muted}>Loading...</p>}

        {!loading && contacts.length === 0 && (
          <div style={styles.emptyBox}>
            <span style={{ fontSize: "32px" }}>👥</span>
            <p style={styles.muted}>No contacts saved yet.</p>
          </div>
        )}

        {contacts.map((c, i) => (
          <div key={c.id} style={styles.contactCard}>
            <div style={styles.contactAvatar}>
              <span style={styles.avatarText}>{c.name[0].toUpperCase()}</span>
            </div>
            <div style={styles.contactInfo}>
              <span style={styles.contactName}>{c.name}</span>
              <span style={styles.contactPhone}>{c.phone}</span>
            </div>
            <button
              style={styles.deleteBtn}
              onClick={() => handleDelete(c.id, c.name)}
            >
              🗑
            </button>
          </div>
        ))}

        {/* add contact form*/}
        {canAdd && (
          <>
            <p style={{ ...styles.sectionLabel, marginTop: "24px" }}>
              ADD CONTACT ({3 - contacts.length} remaining)
            </p>

            <div style={styles.form}>
              <input
                style={styles.input}
                placeholder="Contact name (e.g. Amma)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Phone with country code (e.g. +919876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
              />

              {error   && <p style={styles.errorText}>⚠️ {error}</p>}
              {success && <p style={styles.successText}>✓ {success}</p>}

              <button
                style={{ ...styles.addBtn, opacity: adding ? 0.6 : 1 }}
                onClick={handleAdd}
                disabled={adding}
              >
                {adding ? "Saving..." : "+ Add Contact"}
              </button>
            </div>
          </>
        )}

        {!canAdd && (
          <p style={{ ...styles.muted, marginTop: "16px", textAlign: "center" }}>
            Maximum 3 contacts reached. Delete one to add another.
          </p>
        )}

        {/* twilio note  */}
        <div style={styles.twilioNote}>
          <span style={styles.twilioIcon}>📱</span>
          <p style={styles.twilioText}>
            SMS alerts are sent via Twilio. Make sure phone numbers
            include the country code (e.g. +91 for India).
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container:    { height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" },
  header:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 },
  backBtn:      { background: "none", border: "none", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-body)" },
  headerTitle:  { fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text)" },
  headerCount:  { fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 },
  scroll:       { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" },
  infoBanner:   { display: "flex", gap: "10px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "var(--radius-sm)", padding: "12px 14px" },
  infoIcon:     { fontSize: "16px", flexShrink: 0 },
  infoText:     { fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 },
  sectionLabel: { fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", color: "var(--text-muted)" },
  muted:        { fontSize: "13px", color: "var(--text-muted)" },
  emptyBox:     { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "32px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" },
  contactCard:  { display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" },
  contactAvatar:{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText:   { fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--accent-red)" },
  contactInfo:  { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  contactName:  { fontSize: "14px", fontWeight: 600, color: "var(--text)" },
  contactPhone: { fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" },
  deleteBtn:    { background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: "4px" },
  form:         { display: "flex", flexDirection: "column", gap: "10px" },
  input:        { padding: "13px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "14px", fontFamily: "var(--font-body)", outline: "none" },
  errorText:    { fontSize: "12px", color: "#fca5a5" },
  successText:  { fontSize: "12px", color: "#86efac" },
  addBtn:       { padding: "14px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--accent-red)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" },
  twilioNote:   { display: "flex", gap: "10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginTop: "8px" },
  twilioIcon:   { fontSize: "16px", flexShrink: 0 },
  twilioText:   { fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 },
};
