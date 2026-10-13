// Knowledge base content (English source). Translated at runtime via the site language.
export type KbSection = {
  id: string;
  title: string;
  summary: string;
  law: string;
  points: { title: string; body: string }[];
  ask: string;
};

export const KNOWLEDGE: KbSection[] = [
  {
    id: "rti",
    title: "Right to Information (RTI)",
    summary: "Any Indian citizen can ask a government office for information it holds, without giving a reason.",
    law: "Right to Information Act, 2005",
    points: [
      { title: "Who to write to", body: "Address your application to the Public Information Officer (PIO) of the office that holds the information. Central government offices also accept online RTI at rtionline.gov.in." },
      { title: "Fee", body: "Usually Rs 10 for central offices, paid by IPO, demand draft, cash or online. People below the poverty line (BPL) pay no fee if they attach proof." },
      { title: "Time limit", body: "The PIO must reply within 30 days, or within 48 hours if the information concerns someone's life or liberty." },
      { title: "First appeal", body: "If you get no reply or an unsatisfactory one, file a first appeal with the First Appellate Authority in the same office within 30 days." },
      { title: "Second appeal", body: "If the first appeal fails, approach the State or Central Information Commission within 90 days." },
    ],
    ask: "Help me write an RTI application step by step.",
  },
  {
    id: "fir",
    title: "First Information Report (FIR)",
    summary: "An FIR is the first written record of a cognizable offence. It starts the police investigation.",
    law: "Section 173, Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
    points: [
      { title: "Any police station", body: "You can file a Zero FIR at any police station, whatever the place of the crime. It will be transferred to the correct station." },
      { title: "Free copy", body: "You have the right to a free copy of the FIR. Read it before signing to make sure it records what you said." },
      { title: "e-FIR", body: "Many states let you file an FIR online, especially for theft and cyber crime. You must sign it at the station within 3 days." },
      { title: "If police refuse", body: "Send your complaint in writing to the Superintendent of Police. If still not registered, apply to the Judicial Magistrate under Section 175(3) BNSS." },
      { title: "False complaints", body: "Giving false information to police is itself an offence. Describe only what you know to be true." },
    ],
    ask: "How do I file an FIR, and what if the police refuse?",
  },
  {
    id: "bail",
    title: "Bail",
    summary: "Bail is temporary release of an accused person while the case continues, usually on a promise to appear in court.",
    law: "Sections 478–483, BNSS, 2023",
    points: [
      { title: "Bailable offences", body: "For bailable offences, bail is a right. The police or court must release you once you furnish the bail bond." },
      { title: "Non-bailable offences", body: "For non-bailable offences, bail is at the court's discretion. The court looks at the seriousness of the offence, evidence and risk of flight." },
      { title: "Anticipatory bail", body: "If you fear arrest for a non-bailable offence, you can apply to the Sessions Court or High Court for anticipatory bail before arrest." },
      { title: "Default bail", body: "If police do not file the chargesheet within 60 or 90 days (depending on the offence), you can claim default bail." },
      { title: "Undertrials", body: "An undertrial who has spent half of the maximum sentence in custody (one-third for first-time offenders) can be released on bail, except in some serious offences." },
    ],
    ask: "Explain how bail works and how to apply for anticipatory bail.",
  },
  {
    id: "detention",
    title: "Rights on arrest and detention",
    summary: "Even when arrested, you keep important constitutional rights. Police must follow strict rules.",
    law: "Articles 20, 21 and 22 of the Constitution; Sections 35–58, BNSS; D.K. Basu guidelines",
    points: [
      { title: "Reason for arrest", body: "You must be told the grounds of arrest, and whether the offence is bailable." },
      { title: "Inform someone", body: "Police must inform a relative or friend of your arrest and where you are held." },
      { title: "Lawyer", body: "You can meet a lawyer of your choice during interrogation, though not throughout it." },
      { title: "24-hour rule", body: "You must be produced before a magistrate within 24 hours of arrest, excluding travel time." },
      { title: "Women", body: "Women are generally not arrested after sunset or before sunrise, and only by or in the presence of a woman officer." },
      { title: "No torture", body: "Custodial violence is illegal. You have the right to a medical examination and can complain to the magistrate." },
    ],
    ask: "What are my rights if the police detain or arrest me?",
  },
  {
    id: "legal-aid",
    title: "Free legal aid",
    summary: "Free legal services, including a lawyer and court fees, are available to many people who cannot afford them.",
    law: "Article 39A of the Constitution; Legal Services Authorities Act, 1987",
    points: [
      { title: "Who is eligible", body: "Women, children, SC/ST members, industrial workers, people with disabilities, victims of trafficking or disaster, people in custody, and those below the state's income limit." },
      { title: "Where to go", body: "Visit the District Legal Services Authority (DLSA) at your district court, or the Taluk Legal Services Committee." },
      { title: "Helpline", body: "Call NALSA's national helpline 15100, or apply online at nalsa.gov.in." },
      { title: "What you get", body: "A free lawyer, drafting of documents, payment of court fees, and advice. Lok Adalats also settle disputes free of cost." },
    ],
    ask: "Am I eligible for free legal aid and how do I apply?",
  },
];
