import { useState } from 'react';
import { SECTION_KEYS, REQUIRED_APPROVAL_KEYS } from '../constants.js';
import { tryParseOrString } from '../diagnosis-utils.js';

/**
 * Manages section-level state for the diagnosis review step:
 * approve/unapprove, hide, inline edit, and regeneration tracking.
 */
export function useSectionApproval(initialSections = {}) {
  const [sections, setSections] = useState(initialSections);
  const [editingSection, setEditingSection] = useState(null);
  const [editText, setEditText] = useState('');
  const [regenerating, setRegenerating] = useState(null);

  function startEdit(key) {
    const content = sections[key]?.content;
    setEditText(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    setEditingSection(key);
  }

  function saveEdit(key) {
    setSections(s => ({
      ...s,
      [key]: { ...s[key], content: tryParseOrString(editText), edited: true },
    }));
    setEditingSection(null);
  }

  function cancelEdit() {
    setEditingSection(null);
  }

  function toggleApprove(key) {
    setSections(s => ({ ...s, [key]: { ...s[key], approved: !s[key].approved } }));
  }

  function toggleHide(key) {
    setSections(s => ({ ...s, [key]: { ...s[key], hidden: !s[key].hidden } }));
  }

  function approveAll() {
    setSections(s => {
      const next = { ...s };
      Object.keys(next).forEach(k => { next[k] = { ...next[k], approved: true }; });
      return next;
    });
  }

  const approvedCount = Object.values(sections).filter(s => s.approved).length;
  const totalSections = SECTION_KEYS.length;
  const missingRequiredApprovals = REQUIRED_APPROVAL_KEYS.filter(key => {
    const section = sections[key];
    return !section?.approved || section.hidden;
  });
  const canApproveDiagnosis = missingRequiredApprovals.length === 0;

  return {
    sections,
    setSections,
    editingSection,
    setEditingSection,
    editText,
    setEditText,
    regenerating,
    setRegenerating,
    startEdit,
    saveEdit,
    cancelEdit,
    toggleApprove,
    toggleHide,
    approveAll,
    approvedCount,
    totalSections,
    missingRequiredApprovals,
    canApproveDiagnosis,
  };
}
