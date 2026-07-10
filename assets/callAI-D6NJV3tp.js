async function f(r,{max_tokens:i=2048,system:s,temperature:c=.3,preferredProvider:p=null,skills:a}={}){let o=s||"You are a helpful MET English teaching assistant.";if(a&&a.length>0){const e=a.filter(n=>n&&n.prompt).map(n=>`
--- ${n.name} ---
${n.prompt}`);e.length>0&&(o+=`

━━━ EDUCATION SKILL AUGMENTATIONS ━━━
${e.join(`
`)}
━━━ END AUGMENTATIONS ━━━
`)}const t=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:r,system:o,max_tokens:i,temperature:c,preferredProvider:p})});if(!t.ok){const e=await t.json().catch(()=>({}));throw new Error(e?.error?.message||`AI request failed (${t.status})`)}return t.json()}export{f as c};
