import React, { useState } from 'react';
import { LMSMapping } from '../types';

const REMIX_TYPES = ['Coding Challenge', 'Quiz', 'Design Task', 'Essay', 'Discussion'];
const LMS_CATEGORIES = ['Homework', 'Exam', 'Lab', 'Participation', 'Project'];

export default function LMSMappingTool() {
  const [mappings, setMappings] = useState<LMSMapping[]>([
    { remixType: 'Coding Challenge', lmsCategory: 'Homework' },
    { remixType: 'Quiz', lmsCategory: 'Exam' },
  ]);

  const updateMapping = (index: number, newCategory: string) => {
    const updated = [...mappings];
    updated[index].lmsCategory = newCategory;
    setMappings(updated);
  };

  return (
    <div className="card p-6">
      <h2 className="sec-title mb-6">LMS Assignment Mapping</h2>
      <div className="space-y-4">
        {REMIX_TYPES.map((type) => {
          const mapping = mappings.find(m => m.remixType === type);
          return (
            <div key={type} className="flex items-center justify-between p-4 bg-white rounded-lg border border-var(--border)">
              <span className="font-semibold text-text">{type}</span>
              <select
                className="inp"
                value={mapping?.lmsCategory || ''}
                onChange={(e) => {
                    if (mapping) updateMapping(mappings.indexOf(mapping), e.target.value);
                    else setMappings([...mappings, { remixType: type, lmsCategory: e.target.value }]);
                }}
              >
                <option value="">Select Category</option>
                {LMS_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <button className="login-btn mt-6">Save Mappings</button>
    </div>
  );
}
