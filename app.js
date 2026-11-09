/* Ladder × Edge Medicine — interactive prototype. Synthetic data only; nothing leaves the browser. */
(() => {
'use strict';

/* ================= DATA ================= */
const BASE = 'https://exchange.example/fhir/r5';
const HUB = 'https://hub.example';
const RXN = 'http://www.nlm.nih.gov/research/umls/rxnorm';
const LNC = 'http://loinc.org';

const REFS = [
  ['Xie W, Su F, Wang G, et al. Glucose-lowering effect of berberine on type 2 diabetes: a systematic review and meta-analysis. Front Pharmacol. 2022;13:1015045.', '10.3389/fphar.2022.1015045'],
  ['Liang Y, Xu X, Yin M, et al. Effects of berberine on blood glucose in patients with type 2 diabetes mellitus: a systematic literature review and a meta-analysis. Endocr J. 2019;66(1):51-63.', '10.1507/endocrj.EJ18-0109'],
  ['Gordon RY, Cooperman T, Obermeyer W, Becker DJ. Marked variability of monacolin levels in commercial red yeast rice products: buyer beware! Arch Intern Med. 2010;170(19):1722-1727.', '10.1001/archinternmed.2010.382'],
  ['Gardiner P, et al. Medical reconciliation of dietary supplements: don\'t ask, don\'t tell. Patient Educ Couns. 2015;98(4):512-517.', '10.1016/j.pec.2014.12.010'],
  ['Geller AI, Shehab N, Weidle NJ, et al. Emergency department visits for adverse events related to dietary supplements. N Engl J Med. 2015;373:1531-1540.', '10.1056/NEJMsa1504267'],
  ['U.S. Food and Drug Administration. Dietary supplements (FDA does not approve dietary supplements for safety and effectiveness before they are sold).', null, 'https://www.fda.gov/food/dietary-supplements'],
  ['JupyterHealth Docs. Collect patient data (studies, per-data-type consent, patient portal import via SMART on FHIR, FHIR API).', null, 'https://docs.jupyterhealth.org/collect/'],
  ['JupyterHealth Demos. Blood pressure and CGM dashboards in Voilà, with SMART app launch.', null, 'https://docs.jupyterhealth.org/demos/'],
  ['Edge Medicine. How Edge Medicine works: a case across the continuum (Alex).', null, 'https://edgemedicine.org/build'],
  ['HL7 FHIR Release 5 (Consent, MedicationStatement, Observation, Communication).', null, 'https://hl7.org/fhir/R5/'],
  ['HL7 SMART App Launch.', null, 'https://hl7.org/fhir/smart-app-launch/'],
];
const cite = n => `<a href="#ref-${n}" title="${esc(REFS[n-1][0])}">[${n}]</a>`;

const PATIENTS = {
  alex: {
    id: 'alex-k', first: 'Alex', name: 'Alex K.', init: 'AK', age: 37, sex: 'M', mrn: 'SYN-000042', next: 'Nov 19', nextIso: '2026-11-19',
    problems: [['Type 2 diabetes mellitus', 'dx 2025'], ['Essential hypertension, stage 1', 'dx 2024'], ['Overweight', '']],
    meds: [
      { name: 'Metformin 500 mg tablet', sig: '1 tab twice daily', rx: '861007', disp: 'metformin hydrochloride 500 MG Oral Tablet' },
      { name: 'Lisinopril 10 mg tablet', sig: '1 tab daily', rx: '314076', disp: 'lisinopril 10 MG Oral Tablet' },
    ],
    labs: [
      { name: 'Hemoglobin A1c', loinc: '4548-4', vals: [['Feb 11', '7.6 %', 7.6, '2026-02-11'], ['Aug 20', '7.1 %', 7.1, '2026-08-20']], unit: '%', key: true },
      { name: 'eGFR (CKD-EPI 2021)', loinc: '98979-8', vals: [['Aug 20', '94 mL/min/1.73m²', 94, '2026-08-20']], unit: 'mL/min/{1.73_m2}' },
      { name: 'LDL cholesterol', loinc: '2089-1', vals: [['Aug 20', '128 mg/dL', 128, '2026-08-20']], unit: 'mg/dL' },
      { name: 'Blood pressure', loinc: '85354-9', vals: [['Aug 20', '136/86 mmHg', null, '2026-08-20']] },
    ],
    note: 'Aug 20: A1c improving on metformin. Discussed diet and activity. Recheck A1c in 3 months.',
  },
  maria: {
    id: 'maria-r', first: 'Maria', name: 'Maria R.', init: 'MR', age: 52, sex: 'F', mrn: 'SYN-000057', next: 'Dec 3', nextIso: '2026-12-03',
    problems: [['Hyperlipidemia', 'dx 2025'], ['Essential hypertension', 'dx 2023']],
    meds: [
      { name: 'Atorvastatin 20 mg tablet', sig: '1 tab daily', rx: '617310', disp: 'atorvastatin 20 MG Oral Tablet' },
      { name: 'Lisinopril 10 mg tablet', sig: '1 tab daily', rx: '314076', disp: 'lisinopril 10 MG Oral Tablet' },
    ],
    labs: [
      { name: 'LDL cholesterol', loinc: '2089-1', vals: [['Jan 14, 2025', '162 mg/dL', 162, '2025-01-14'], ['Jul 22', '96 mg/dL', 96, '2026-07-22']], unit: 'mg/dL', key: true },
      { name: 'Hemoglobin A1c', loinc: '4548-4', vals: [['Jul 22', '5.8 %', 5.8, '2026-07-22']], unit: '%' },
      { name: 'eGFR (CKD-EPI 2021)', loinc: '98979-8', vals: [['Jul 22', '88 mL/min/1.73m²', 88, '2026-07-22']], unit: 'mL/min/{1.73_m2}' },
      { name: 'Blood pressure', loinc: '85354-9', vals: [['Jul 22', '128/80 mmHg', null, '2026-07-22']] },
    ],
    note: 'Jul 22: LDL at goal on atorvastatin 20 mg. Continue. Recheck lipids in 6 months.',
  },
};

const REVIEWED_TIP = 'In the pilot, a licensed pharmacist or physician signs off on every review. In this prototype, reviews are written by our team from the cited papers.';

const SCEN = {
  berberine: {
    pt: 'alex', vclass: '', creator: '@sugarfree.sam', likes: '182K',
    cap: 'BERBERINE = NATURE’S OZEMPIC', img: 'assets/berberis-vulgaris.jpg', imgAlt: 'Barberry shrub with red berries, a source of berberine', sub: 'I stopped metformin and my sugar is fine.', tags: '#berberine #diabetes #naturalozempic',
    claims: [
      { q: 'Berberine is nature’s Ozempic.', tier: 'reviewed', v: ['amber', 'Stretched'],
        short: 'It lowers blood sugar a little in trials. The trials didn’t compare it with Ozempic.',
        found: [`In 37 randomized trials of people with type 2 diabetes (3,048 people), berberine lowered HbA1c by about 0.6 percentage points more than control groups. ${cite(1)}`,
                `A review of 28 trials found the effect was no longer clear in studies that lasted more than 90 days. ${cite(2)}`],
        gaps: [['Too sure', '“Nature’s Ozempic” suggests the same results. These trials compared berberine with placebo or other diabetes treatments, not with Ozempic.'],
               ['Measured something different', 'These reviews measured blood sugar. Many people mean Ozempic’s weight loss, which they did not look at.']] },
      { q: 'So you can stop metformin.', tier: 'reviewed', v: ['red', 'Not supported'],
        short: 'In trials it worked best alongside diabetes medicine, not instead of it.',
        found: [`In a review of 28 trials, berberine combined with diabetes medicines lowered blood sugar more than either one alone. ${cite(2)}`,
                'These reviews do not show that berberine can replace metformin.'],
        gaps: [['Too sure', 'One person’s “my sugar is fine” doesn’t show it is safe for anyone else to stop.'],
               ['Risks left out', 'Stopping a diabetes medicine without a plan can let blood sugar rise without obvious symptoms.']] },
    ],
    intents: [
      { k: 'start-berberine', label: 'Start berberine', sub: 'Supplement', phrase: 'starting berberine', clin: 'Starting berberine', items: [{ act: 'start', name: 'Berberine (dietary supplement)' }] },
      { k: 'stop-metformin', label: 'Stop metformin', sub: 'Prescription', rx: true, phrase: 'stopping metformin', clin: 'Stopping metformin', items: [{ act: 'stop', name: 'metformin hydrochloride 500 MG Oral Tablet', rx: '861007' }] },
      { k: 'less-metformin', label: 'Take less metformin', sub: 'Prescription', rx: true, phrase: 'taking less metformin', clin: 'Taking less metformin', items: [{ act: 'reduce', name: 'metformin hydrochloride 500 MG Oral Tablet', rx: '861007' }] },
    ],
    tourIntents: ['start-berberine', 'stop-metformin'],
    trigger: 'short video, “Berberine is nature’s Ozempic… I stopped metformin”',
    evTier: ['teal', 'Reviewed (demo)'],
    ev: [`Meta-analysis of 37 RCTs in T2D (n=3,048): HbA1c −0.63% (95% CI −0.72 to −0.53) vs control; no significant increase in hypoglycemia ${cite(1)}.`,
         `Effect not significant in trials &gt;90 days; berberine + hypoglycemics better than either alone ${cite(2)}.`,
         'No head-to-head data vs GLP-1 RAs in these reviews.',
         'Patient was shown: the evidence, gap labels, and “don’t stop or change prescriptions on your own.”'],
    evShort: [`HbA1c −0.63% vs control across 37 trials; no rise in hypoglycemia ${cite(1)}`, `No clear effect past 90 days; worked best with diabetes drugs, not instead of them ${cite(2)}`],
    evDoc: 'ladder-evidence-berberine-v0',
    reply: 'Thanks for telling us, Alex. Please keep taking metformin for now. In studies, berberine worked best alongside diabetes medicine, not instead of it. Can we call Thursday to talk it through?',
  },
  seamoss: {
    pt: 'alex', vclass: 'sea', creator: '@ocean.remedy', likes: '96K',
    cap: 'SEA MOSS REVERSES KIDNEY DAMAGE', img: 'assets/chondrus-crispus.jpg', imgAlt: 'Irish moss seaweed on a shore', sub: 'My doctor was shocked by my labs.', tags: '#seamoss #kidneyhealth #natural',
    claims: [
      { q: 'Sea moss reverses kidney damage.', tier: 'none', v: ['gray', 'Not yet reviewed'],
        short: 'We haven’t reviewed this claim yet, so Ladder won’t give a verdict.', unreviewed: true },
    ],
    intents: [
      { k: 'start-seamoss', label: 'Start sea moss', sub: 'Supplement', phrase: 'taking sea moss for my kidneys', clin: 'Starting sea moss (for kidneys)', items: [{ act: 'start', name: 'Sea moss (dietary supplement)' }] },
    ],
    tourIntents: ['start-seamoss'],
    trigger: 'short video, “Sea moss reverses kidney damage”',
    evTier: ['gray', 'Not yet reviewed'],
    ev: ['Not yet reviewed by Ladder’s reviewers.', 'Patient was shown <b>no verdict</b>, and a prompt to ask the care team.'],
    evShort: ['Not yet reviewed. Ladder showed Alex no verdict.'],
    evDoc: null,
    reply: 'Thanks for asking us first, Alex. Let’s look at your kidney labs together at your Nov 19 visit before you start anything new.',
  },
  ryr: {
    pt: 'maria', vclass: 'ryr', creator: '@cleanheart.coach', likes: '240K',
    cap: 'RED YEAST RICE = NATURAL STATIN', img: 'assets/red-yeast-rice.jpg', imgAlt: 'Grains of red yeast rice', sub: 'Zero side effects. Ditch the pharma pills.', tags: '#redyeastrice #cholesterol #natural',
    claims: [
      { q: 'Red yeast rice is a natural statin.', tier: 'reviewed', v: ['amber', 'Stretched'],
        short: 'It contains the same compound as a statin, but the amount varies widely.',
        found: [`Red yeast rice contains monacolin K, the same compound as the prescription statin lovastatin. ${cite(3)}`,
                `In 12 products all labeled 600 mg per capsule, monacolin K ranged from 0.10 to 10.09 mg per capsule. ${cite(3)}`],
        gaps: [['Different dose or product', '“A natural statin” suggests a known dose. One capsule may contain almost none; another, close to a low-dose prescription pill.']] },
      { q: 'Zero side effects.', tier: 'reviewed', v: ['red', 'Not supported'],
        short: 'Some products contained a kidney toxin, and its active compound is a statin.',
        found: [`4 of the 12 products contained elevated levels of citrinin, a toxin that harms the kidneys in animals. ${cite(3)}`],
        gaps: [['Risks left out', 'Because its active compound is the same as lovastatin, “zero side effects” is not something these products can promise.']] },
    ],
    intents: [
      { k: 'switch-ryr', label: 'Switch from atorvastatin to red yeast rice', sub: 'Prescription', rx: true, phrase: 'switching from atorvastatin to red yeast rice', clin: 'Switching atorvastatin → red yeast rice',
        items: [{ act: 'stop', name: 'atorvastatin 20 MG Oral Tablet', rx: '617310' }, { act: 'start', name: 'Red yeast rice (dietary supplement)' }] },
      { k: 'add-ryr', label: 'Add red yeast rice to my statin', sub: 'Supplement', rx: true, phrase: 'adding red yeast rice to my statin', clin: 'Adding red yeast rice to atorvastatin', items: [{ act: 'start', name: 'Red yeast rice (dietary supplement)' }] },
    ],
    tourIntents: ['switch-ryr'],
    trigger: 'short video, “Red yeast rice = natural statin. Zero side effects.”',
    evTier: ['teal', 'Reviewed (demo)'],
    ev: [`12 commercial RYR products labeled 600 mg: monacolin K 0.10–10.09 mg/capsule; elevated citrinin in 4/12 ${cite(3)}.`,
         'Monacolin K is identical to lovastatin.',
         'Patient was shown: the evidence, gap labels, and “don’t stop or change prescriptions on your own.”'],
    evShort: [`Monacolin K (the same compound as lovastatin) ranged 0.10–10.09 mg per capsule across 12 products ${cite(3)}`, `4 of the 12 contained citrinin, a kidney toxin in animals ${cite(3)}`],
    evDoc: 'ladder-evidence-red-yeast-rice-v0',
    reply: 'Thanks for telling us, Maria. Please keep taking atorvastatin for now. Red yeast rice products vary a lot in strength, and we’d like to talk it through. Can we call this week?',
  },
};

const OTHERS = [
  { id: 'maria-r', name: 'Maria R., 52', what: 'Considering switching atorvastatin → red yeast rice', rx: true, st: ['new', 'New'], when: 'Nov 7' },
  { id: 'dev-p', name: 'Dev P., 44', what: 'Started beet juice; thinking of skipping lisinopril on weekends', rx: true, st: ['new', 'New'], when: 'Nov 6' },
  { id: 'sam-t', name: 'Sam T., 29', what: 'Started cinnamon capsules', rx: false, st: ['done', 'Replied'], when: 'Nov 2' },
];

const T = {
  pre: { label: 'Sun Nov 8, 3:10 PM' },
  sent: { label: 'Sun Nov 8, 3:12 PM', iso: '2026-11-08T15:12:00-08:00' },
  seen: { label: 'Mon Nov 9, 8:40 AM', iso: '2026-11-09T08:40:00-08:00', rel: '1 day later' },
  reply: { label: 'Wed Nov 11, 9:05 AM', iso: '2026-11-11T09:05:00-08:00', rel: '3 days after the decision' },
};

const RESP = {
  visit: pt => `Thanks for telling us. Dr. Lee saw this and will talk it through with you at your ${pt.next} visit.`,
  call: () => 'Thanks for telling us. We’d like to call you this week to talk it through. Reply with a good time.',
  noaction: () => 'Your care team has seen this.',
};

/* ================= STATE ================= */
let S, INSTANT = false, TI = -1, timers = [];
const fresh = scn => ({
  scn, p: 'video', sheet: false, claim: 0, ana: 0, intents: [], note: '', noteEdited: false, ev: true,
  joined: false, cDec: false, cPortal: false, portalAuth: false, portalOv: false,
  shared: false, withdrawn: false,
  seen: false, c: 'chart', etab: 'summary', vtab: 'patient', compose: false, composeText: '', resp: null, replied: false, replyText: '', rating: null, notif: false, ack: false,
  opt: 'A', log: [], sel: -1, clock: 'pre',
  focus: 'patient', dataOpen: false, replyUnseen: false,
});
const sc = () => SCEN[S.scn];
const pt = () => PATIENTS[sc().pt];
const pref = () => `Patient/${pt().id}`;

function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function later(fn, ms) { if (INSTANT) { fn(); return; } timers.push(setTimeout(fn, ms)); }

/* ================= HELPERS ================= */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const $ = s => document.querySelector(s);
const ladSvg = '<svg viewBox="0 0 32 32"><use href="#lad"/></svg>';
function joinPhr(a) { return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
function chosen() { return sc().intents.filter(i => S.intents.includes(i.k)); }
function defaultNote() {
  const ch = chosen();
  return ch.length ? `I’m considering ${joinPhr(ch.map(i => i.phrase))}. I’d like to talk about it.` : '';
}
function hlJSON(o) {
  const s = esc(JSON.stringify(o, null, 2));
  return s.replace(/(&quot;(?:\\.|[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?\b)/g, (m, str, colon, bool, num) => {
    if (str) return colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`;
    if (bool) return `<span class="b">${bool}</span>`;
    return `<span class="n">${num}</span>`;
  });
}
function concept(it) {
  return it.rx ? { coding: [{ system: RXN, code: it.rx, display: it.name }], text: it.name } : { text: it.name };
}
const ACT_TXT = { start: 'Considering starting', stop: 'Considering stopping', reduce: 'Considering taking less' };
function isMobile() { return window.matchMedia('(max-width:1099px)').matches; }

/* ================= FHIR BUILDERS ================= */
function decisionResources() {
  const items = chosen().flatMap(i => i.items);
  if (S.opt === 'A') {
    return items.map((it, n) => ({
      resourceType: 'MedicationStatement', id: `ms-${n + 1}`, status: 'recorded',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/medication-statement-category', code: 'patientspecified', display: 'Patient Specified' }] }],
      medication: { concept: concept(it) },
      subject: { reference: pref() },
      dateAsserted: T.sent.iso,
      informationSource: [{ reference: pref() }],
      adherence: { code: { text: `${ACT_TXT[it.act]} (patient-reported)` } },
      note: [{ text: S.note }],
    }));
  }
  return [{
    resourceType: 'Observation', id: 'obs-1', status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }] }],
    code: { text: 'Patient-reported treatment change under consideration' },
    subject: { reference: pref() }, effectiveDateTime: T.sent.iso, performer: [{ reference: pref() }],
    component: items.map(it => ({ code: { text: ACT_TXT[it.act] }, valueCodeableConcept: concept(it) })),
    note: [{ text: S.note }],
  }];
}
function commShare(decs) {
  const payload = [{ contentCodeableConcept: { text: S.note } }];
  if (S.ev && sc().evDoc) payload.push({ contentReference: { reference: `DocumentReference/${sc().evDoc}`, display: 'Ladder evidence summary (prototype)' } });
  return {
    resourceType: 'Communication', id: 'comm-1', status: 'completed',
    category: [{ text: 'Ladder · patient-shared decision' }],
    subject: { reference: pref() },
    about: decs.map(d => ({ reference: `${d.resourceType}/${d.id}` })),
    sent: T.sent.iso, sender: { reference: pref() },
    recipient: [{ reference: 'CareTeam/bayside-dr-lee' }],
    payload,
  };
}
function consentRes() {
  const prov = [{
    resourceType: [{ system: 'http://hl7.org/fhir/fhir-types', code: S.opt === 'A' ? 'MedicationStatement' : 'Observation' }, { system: 'http://hl7.org/fhir/fhir-types', code: 'Communication' }],
    action: [{ text: 'Share decisions I choose to send with my care team' }],
    actor: [{ role: { text: 'Care team' }, reference: { reference: 'CareTeam/bayside-dr-lee' } }],
  }];
  if (S.cPortal) prov.push({
    resourceType: ['MedicationRequest', 'Condition', 'Observation'].map(c => ({ system: 'http://hl7.org/fhir/fhir-types', code: c })),
    action: [{ text: 'Import medications, conditions and lab results from my patient portal' }],
    actor: [{ role: { text: 'Care team' }, reference: { reference: 'CareTeam/bayside-dr-lee' } }],
  });
  return {
    resourceType: 'Consent', id: 'consent-1', status: 'active',
    category: [{ text: 'Ladder study · Bayside Primary Care (fictional)' }],
    subject: { reference: pref() }, date: '2026-11-08',
    grantee: [{ reference: 'Organization/bayside-primary-care' }],
    controller: [{ reference: 'Organization/bayside-primary-care' }],
    decision: 'deny',
    provision: prov,
  };
}
function importBundle() {
  const P = pt(), entry = [];
  P.problems.forEach((p, i) => entry.push({ resource: { resourceType: 'Condition', id: `cond-${i + 1}`, clinicalStatus: { text: 'active' }, code: { text: p[0] }, subject: { reference: pref() } } }));
  P.meds.forEach((m, i) => entry.push({ resource: { resourceType: 'MedicationRequest', id: `mr-${i + 1}`, status: 'active', intent: 'order', medication: { concept: { coding: [{ system: RXN, code: m.rx, display: m.disp }] } }, subject: { reference: pref() }, dosageInstruction: [{ text: m.sig }] } }));
  P.labs.forEach(l => l.vals.forEach((v, j) => {
    const r = { resourceType: 'Observation', id: `lab-${l.loinc}-${j + 1}`, status: 'final', code: { coding: [{ system: LNC, code: l.loinc, display: l.name }] }, subject: { reference: pref() }, effectiveDateTime: v[3] };
    if (v[2] != null) r.valueQuantity = { value: v[2], unit: l.unit, system: 'http://unitsofmeasure.org' };
    else { r.component = [{ code: { coding: [{ system: LNC, code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: { value: +v[1].split('/')[0], unit: 'mm[Hg]' } }, { code: { coding: [{ system: LNC, code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: parseInt(v[1].split('/')[1]), unit: 'mm[Hg]' } }]; }
    entry.push({ resource: r });
  }));
  return { resourceType: 'Bundle', type: 'collection', total: entry.length, entry };
}

/* ================= HOOD LOG ================= */
const LOG = {
  nothing: () => ({ stage: 'Capture', comp: 'None', title: 'Nothing written', none: true,
    cap: `${pt().first} tapped <b>Not now</b>. The check stays on the phone. Nothing is sent to the Exchange or the clinic.` }),
  curious: () => ({ stage: 'Capture', comp: 'None', title: 'Nothing to share', none: true,
    cap: `${pt().first} chose <b>Just curious</b>. Ladder doesn't ask to share, so the clinician isn't sent a card. This keeps the number of cards low.` }),
  consent: () => ({ stage: 'Share', comp: 'Exchange · study consent', title: 'Joined the clinic’s study',
    call: `<span class="verb">POST</span> ${BASE}/Consent`,
    cap: 'The Exchange records consent per study and per data type in its own API. Shown here as an R5 <b>Consent</b>: deny by default, with one exception for each data type the patient turned on. The Exchange won’t accept a data type until the patient agrees.',
    json: consentRes }),
  import: () => ({ stage: 'Share', comp: 'Exchange · SMART on FHIR patient access', title: 'Imported records from the patient portal',
    call: `Patient portal ──(SMART on FHIR patient access)──▶ Exchange`,
    cap: 'After the patient tapped <b>Allow</b>, the Exchange copied conditions, medications and lab results from the patient portal. Codes are real (RxNorm, LOINC); values are synthetic.',
    json: importBundle }),
  share: () => ({ stage: 'Share', comp: 'Exchange · FHIR API', title: 'Decision written to the Exchange', warn: 'Open design question',
    call: () => `<span class="verb">POST</span> ${BASE}  <span style="color:#8B97B3">(transaction)</span>`,
    cap: () => S.opt === 'A'
      ? '<b>Option A</b>: one patient-specified <b>MedicationStatement</b> per product, plus a <b>Communication</b> to the care team. R5 has no standard adherence code for “considering,” so it is carried as text. Toggle B to compare.'
      : '<b>Option B</b>: one patient-reported <b>Observation</b> (category survey) with a component per product, plus a <b>Communication</b> to the care team. Easier to store today; less visible to medication reconciliation.',
    json: () => { const d = decisionResources(); return { resourceType: 'Bundle', type: 'transaction', entry: [...d, commShare(d)].map(r => ({ fullUrl: `urn:uuid:${r.id}`, resource: r, request: { method: 'POST', url: r.resourceType } })) }; } }),
  withdraw: () => ({ stage: 'Share', comp: 'Exchange · FHIR API', title: 'Patient withdrew the share',
    call: `<span class="verb">PATCH</span> ${BASE}/Communication/comm-1`,
    cap: 'The card on the clinician side is greyed out. How withdrawal is represented (status, or revoking the consent exception) is part of the same design question.',
    json: () => [{ op: 'replace', path: '/status', value: 'stopped' }] }),
  launch: () => ({ stage: 'Interpret', comp: 'SMART on FHIR launch · Voilà on JupyterHub', title: 'Dr. Lee opened Ladder signals',
    call: `<span class="verb">GET</span> ${HUB}/voila/render/ladder_signals.ipynb?launch=…&amp;iss=https://ehr.bayside.example/fhir`,
    cap: 'The EHR launches the Voilà dashboard in the patient’s context, as the JupyterHealth BP and CGM demos do. Below: the SMART token response the dashboard receives.',
    json: () => ({ access_token: '…', token_type: 'Bearer', expires_in: 3600, scope: 'launch openid fhirUser patient/Communication.cru patient/MedicationStatement.rs patient/MedicationRequest.rs patient/Observation.rs', patient: pt().id, fhirUser: 'Practitioner/dr-lee', need_patient_banner: false }) }),
  read: () => ({ stage: 'Interpret', comp: 'Exchange · FHIR API', title: 'Card data read from the Exchange',
    call: () => [
      `<span class="verb">GET</span> ${BASE}/Communication?subject=${pref()}&amp;status=completed`,
      S.shared ? (S.opt === 'A' ? `<span class="verb">GET</span> ${BASE}/MedicationStatement?subject=${pref()}&amp;category=patientspecified` : `<span class="verb">GET</span> ${BASE}/Observation?subject=${pref()}&amp;category=survey`) : null,
      S.cPortal ? `<span class="verb">GET</span> ${BASE}/MedicationRequest?subject=${pref()}&amp;status=active` : null,
      S.cPortal ? `<span class="verb">GET</span> ${BASE}/Observation?subject=${pref()}&amp;code=${LNC}|${pt().labs[0].loinc},${LNC}|98979-8&amp;_sort=-date` : null,
    ].filter(Boolean).join('\n'),
    cap: () => S.cPortal ? 'Everything on the card comes from data the patient consented to share. No AI recommendation is generated.' : '<b>The patient did not share portal records</b>, so the card shows no medications or labs from the Exchange. Consent scope is enforced.',
    json: () => ({ resourceType: 'Bundle', type: 'searchset', total: (S.shared ? 1 + decisionResources().length : 0) + (S.cPortal ? pt().meds.length + pt().labs[0].vals.length + 1 : 0),
      entry: [...(S.shared ? ['Communication/comm-1', ...decisionResources().map(d => `${d.resourceType}/${d.id}`)] : []), ...(S.cPortal ? [...pt().meds.map((m, i) => `MedicationRequest/mr-${i + 1}`), ...pt().labs[0].vals.map((v, j) => `Observation/lab-${pt().labs[0].loinc}-${j + 1}`), 'Observation/lab-98979-8-1'] : [])].map(u => ({ fullUrl: `${BASE}/${u}`, search: { mode: 'match' } })) }) }),
  reply: () => ({ stage: 'Act → Close the loop', comp: 'Exchange · FHIR API', title: 'Clinician reply sent to the patient',
    call: `<span class="verb">POST</span> ${BASE}/Communication`,
    cap: `The reply goes back through the Exchange to ${pt().first}’s phone: <b>${T.reply.rel}</b>, instead of at the next visit.`,
    json: () => ({ resourceType: 'Communication', id: 'comm-2', status: 'completed', inResponseTo: [{ reference: 'Communication/comm-1' }], subject: { reference: pref() }, sent: T.reply.iso, sender: { reference: 'Practitioner/dr-lee' }, recipient: [{ reference: pref() }], payload: [{ contentCodeableConcept: { text: S.replyText } }] }) }),
  rating: () => ({ stage: 'Act', comp: 'Pilot evaluation log (not FHIR)', title: 'Card usefulness recorded',
    call: '<span class="verb">POST</span> https://ladder.example/eval',
    cap: 'A secondary outcome of the pilot: was the card useful? Stored in the study’s evaluation table, not in the clinical record.',
    json: () => ({ event: 'card_rating', card: 'Communication/comm-1', clinician: 'Practitioner/dr-lee', useful: S.rating === 'up', at: T.seen.iso }) }),
};
function log(key) { S.log.push(key); S.sel = S.log.length - 1; }

const PLAIN = {
  nothing: () => `Nothing was sent. The check stayed on ${pt().first}’s phone, and the clinic sees nothing.`,
  curious: () => `${pt().first} was only curious, so Ladder did not offer to send anything to the clinic.`,
  consent: () => `${pt().first} joined Bayside’s study on the Exchange and chose, one data type at a time, what to share.`,
  import: () => `The Exchange copied ${pt().first}’s medicines, conditions and lab results from the patient portal, with permission.`,
  share: () => `${pt().first}’s decision was written to the Exchange as FHIR data, addressed to Dr. Lee’s care team.`,
  withdraw: () => `${pt().first} withdrew the share. Dr. Lee’s card is now marked as withdrawn.`,
  launch: () => 'Dr. Lee opened the Ladder card inside the EHR through a SMART on FHIR launch.',
  read: () => `The card read only what ${pt().first} agreed to share. No AI recommendation was generated.`,
  reply: () => `Dr. Lee’s reply went back through the Exchange to ${pt().first}’s phone, ${T.reply.rel}.`,
  rating: () => 'Dr. Lee rated the card. That rating is a pilot measure, kept outside the medical record.',
};

/* ================= ACTIONS ================= */
let MODE = 'guided'; // 'guided' | 'free'
function act(a, d = {}) {
  switch (a) {
    case 'share': S.sheet = true; break;
    case 'sheet-close': S.sheet = false; break;
    case 'ladder': S.sheet = false; S.p = 'analyzing'; S.ana = 0;
      [1, 2, 3].forEach(n => later(() => { S.ana = n; render(); }, n * 480));
      later(() => { S.p = 'claims'; render(); }, 1700); break;
    case 'claim': S.claim = +d.i; S.p = 'detail'; break;
    case 'back-claims': S.p = 'claims'; break;
    case 'to-intent': S.p = 'intent'; break;
    case 'toggle-intent': {
      const k = d.k;
      if (k === 'curious') S.intents = S.intents.includes('curious') ? [] : ['curious'];
      else { S.intents = S.intents.filter(x => x !== 'curious'); S.intents = S.intents.includes(k) ? S.intents.filter(x => x !== k) : [...S.intents, k]; }
      break; }
    case 'intent-continue':
      if (!S.intents.length) return;
      if (S.intents.includes('curious')) { S.p = 'curious'; log('curious'); }
      else { S.p = 'ask'; if (!S.noteEdited) S.note = defaultNote(); }
      break;
    case 'back-intent': S.p = 'intent'; break;
    case 'toggle-ev': S.ev = !S.ev; break;
    case 'send': if (S.joined) doShare(); else S.p = 'consent'; break;
    case 'notnow': S.p = 'notnow'; log('nothing'); break;
    case 'reshare': S.p = 'ask'; break;
    case 'c-dec': S.cDec = !S.cDec; break;
    case 'c-portal':
      if (S.cPortal) S.cPortal = false;
      else if (S.portalAuth) S.cPortal = true;
      else S.portalOv = true;
      break;
    case 'portal-allow': S.portalAuth = true; S.cPortal = true; S.portalOv = false; break;
    case 'portal-deny': S.portalOv = false; break;
    case 'consent-agree':
      if (!S.cDec) return;
      S.joined = true; log('consent'); if (S.cPortal) log('import'); doShare(); return;
    case 'withdraw': S.withdrawn = true; log('withdraw'); toast('Withdrawn. Dr. Lee’s card is now marked as withdrawn.'); break;
    case 'got-it': S.ack = true; break;
    case 'open-ladder':
      if (S.c === 'card' || S.c === 'launching') { S.c = 'card'; break; }
      S.c = 'launching'; S.vtab = 'patient';
      later(() => {
        S.c = 'card'; log('launch'); log('read');
        if (S.shared && !S.withdrawn && !S.seen) { S.seen = true; S.clock = 'seen'; }
        render();
      }, 900);
      break;
    case 'close-ladder': S.c = 'chart'; S.compose = false; break;
    case 'etab': S.etab = d.t; S.c = 'chart'; break;
    case 'vtab': S.vtab = d.t; break;
    case 'message': S.compose = true; if (!S.composeText) S.composeText = sc().reply; break;
    case 'compose-cancel': S.compose = false; break;
    case 'reply-send': sendReply('message', S.composeText || sc().reply); return;
    case 'resp': sendReply(d.t, RESP[d.t](pt())); return;
    case 'rate': S.rating = d.v; log('rating'); break;
    case 'opt': S.opt = d.v; break;
    case 'hsel': S.sel = +d.i; break;
    case 'data-toggle': S.dataOpen = !S.dataOpen; break;
    case 'copy': {
      const e = LOG[S.log[S.sel]]?.(); const j = e && e.json ? JSON.stringify(e.json(), null, 2) : '';
      navigator.clipboard?.writeText(j).then(() => toast('JSON copied')).catch(() => {}); return; }
    case 'focus': setFocus(d.f); break;
    case 'toast-go': hideToast(); setFocus('clinician'); render(); scrollToStage(); return;
    /* guide */
    case 'guided-start': startGuided(0); return;
    case 'free-start': startFree(); return;
    case 'g-next': guideNext(); return;
    case 'g-back': guideGo(GI - 1); return;
    case 'guide-toggle': if (MODE === 'guided') { MODE = 'free'; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} render(); } else startGuided(0); return;
    case 'reset': if (MODE === 'guided') guideGo(0); else { clearTimers(); S = fresh(S.scn); render(); } return;
    case 'path': runPath(d.p); return;
  }
  render();
}
function setFocus(f) {
  if (!f || f === S.focus) return;
  S.focus = f;
  if (f === 'patient') S.replyUnseen = false;
  const el = $(`#dev-${f}`); if (el && !INSTANT) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
}

function doShare() {
  if (!S.noteEdited && !S.note) S.note = defaultNote();
  S.shared = true; S.withdrawn = false; S.p = 'sent'; S.clock = 'sent'; log('share');
  render();
  pulseData();
  fly('#dev-patient .phone', '#dev-clinician .ehr', () => { const b = $('#app-ladder'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } });
  if (MODE === 'free') toast('Sent through the JupyterHealth Exchange.', 'See Dr. Lee’s EHR');
}
function sendReply(type, text) {
  S.resp = type; S.replyText = text; S.compose = false; S.replied = true; S.clock = 'reply'; log('reply');
  render(); pulseData();
  fly('#dev-clinician .ehr', '#dev-patient .phone', () => {
    S.p = 'reply'; S.notif = true; if (S.focus !== 'patient') S.replyUnseen = true; render();
    later(() => { S.notif = false; render(); }, 3200);
  });
  if (MODE === 'free') toast('Reply sent back to the patient’s phone.', null);
}
function pulseData() { const d = $('#data'); if (!d || INSTANT) return; d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse'); setTimeout(() => d.classList.remove('pulse'), 1200); }

/* ================= LOOP STATE ================= */
const STAGES = ['Capture', 'Share', 'Interpret', 'Act', 'Close the loop'];
function loopDone() { return [S.shared, S.seen, !!S.resp, S.replied, S.p === 'reply' && S.replied]; }

/* ================= RENDER: PHONE ================= */
const CHECK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
};
function sb(light) { return `<div class="sb ${light ? 'light' : ''}"><span>3:10</span><span>5G</span></div>`; }
function appHead(back) {
  return `<div class="app-h">${back ? `<button class="back" data-act="${back}" aria-label="Back">‹</button>` : ''}${ladSvg}Ladder<span class="proto">Prototype</span></div>`;
}
function badge(v, title) { return `<span class="badge ${v[0]}" ${title ? `title="${esc(title)}"` : ''}>${v[1]}</span>`; }
function tierBadge(c) { return c.tier === 'reviewed' ? badge(['teal', 'Reviewed (demo)'], REVIEWED_TIP) : badge(['gray', 'No verdict'], 'Not yet reviewed by a licensed expert, so Ladder does not give a verdict.'); }
function protectBox() {
  return `<div class="protect">Taking prescription medicine? Don’t stop or change it on your own. Talk to your care team first.<span>Dietary supplements are not approved by the FDA for safety or effectiveness before they are sold. ${cite(6)}</span></div>`;
}

function renderPhone() {
  const X = sc(), P = pt();
  $('#plabel').textContent = `${P.first}’s phone`;
  let h = '';
  switch (S.p) {
    case 'video':
      h = `${sb(true)}<div class="vid">
        <img src="${X.img}" alt="${esc(X.imgAlt)}"><div class="scrim"></div>
        <div class="vid-cap">${X.cap}</div>
        <div class="vid-sub">“${X.sub}”</div>
        <div class="rrail">
          <div class="rr"><i>${ICON.heart}</i>${X.likes}</div>
          <div class="rr"><i>${ICON.comment}</i>3,104</div>
          <button class="rr share" id="pv-share" data-act="share" aria-label="Share"><i>${ICON.share}</i>Share</button>
        </div>
        <div class="vid-meta"><b>${X.creator}</b><span class="fic">Fictional creator</span><p>${X.tags}</p></div>
        ${S.sheet ? `<div class="sheet-bg" data-act="sheet-close"></div><div class="sheet"><h4>Share to</h4><div class="apps">
          <span class="app dim"><i>Msg</i>Messages</span>
          <button class="app ladder" id="sheet-ladder" data-act="ladder"><i>${ladSvg}</i>Ladder</button>
          <span class="app dim"><i>Note</i>Notes</span>
          <span class="app dim"><i>Link</i>Copy link</span></div></div>` : ''}
      </div>`;
      break;
    case 'analyzing': {
      const steps = ['Finding the health claims', 'Matching research', 'Checking review status'];
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead()}
        <div class="ph-title">Checking this video</div>
        <div class="thumb"><img src="${X.img}" alt=""><p><b>${X.creator}</b>${X.cap.toLowerCase()}</p></div>
        <div class="ana">${steps.map((s, i) => `<div class="${S.ana > i ? 'ok' : S.ana === i ? 'run' : ''}"><i>${S.ana > i ? CHECK : ''}</i>${s}</div>`).join('')}</div>
      </div></div>`;
      break; }
    case 'claims':
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead()}
        <div class="ph-title">${X.claims.length === 1 ? 'One health claim' : `${X.claims.length} health claims`} in this video</div>
        <div class="ph-sub">Tap a claim to see what the research found.</div>
        ${X.claims.map((c, i) => `<button class="claim" id="claim-${i}" data-act="claim" data-i="${i}"><q>${c.q}</q><p>${c.short}</p><span class="row">${badge(c.v)}${tierBadge(c)}<span class="more">See why ›</span></span></button>`).join('')}
        ${X.claims.some(c => !c.unreviewed) ? protectBox() : ''}
      </div><div class="ph-foot"><button class="pbtn" id="to-intent" data-act="to-intent">What are you thinking of doing?</button></div></div>`;
      break;
    case 'detail': {
      const c = X.claims[S.claim];
      const body = c.unreviewed ? `
        <div class="noverdict"><b>No verdict yet</b>Our reviewers haven’t checked this claim. Until a licensed expert reviews it, Ladder doesn’t say whether it’s true or false.</div>
        <div class="sec-h">What we can say</div>
        <div class="gap">This claim is about kidneys. Kidney health matters for people with diabetes or high blood pressure, and supplements can affect people with kidney problems differently. Your care team can tell you whether it’s safe for you.</div>
        <div class="cites">Dietary supplements are not approved by the FDA for safety or effectiveness before they are sold. ${cite(6)}</div>`
        : `<div class="sec-h">The video says, and what studies found</div>
        <div class="vs"><div class="says">“${c.q.replace(/\.$/, '')}”</div><div class="found">${c.found.map(f => `<p>${f}</p>`).join('')}</div></div>
        <div class="sec-h">Where it goes too far</div>
        ${c.gaps.map(g => `<div class="gap"><b>${g[0]}</b><div>${g[1]}</div></div>`).join('')}
        ${protectBox()}`;
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead('back-claims')}
        <div style="display:flex;gap:6px;flex-wrap:wrap">${badge(c.v)}${tierBadge(c)}</div>
        <div class="ph-title" style="margin-top:10px">“${c.q}”</div>
        ${body}
        ${S.claim < X.claims.length - 1 ? `<button class="claim" data-act="claim" data-i="${S.claim + 1}"><p style="margin:0">Next claim</p><q>${X.claims[S.claim + 1].q}</q></button>` : ''}
      </div><div class="ph-foot"><button class="pbtn" id="to-intent" data-act="to-intent">What are you thinking of doing?</button></div></div>`;
      break; }
    case 'intent':
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead('back-claims')}
        <div class="ph-title">What are you thinking of doing?</div>
        <div class="ph-sub">Choose any that apply.</div>
        <div id="intent-opts">
        ${[...X.intents, { k: 'curious', label: 'Just curious, nothing planned' }].map(i => `<button class="opt ${S.intents.includes(i.k) ? 'on' : ''}" data-act="toggle-intent" data-k="${i.k}" aria-pressed="${S.intents.includes(i.k)}"><i>${S.intents.includes(i.k) ? CHECK : ''}</i><span>${i.label}${i.sub ? `<small>${i.sub}</small>` : ''}</span>${i.rx ? '<span class="rxtag">Rx</span>' : ''}</button>`).join('')}
        </div>
      </div><div class="ph-foot"><button class="pbtn" id="intent-go" data-act="intent-continue" ${S.intents.length ? '' : 'disabled'}>Continue</button></div></div>`;
      break;
    case 'curious':
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead('back-intent')}
        <div class="ph-title">Got it. Nothing to share.</div>
        <div class="ph-sub">Your check stays on this phone. If you decide to try something later, you can tell your care team from here.</div>
        <div class="loopdone" style="background:#F2F3F5;color:var(--ink2)">Nothing was sent to the clinic, which keeps Dr. Lee’s cards to the ones that matter.</div>
      </div><div class="ph-foot"><button class="pbtn ghost" data-act="back-intent">Change my answer</button></div></div>`;
      break;
    case 'ask': {
      const ch = chosen();
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead('back-intent')}
        <div class="ph-title">Want your care team to know?</div>
        <div class="ph-sub">Dr. Lee’s team at Bayside Primary Care can see this before your next visit (${P.next}). They may message you.</div>
        <div class="preview" id="ask-preview"><div class="ph">What your care team will see</div><div class="pb">
          <b>${P.name} is considering:</b><ul>${ch.map(i => `<li>${i.clin}</li>`).join('')}</ul>
          <div class="q" id="pv-note">“${esc(S.note)}”</div>
          ${S.ev ? `<div style="margin-top:6px;color:var(--ink3)">Plus Ladder’s evidence summary</div>` : ''}
        </div></div>
        <div class="sec-h">In your words (you can edit)</div>
        <textarea class="note" id="note" aria-label="Message to your care team">${esc(S.note)}</textarea>
        <div class="switch">Include Ladder’s evidence summary<button class="tog ${S.ev ? 'on' : ''}" data-act="toggle-ev" aria-pressed="${S.ev}" aria-label="Include evidence summary"></button></div>
      </div><div class="ph-foot">
        <button class="pbtn teal" id="send" data-act="send">Send to my care team</button>
        <button class="pbtn ghost" id="notnow" data-act="notnow">Not now</button>
        <div class="tiny">Nothing is sent unless you tap Send. You can withdraw it later.</div>
      </div></div>`;
      break; }
    case 'consent':
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead('reshare')}
        <div class="ph-title">Join Bayside’s Ladder study</div>
        <div class="ph-sub">Bayside Primary Care runs this study on JupyterHealth. Choose what to share, one type at a time. You can change it any time.</div>
        <div id="consent-list">
        <div class="cons"><div class="switch"><span>Health decisions I choose to share<span class="req">Needed</span></span><button class="tog ${S.cDec ? 'on' : ''}" id="c-dec" data-act="c-dec" aria-pressed="${S.cDec}" aria-label="Share decisions"></button></div><p>Only the ones you send, like this one. Seen by Dr. Lee’s care team.</p></div>
        <div class="cons"><div class="switch"><span>Medicines and lab results from my patient portal</span><button class="tog ${S.cPortal ? 'on' : ''}" id="c-portal" data-act="c-portal" aria-pressed="${S.cPortal}" aria-label="Share portal records"></button></div><p>Lets your care team see your decision next to your current medicines and labs.</p>${S.portalAuth ? '<div class="ok">Patient portal connected</div>' : ''}</div>
        <div class="cons dim"><div class="switch"><span>Blood glucose from my CGM</span><button class="tog" disabled aria-label="CGM, comes later"></button></div><p>Comes later</p></div>
        <div class="cons dim"><div class="switch"><span>Blood pressure from my home monitor</span><button class="tog" disabled aria-label="Blood pressure, comes later"></button></div><p>Comes later</p></div>
        </div>
      </div><div class="ph-foot"><button class="pbtn teal" id="consent-agree" data-act="consent-agree" ${S.cDec ? '' : 'disabled'}>Agree and send</button><div class="tiny">Your data stays in Bayside’s JupyterHealth Exchange.</div></div>
      ${S.portalOv ? `<div class="sheet-bg" data-act="portal-deny"></div><div class="portal" id="portal"><div class="ptop">Bayside Health patient portal (fictional)</div><h4>Allow “Ladder study at Bayside” to:</h4><ul><li>Read your medicines</li><li>Read your conditions</li><li>Read your lab results</li></ul><p class="tiny" style="text-align:left;margin-top:8px">SMART on FHIR patient access. Read-only. You can revoke it in the portal.</p><div class="row"><button class="pbtn ghost" data-act="portal-deny">Don’t allow</button><button class="pbtn teal" id="portal-allow" data-act="portal-allow">Allow</button></div></div>` : ''}
      </div>`;
      break;
    case 'notnow':
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead()}
        <div class="ph-title">Okay. Nothing was sent.</div>
        <div class="ph-sub">Your check is saved on this phone only. Dr. Lee’s team can’t see it.</div>
        ${protectBox()}
      </div><div class="ph-foot"><button class="pbtn ghost" data-act="reshare">Changed your mind? Tell my care team</button></div></div>`;
      break;
    case 'sent':
    case 'reply': {
      const reply = S.p === 'reply' && S.replied;
      h = `${sb()}<div class="scr"><div class="scr-body">${appHead()}
        <div class="ph-title">${reply ? 'Your care team replied' : S.withdrawn ? 'You withdrew this' : 'Sent to your care team'}</div>
        <div class="tl">
          <div class="ok"><i>${CHECK}</i><span><b>Sent</b><small>${T.sent.label}</small></span></div>
          ${S.withdrawn ? `<div class="wd"><i>–</i><span><b>Withdrawn</b><small>Dr. Lee’s team sees it as withdrawn</small></span></div>` :
          `<div class="${S.seen ? 'ok' : ''}"><i>${S.seen ? CHECK : ''}</i><span><b>Seen by your care team</b><small>${S.seen ? T.seen.label : 'Waiting'}</small></span></div>
          <div class="${S.replied ? 'ok' : ''}"><i>${S.replied ? CHECK : ''}</i><span><b>Reply</b><small>${S.replied ? T.reply.label : 'They may message you'}</small></span></div>`}
        </div>
        ${reply ? `<div class="bubble"><small>Dr. Lee, Bayside Primary Care</small>${esc(S.replyText)}</div>
          ${S.ack ? `<div class="bubble me">Got it, thanks.</div>` : ''}
          <div class="loopdone">Loop closed: ${T.reply.rel}, not at the next visit.</div>`
          : `<div class="preview"><div class="ph">You shared</div><div class="pb"><div class="q" style="margin:0">“${esc(S.note)}”</div></div></div>`}
      </div><div class="ph-foot">
        ${reply ? (S.ack ? '<div class="tiny">That’s the whole loop.</div>' : `<button class="pbtn teal" data-act="got-it">Got it</button><button class="pbtn ghost" data-act="got-it">Book a call</button>`)
          : S.withdrawn ? '<button class="pbtn ghost" data-act="reshare">Share again</button>' : `<button class="pbtn ghost" id="withdraw" data-act="withdraw" ${S.replied ? 'disabled' : ''}>Withdraw</button>`}
      </div></div>
      ${S.notif ? `<div class="notif"><span class="ic">${ladSvg}</span><span><b>Bayside Primary Care, Dr. Lee</b><p>${esc(S.replyText.slice(0, 64))}…</p></span></div>` : ''}`;
      break; }
  }
  $('#phone').innerHTML = h;
  const ta = $('#note');
  if (ta) ta.addEventListener('input', e => { S.note = e.target.value; S.noteEdited = true; const pv = $('#pv-note'); if (pv) pv.textContent = `“${S.note}”`; });
}

/* ================= RENDER: EHR ================= */
function spark(vals) {
  const v = vals.map(x => x[2]); if (v.length < 2) return '';
  const mn = Math.min(...v) - .3, mx = Math.max(...v) + .3, w = 90, h = 26;
  const pts = v.map((y, i) => `${(i / (v.length - 1)) * (w - 8) + 4},${h - 4 - ((y - mn) / (mx - mn)) * (h - 8)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#2A57A3" stroke-width="2.2"/>${pts.split(' ').map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="2.8" fill="#2A57A3"/>`).join('')}</svg>`;
}
function shortProblem(p) { return p.replace(' mellitus', '').replace('Essential hypertension', 'Hypertension'); }
function shortMed(m) { return `<b>${m.name.replace(' tablet', '')}</b> ${m.sig.replace('1 tab ', '')}`; }
function labLine(l) {
  const v = l.vals, last = v[v.length - 1];
  const name = l.loinc === '4548-4' ? 'A1c' : l.loinc === '2089-1' ? 'LDL' : l.loinc === '85354-9' ? 'Blood pressure' : l.name;
  const prev = v.length > 1 ? ` <span class="trend">down from ${v[v.length - 2][1].replace(' mg/dL', '').replace(' ', '')}</span>` : '';
  return `${name} <b>${last[1].replace(' mmHg', '').replace(' mg/dL', ' mg/dL').replace(' %', '%')}</b>${prev}`;
}
function gapStrip() {
  const P = pt(), ch = chosen();
  if (S.shared && !S.withdrawn) {
    const what = ch.map(i => i.clin.toLowerCase()).join(', ');
    return `<div class="e-gap shared"><span><b>${S.seen ? 'Shared through Ladder:' : 'New from Ladder:'}</b> ${P.first} is considering ${what}.</span>${S.c === 'chart' ? '<button data-act="open-ladder">Open</button>' : ''}</div>`;
  }
  return `<div class="e-gap"><span><b>Supplements: none documented.</b> The clinic can’t see what ${P.first} starts or stops at home.</span></div>`;
}
function chartHTML() {
  const P = pt(), t = S.etab;
  if (t === 'meds') return `<div class="e-card"><h4>Medicines</h4><ul>${P.meds.map(m => `<li><span>${shortMed(m)}</span><span class="code">RxNorm ${m.rx}</span></li>`).join('')}</ul></div>`;
  if (t === 'problems') return `<div class="e-card"><h4>Problems</h4><ul>${P.problems.map(p => `<li><span>${p[0]}</span><span class="code">${p[1]}</span></li>`).join('')}</ul></div>`;
  if (t === 'results') return `<div class="e-card"><h4>Results</h4><ul>${P.labs.map(l => `<li><span>${l.name}</span><span class="code">${l.vals.map(v => `${v[1]} (${v[0]})`).join(' → ')} · LOINC ${l.loinc}</span></li>`).join('')}</ul></div>`;
  const key = P.labs[0], bp = P.labs.find(l => l.loinc === '85354-9');
  return `<div class="e-sum">
      <div class="e-box"><h4>Problems</h4><ul>${P.problems.slice(0, 3).map(p => `<li>${shortProblem(p[0])}</li>`).join('')}</ul></div>
      <div class="e-box"><h4>Medicines</h4><ul>${P.meds.map(m => `<li>${shortMed(m)}</li>`).join('')}</ul></div>
      <div class="e-box"><h4>Latest results</h4><ul><li>${labLine(key)}</li>${bp ? `<li>${labLine(bp)}</li>` : ''}</ul></div>
    </div>`;
}
function sigCard() {
  const P = pt(), X = sc(), ch = chosen();
  if (!S.shared) return `<div class="e-card"><p class="e-empty">No patient-shared decisions for ${P.name} yet.</p><p class="e-empty" style="margin-top:6px">Signals appear here only when the patient taps <b>Send</b> in Ladder.</p></div>`;
  const wd = S.withdrawn, dis = wd || S.resp ? 'disabled' : '';
  const respDone = S.resp ? `<div class="done-msg">${S.resp === 'message' ? 'Message sent' : S.resp === 'visit' ? `Will discuss at the ${P.next} visit; patient notified` : S.resp === 'call' ? 'Call requested; patient notified' : 'Marked reviewed; patient notified'}, ${T.reply.label}</div>` : '';
  const key = P.labs[0];
  const ctx = S.cPortal ? `<div class="ctx">
        <div><small>Medicines</small>${P.meds.map(m => m.name.replace(' tablet', '')).join('<br>')}</div>
        <div><small>${key.loinc === '4548-4' ? 'A1c' : 'LDL'}</small>${key.vals.map(v => v[1].replace(' mg/dL', '')).join(' → ')}<span class="spark">${spark(key.vals)}</span></div>
        <div><small>Next visit</small>${P.next}</div>
      </div>`
    : `<p class="e-empty">${P.first} did not share portal records with this study.</p>`;
  return `<div class="sig" id="sigcard" style="${wd ? 'opacity:.6' : ''}">
    <div class="sig-sec">
      <div class="sig-top">Shared by ${P.first}, ${T.sent.label}${wd ? '<span class="st gray">Withdrawn</span>' : S.resp ? '<span class="st">Responded</span>' : '<span class="new">New</span>'}</div>
      <ul class="dec">${ch.map(i => `<li>${i.clin}${i.rx ? ' <span class="rxtag" style="margin-left:4px">Rx</span>' : ''}</li>`).join('')}</ul>
      <div class="words">“${esc(S.note)}”</div>
    </div>
    ${S.ev ? `<div class="sig-sec"><h5>Evidence ${badge(X.evTier, X.evTier[1].startsWith('Reviewed') ? REVIEWED_TIP : '')}</h5><ul class="ev">${X.evShort.map(e => `<li>${e}</li>`).join('')}</ul></div>` : ''}
    <div class="sig-sec"><h5>From the Exchange</h5>${ctx}</div>
    <div class="sig-sec" id="resp">
      ${S.compose ? `<div class="compose"><textarea id="compose" aria-label="Message to patient">${esc(S.composeText)}</textarea><div class="row"><button class="ebtn" data-act="compose-cancel">Cancel</button><button class="ebtn pri" id="reply-send" data-act="reply-send">Send to ${P.first}</button></div></div>`
        : `<div class="resp">
          <button class="ebtn pri" id="btn-message" data-act="message" ${dis}>Message ${P.first}</button>
          <button class="ebtn" data-act="resp" data-t="visit" ${dis}>Discuss at visit</button>
          <button class="ebtn" data-act="resp" data-t="call" ${dis}>Request a call</button>
        </div>`}
      ${respDone}
      <div class="rate">Useful? <button data-act="rate" data-v="up" class="${S.rating === 'up' ? 'on' : ''}">Yes</button><button data-act="rate" data-v="down" class="${S.rating === 'down' ? 'on' : ''}">No</button><span class="disc">No treatment advice from Ladder.</span></div>
    </div>
  </div>`;
}
function panelHTML() {
  const P = pt(), ch = chosen();
  const me = S.shared ? { id: P.id, name: `${P.name}, ${P.age}`, what: ch.map(i => i.clin).join('; '), rx: ch.some(i => i.rx), st: S.withdrawn ? ['none', 'Withdrawn'] : S.resp ? ['done', 'Replied'] : ['new', 'New'], when: 'Nov 8', me: true } : null;
  const rows = [...(me ? [me] : []), ...OTHERS.filter(o => o.id !== P.id)].sort((a, b) => (b.rx - a.rx));
  const open = rows.filter(r => r.st[0] === 'new').length;
  return `<div class="panel-sum"><div><b>${rows.length}</b>signals this week</div><div><b>${open}</b>open</div><div><b>${rows.filter(r => r.rx).length}</b>involve a prescription</div></div>
    <table class="panel-t"><thead><tr><th>Patient</th><th>Decision shared</th><th></th><th>Status</th></tr></thead><tbody>
    ${rows.map(r => `<tr class="${r.me ? 'me' : ''}"><td><b>${r.name}</b><br><small style="color:var(--e-ink2)">${r.when}</small></td><td>${r.what}</td><td>${r.rx ? '<span class="rxtag">Rx</span>' : ''}</td><td><span class="st ${r.st[0]}">${r.st[1]}</span></td></tr>`).join('')}
    </tbody></table>
    <p class="srcline" style="margin-top:8px;font-size:13.5px;color:var(--e-ink2)">Synthetic panel, prescription-related decisions first. Cards per clinician per week is a pilot measure of alert burden.</p>`;
}
function renderEHR() {
  const P = pt();
  const isNew = S.shared && !S.seen && !S.withdrawn;
  const open = S.c !== 'chart';
  let main;
  if (S.c === 'launching') main = `<div class="vo"><div class="loading"><div class="sp"></div>Opening Ladder signals through SMART on FHIR…<span>patient ${P.id} · Practitioner/dr-lee</span></div></div>`;
  else if (S.c === 'card') main = `<div class="vo">
      <div class="vo-h">${ladSvg}<b>Ladder signals</b><span class="meta">Voilà dashboard on JupyterHub, opened with SMART on FHIR</span><button class="x" data-act="close-ladder">Close</button></div>
      <div class="vo-tabs"><button class="${S.vtab === 'patient' ? 'on' : ''}" data-act="vtab" data-t="patient">This patient</button><button class="${S.vtab === 'panel' ? 'on' : ''}" data-act="vtab" data-t="panel">All patients</button></div>
      <div class="vo-b">${S.vtab === 'panel' ? panelHTML() : sigCard()}</div></div>`;
  else main = chartHTML();
  $('#ehr').innerHTML = `
    <div class="e-chrome"><i></i><i></i><i></i><span class="url">ehr.bayside.example/chart/${P.mrn}</span></div>
    <div class="e-app"><span class="logo">Bayside EHR<span>Primary care, Dr. Lee (fictional)</span></span>
      <span class="apps"><span>Apps</span><button class="appbtn ${open ? 'on' : ''}" id="app-ladder" data-act="open-ladder">${ladSvg}Ladder signals${isNew ? '<span class="cnt">1</span>' : ''}</button></span></div>
    <div class="e-banner"><span class="av">${P.init}</span><span><b>${P.name}</b> <span class="kv">${P.age} y, ${P.sex}</span></span><span class="kv">MRN <strong>${P.mrn}</strong></span><span class="kv">Next visit <strong>${P.next}</strong></span></div>
    ${gapStrip()}
    <nav class="e-nav" aria-label="Chart">
      ${[['summary', 'Summary'], ['problems', 'Problems'], ['meds', 'Medicines'], ['results', 'Results']].map(([k, l]) => `<button class="${!open && S.etab === k ? 'on' : ''}" data-act="etab" data-t="${k}">${l}</button>`).join('')}
      <button class="${open ? 'on' : ''}" data-act="open-ladder">Ladder signals</button>
    </nav>
    <div class="e-main">${main}</div>`;
  const ta = $('#compose');
  if (ta) ta.addEventListener('input', e => { S.composeText = e.target.value; });
}

/* ================= RENDER: DATA ================= */
function renderData() {
  const last = S.log.length ? S.log[S.log.length - 1] : null;
  const sum = last ? PLAIN[last]() : `Nothing has happened in JupyterHealth yet. When ${pt().first} shares a decision, the data appears here.`;
  let h = `<div class="d-sum"><span class="d-ic">${ICON.data}</span><div class="d-t"><b>Meanwhile in JupyterHealth</b><p>${sum}</p></div>
    ${S.log.length ? `<button class="d-toggle" data-act="data-toggle" aria-expanded="${S.dataOpen}">${S.dataOpen ? 'Hide the FHIR data' : 'Show the FHIR data'}</button>` : ''}</div>`;
  if (S.dataOpen && S.log.length) {
    const items = S.log.map(k => LOG[k]());
    const sel = items[S.sel] || items[items.length - 1];
    const val = x => typeof x === 'function' ? x() : x;
    h += `<div class="hood">
      <div class="hood-h"><b>Every step, the data it writes or reads</b>
        <span class="ab">Store the decision as<span class="seg2" role="group" aria-label="Design option"><button class="${S.opt === 'A' ? 'on' : ''}" data-act="opt" data-v="A">A: MedicationStatement</button><button class="${S.opt === 'B' ? 'on' : ''}" data-act="opt" data-v="B">B: Observation</button></span></span></div>
      <div class="hood-b">
        <div class="hood-list">${items.map((e, i) => `<button class="hl ${items[i] === sel ? 'on' : ''}" data-act="hsel" data-i="${i}"><span class="hst ${e.none ? 'warn' : ''}">${e.stage}</span><b>${e.title}</b><small>${e.comp}</small></button>`).join('')}</div>
        <div class="hood-d">
          <div class="hd-meta"><span class="chip cstage">${sel.stage}</span><span class="chip">${sel.comp}</span>${sel.warn ? `<span class="chip warn">${sel.warn}</span>` : ''}</div>
          ${sel.call ? `<code class="hd-call">${val(sel.call)}</code>` : ''}
          <div class="hd-cap">${val(sel.cap)}</div>
          ${sel.json ? `<pre class="json"><button class="copy" data-act="copy">Copy</button>${hlJSON(sel.json())}</pre>` : ''}
          <p class="hd-cap">Illustrative requests shaped after FHIR R5 and SMART App Launch. Nothing leaves your browser.</p>
        </div>
      </div></div>`;
  }
  $('#data').innerHTML = h;
}

/* ================= RENDER: STAGE ================= */
function renderStage() {
  const st = $('#stage');
  st.classList.toggle('focus-patient', S.focus === 'patient');
  st.classList.toggle('focus-clinician', S.focus === 'clinician');
  const clinNews = S.shared && !S.seen && !S.withdrawn && S.focus !== 'clinician';
  $('#dev-clinician').classList.toggle('has-news', clinNews);
  $('#dev-patient').classList.toggle('has-news', S.replyUnseen && S.focus !== 'patient');
  $('#vs-patient').classList.toggle('on', S.focus === 'patient');
  $('#vs-clinician').classList.toggle('on', S.focus === 'clinician');
  $('#vdot').classList.toggle('on', clinNews);
  $('#open-clinician').textContent = clinNews ? 'New from Alex. Click to open.' : S.shared ? 'Dr. Lee’s EHR. Click to open.' : 'Waiting for Alex. This lights up when he shares.';
  $('#open-patient').textContent = S.replyUnseen && S.focus !== 'patient' ? 'New reply on Alex’s phone' : 'Alex’s phone';
}

/* ================= GUIDE ================= */
let GI = 0, gBusy = false, gTimer = 0;
const STEPS = [
  { who: 'patient', stage: 0, title: 'Meet Alex', body: '37, type 2 diabetes, takes metformin. You play Alex first, then his doctor.', read: 'Press <b>Start</b>, or tap Share on the phone.', next: 'Start', done: () => S.sheet || S.p !== 'video' },
  { who: 'patient', stage: 0, title: 'A video makes a promise', body: '“Berberine works like Ozempic. I stopped metformin.”', move: 'Tap <b>Share</b> on the video.', target: '#pv-share', done: () => S.sheet || S.p !== 'video', do: () => act('share') },
  { who: 'patient', stage: 0, title: 'Check it with Ladder', body: 'Ladder finds the health claims and checks the research.', move: 'Tap <b>Ladder</b>.', target: '#sheet-ladder', done: () => S.p !== 'video', do: () => act('ladder') },
  { who: 'patient', stage: 0, title: 'Two claims, two verdicts', body: 'Each claim gets a verdict and a review status.', move: 'Tap the first claim.', target: '#claim-0', ready: () => S.p === 'claims', done: () => S.p === 'detail' || S.p === 'intent', do: () => act('claim', { i: 0 }) },
  { who: 'patient', stage: 0, title: 'Where it goes too far', body: 'Real studies, stretched. Ladder never says “stop your medicine.”', move: 'Tap <b>What are you thinking of doing?</b>', target: '#to-intent', done: () => S.p === 'intent', do: () => act('to-intent') },
  { who: 'patient', stage: 0, title: 'What is Alex planning?', body: 'This is what his clinic never hears about.', move: 'Pick <b>Start berberine</b> and <b>Stop metformin</b>, then <b>Continue</b>.', target: '#intent-opts', done: () => S.p === 'ask', do: () => { S.intents = [...sc().tourIntents]; act('intent-continue'); } },
  { who: 'patient', stage: 1, title: 'Tell the care team?', body: 'He sees exactly what they will see. Nothing goes without Send.', move: 'Tap <b>Send to my care team</b>.', target: '#send', done: () => S.p === 'consent' || S.shared, do: () => act('send') },
  { who: 'patient', stage: 1, title: 'Consent, one item at a time', body: 'Alex joins his clinic’s study on JupyterHealth.', move: 'Turn on both switches (<b>Allow</b> the portal), then <b>Agree and send</b>.', target: '#consent-list', done: () => S.shared, do: () => { S.cDec = true; S.portalAuth = true; S.cPortal = true; S.portalOv = false; act('consent-agree'); } },
  { who: 'data', stage: 1, title: 'Sent through JupyterHealth', body: 'His decision is now FHIR data on the Exchange.', read: 'Look below the screens. Try <b>A</b> or <b>B</b>: how to store “considering” is our open question.', target: '#data', next: 'Next', enter: () => { S.dataOpen = true; } },
  { who: 'clinician', stage: 2, title: 'Next day: you are Dr. Lee', body: 'A new signal is waiting in her EHR.', move: 'Tap <b>Ladder signals</b>.', target: '#app-ladder', done: () => S.c === 'card', do: () => act('open-ladder') },
  { who: 'clinician', stage: 2, title: 'One card, all she needs', body: 'His words, the evidence, his medicines and A1c. No AI advice.', read: 'Read it, then press <b>Next</b>.', target: '#sigcard', ready: () => S.c === 'card', next: 'Next' },
  { who: 'clinician', stage: 3, title: 'Dr. Lee replies', body: 'Message, plan a visit, or call.', move: 'Tap <b>Message Alex</b>, then <b>Send to Alex</b>.', target: () => S.compose ? '#reply-send' : '#btn-message', done: () => S.replied, do: () => { if (!S.compose) act('message'); act('reply-send'); } },
  { who: 'patient', stage: 4, title: 'Loop closed', body: 'Alex hears back in 3 days, not at his next visit.', read: 'Press <b>Finish</b> to try other paths.', target: '.loopdone', ready: () => S.p === 'reply' && S.replied, next: 'Finish' },
];
const ROLE = {
  patient: () => ['r-pat', `${pt().first}, the patient`],
  clinician: () => ['r-doc', 'Dr. Lee, the clinician'],
  data: () => ['r-sys', 'JupyterHealth'],
};
function renderBar() {
  const done = loopDone();
  let on;
  if (MODE === 'guided') on = STEPS[GI].stage; else { on = done.indexOf(false); if (on < 0) on = 5; }
  $('#loopline').innerHTML = STAGES.map((s, i) => `<li class="${i === on ? 'on' : done[i] ? 'done' : ''}">${s}</li>`).join('');
  const t = T[S.clock] || T.pre;
  $('#clock').innerHTML = `${t.label.replace(/ Nov \d+,/, '')}${t.rel ? ` <b>${t.rel.replace(' after the decision', ' later')}</b>` : ''}`;
  const sw = $('#gswitch');
  sw.setAttribute('aria-checked', String(MODE === 'guided'));
  sw.classList.toggle('on', MODE === 'guided');
  document.body.classList.toggle('guided', MODE === 'guided');
}
function renderCoach() {
  const c = $('#coach');
  if (MODE !== 'guided') { c.hidden = true; c.innerHTML = ''; return; }
  const st = STEPS[GI], r = ROLE[st.who]();
  const isAct = !!st.move, primary = st.next || 'Do it for me';
  c.hidden = false;
  c.className = `coach at-${st.who === 'data' ? 'data' : S.focus}`;
  c.innerHTML = `<div class="c-top"><span class="role ${r[0]}">${r[1]}</span><span class="dots" role="img" aria-label="Step ${GI + 1} of ${STEPS.length}">${STEPS.map((_, i) => `<i class="${i < GI ? 'd' : i === GI ? 'o' : ''}"></i>`).join('')}</span></div>
    <h3 class="c-title">${st.title}</h3>
    <p class="c-body">${st.body}</p>
    <p class="c-move ${isAct ? '' : 'read'}">${isAct ? st.move : st.read}</p>
    <div class="c-btns">${GI > 0 ? '<button class="c-back" data-act="g-back">Back</button>' : ''}<button class="btn ${isAct ? 'btn-ghost' : ''}" data-act="g-next">${primary}</button></div>`;
  placeCoach();
}
function placeCoach() {
  const c = $('#coach');
  if (!c || c.hidden || isMobile()) { if (c) { c.style.left = ''; c.style.top = ''; } return; }
  const wrap = $('.stage-wrap').getBoundingClientRect();
  const st = STEPS[GI];
  const pr = $('#dev-patient .phone').getBoundingClientRect(), er = $('#dev-clinician .ehr').getBoundingClientRect();
  const cw = c.offsetWidth, ch = c.offsetHeight;
  let x, y;
  if (st.who === 'data') { const dr = $('#data').getBoundingClientRect(); x = pr.right - wrap.left + 34; y = dr.top - wrap.top - ch - 20; }
  else if (S.focus === 'clinician') { x = Math.max(0, er.left - wrap.left - cw - 34); y = er.top - wrap.top + 60; }
  else { x = pr.right - wrap.left + 34; y = pr.top - wrap.top + 60; }
  c.style.left = `${x}px`; c.style.top = `${y}px`;
}
function applyGlow() {
  document.querySelectorAll('.glow').forEach(e => e.classList.remove('glow'));
  if (MODE !== 'guided') return;
  const st = STEPS[GI]; if (!st || !st.target) return;
  if (st.ready && !st.ready()) return;
  const sel = typeof st.target === 'function' ? st.target() : st.target;
  const el = document.querySelector(sel); if (el && sel !== '#data' && sel !== '#sigcard') el.classList.add('glow');
}
function guideCheck() {
  if (MODE !== 'guided' || gBusy || INSTANT) return;
  const st = STEPS[GI];
  if (st && st.done && st.done()) {
    gBusy = true;
    const at = GI;
    gTimer = setTimeout(() => { gBusy = false; if (MODE === 'guided' && GI === at && GI < STEPS.length - 1) { GI++; enterStep(true); } }, 380);
  }
}
function enterStep(scroll) {
  const st = STEPS[GI];
  if (st.enter) st.enter(); else S.dataOpen = false;
  if (st.who === 'patient' || st.who === 'clinician') setFocus(st.who);
  render();
  try { history.replaceState(null, '', `#step=${GI}`); } catch (e) {}
  if (scroll) scrollToTarget(st);
}
function scrollToTarget(st) {
  setTimeout(() => {
    placeCoach();
    const data = st.who === 'data';
    const el = data ? $('#data') : (isMobile() ? $('#stage') : $('.demo-bar'));
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const head = isMobile() ? $('.top').offsetHeight + 8 : 10;
    const want = data ? Math.min(innerHeight - 240, ($('#coach').offsetHeight || 300) + 110) : head;
    if (Math.abs(top - want) > 24) window.scrollTo({ top: top + scrollY - want, behavior: 'smooth' });
  }, 160);
}
function scrollToStage() { $('#demo').scrollIntoView({ behavior: 'smooth' }); }
function guideNext() {
  const st = STEPS[GI];
  if (st.next) {
    if (GI === STEPS.length - 1) { MODE = 'free'; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} render(); toast('Guide off. Try another path from the menu above the screens.'); return; }
    GI++; enterStep(true); return;
  }
  if (st.do) st.do();
}
function guideGo(n) {
  n = Math.max(0, Math.min(n, STEPS.length - 1));
  INSTANT = true; clearTimers(); clearTimeout(gTimer); gBusy = false;
  const opt = S.opt; S = fresh('berberine'); S.opt = opt; MODE = 'guided';
  for (let i = 1; i < n; i++) { const s = STEPS[i]; if (s.do) s.do(); if (s.enter) s.enter(); }
  INSTANT = false; GI = n; enterStep(true);
}
function startGuided(n) { MODE = 'guided'; scrollToStage(); guideGo(n || 0); }
function startFree(keep) {
  MODE = 'free';
  if (!keep) { clearTimers(); S = fresh('berberine'); }
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  render();
  if (!keep) scrollToStage();
}
function replayTo(n) {
  INSTANT = true; clearTimers(); S = fresh('berberine');
  for (let i = 1; i < n; i++) { const s = STEPS[i]; if (s.do) s.do(); }
  INSTANT = false;
}
function runPath(p) {
  if (p === 'guided') { startGuided(0); return; }
  MODE = 'free';
  if (p === 'notnow') { replayTo(6); setFocus('patient'); }
  else if (p === 'noportal') { replayTo(7); S.p = 'consent'; S.cDec = true; setFocus('patient'); }
  else if (p === 'withdraw') { replayTo(9); setFocus('patient'); }
  else if (p === 'seamoss' || p === 'ryr') { clearTimers(); S = fresh(p); }
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  render(); scrollToTarget({ who: 'patient' });
  const msg = { notnow: 'Now tap “Not now” on the phone.', noportal: 'Leave the portal switch off and tap “Agree and send.”', withdraw: 'Tap “Withdraw” on the phone, then open Dr. Lee’s EHR.', seamoss: 'Tap Share, then Ladder, then the claim.', ryr: 'Tap Share, then Ladder. Maria takes atorvastatin.' }[p];
  if (msg) toast(msg);
}

/* ================= RENDER ALL ================= */
function render() {
  renderStage(); renderPhone(); renderEHR(); renderData(); renderBar(); renderCoach(); applyGlow();
  guideCheck();
}

/* ================= TOAST / FLY ================= */
let toastT;
function toast(msg, btn) {
  const t = $('#toast');
  t.innerHTML = `<span>${msg}</span>${btn ? `<button data-act="toast-go">${btn}</button>` : ''}`;
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(hideToast, 4200);
}
function hideToast() { $('#toast').classList.remove('on'); }
function center(el) {
  const r = el.getBoundingClientRect(), d = $('#demo').getBoundingClientRect();
  return [r.left + r.width / 2 - d.left - 10, r.top + Math.min(r.height / 2, 200) - d.top - 10];
}
function fly(fromSel, toSel, cb) {
  const a = $(fromSel), b = $(toSel), pk = $('#packet');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (INSTANT || reduce || isMobile() || !a || !b || !pk.animate) { cb && cb(); return; }
  const [ax, ay] = center(a), [bx, by] = center(b);
  const mx = (ax + bx) / 2, my = Math.max(ay, by) + 120;
  const anim = pk.animate([
    { transform: `translate(${ax}px,${ay}px)`, opacity: 0 },
    { transform: `translate(${ax}px,${ay}px)`, opacity: 1, offset: .1 },
    { transform: `translate(${mx}px,${my}px)`, opacity: 1, offset: .5 },
    { transform: `translate(${bx}px,${by}px)`, opacity: 1, offset: .9 },
    { transform: `translate(${bx}px,${by}px)`, opacity: 0 },
  ], { duration: 1200, easing: 'ease-in-out' });
  anim.onfinish = () => { cb && cb(); };
}

/* ================= STATIC SECTIONS ================= */
const CREDITS = [
  ['assets/berberis-vulgaris.jpg', '“Berberis vulgaris” by Arnstein Rønning, CC BY-SA 3.0, via Wikimedia Commons', 'https://commons.wikimedia.org/w/index.php?curid=16499955', 'behind the berberine video'],
  ['assets/chondrus-crispus.jpg', '“Chondrus crispus” by Cassidy Best, CC BY 4.0, via iNaturalist', 'https://www.inaturalist.org/photos/115590209', 'behind the sea moss video'],
  ['assets/red-yeast-rice.jpg', '“Hongqu 3” by Uranassbandit, CC BY-SA 3.0, via Wikimedia Commons', 'https://commons.wikimedia.org/w/index.php?curid=33454974', 'behind the red yeast rice video'],
  ['assets/pills.jpg', 'Capsules and tablets, CC0, via rawpixel', 'https://www.rawpixel.com/image/5949539/free-public-domain-cc0-photo', 'in “Invisible to the clinic”'],
  ['assets/capsules.jpg', 'Gel capsules and glass dome, CC0, via rawpixel', 'https://www.rawpixel.com/image/5959695/free-public-domain-cc0-photo', 'in “What Ladder will not do”'],
];
function renderRefs() {
  $('#refs').innerHTML = REFS.map((r, i) => `<li id="ref-${i + 1}">${esc(r[0])} ${r[1] ? `<a href="https://doi.org/${r[1]}" target="_blank" rel="noopener">doi:${r[1]}</a>` : `<a href="${r[2]}" target="_blank" rel="noopener">${r[2].replace('https://', '')}</a>`}</li>`).join('');
  $('#credits').innerHTML = CREDITS.map(c => `<li><a href="${c[2]}" target="_blank" rel="noopener">${esc(c[1])}</a>, ${c[3]}.</li>`).join('') + '<li>Team photos: our own.</li>';
}
function renderP2() {
  const vals = [142, 150, 138, 145, 151, 147, 139, 144, 152, 141, 146, 149, 143, 140, 147, 141, 152, 139, 145, 150, 138, 146, 143, 151, 140, 144, 149, 142];
  const W = 520, H = 200, L = 40, B = 168, mn = 120, mx = 160;
  const X = i => L + i * ((W - L - 10) / (vals.length - 1)), Y = v => B - ((v - mn) / (mx - mn)) * (B - 30);
  const pts = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  $('#p2chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" font-family="Inter, system-ui, sans-serif" role="img" aria-label="Synthetic CGM daily mean glucose over 28 days, with a marker where the patient reported starting a supplement">
    ${[120, 140, 160].map(v => `<text x="${L - 8}" y="${Y(v) + 5}" font-size="13" text-anchor="end" fill="#5F6679">${v}</text>`).join('')}
    <polyline points="${pts}" fill="none" stroke="#14213D" stroke-width="2.4"/>
    <line x1="${X(13.5)}" x2="${X(13.5)}" y1="26" y2="${B}" stroke="#8F4505" stroke-width="2" stroke-dasharray="5 5"/>
    <text x="${X(13.5) + 8}" y="22" font-size="13" fill="#8F4505" font-weight="700">Started berberine (patient-reported)</text>
    <text x="${L}" y="${H - 6}" font-size="13" fill="#5F6679">Daily mean glucose, mg/dL, 28 days</text>
  </svg>`;
}
function reveals() {
  const check = () => {
    const pending = [...document.querySelectorAll('.reveal:not(.in)')];
    let n = 0;
    pending.forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) { e.style.transitionDelay = `${Math.min(n++, 6) * 75}ms`; e.classList.add('in'); }
    });
  };
  let raf = 0;
  const on = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; check(); }); };
  const demoVis = () => {
    const r = $('#demo').getBoundingClientRect();
    document.body.classList.toggle('in-demo', r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4);
    const b = $('.demo-bar').getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    document.body.classList.toggle('hide-top', !isMobile() && b.top < 100 && s.bottom > 160);
  };
  addEventListener('scroll', () => { on(); demoVis(); }, { passive: true }); addEventListener('resize', on); check(); demoVis();
  setTimeout(check, 300);
}

/* ================= INIT ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  e.preventDefault(); act(el.dataset.act, el.dataset);
});
document.addEventListener('keydown', e => {
  if (/TEXTAREA|INPUT|SELECT/.test(e.target.tagName)) return;
  if (MODE !== 'guided') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); guideNext(); }
  else if (e.key === 'ArrowLeft' && GI > 0) { e.preventDefault(); guideGo(GI - 1); }
});

$('#pathsel').addEventListener('change', e => { const v = e.target.value; e.target.value = ''; if (v) runPath(v); });
addEventListener('resize', placeCoach);
addEventListener('load', placeCoach);

S = fresh('berberine');
renderRefs(); reveals();
const m = location.hash.match(/step=(\d+)/);
if (m) { guideGo(+m[1]); } else { GI = 0; render(); }
})();
