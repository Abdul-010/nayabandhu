export const DISCLAIMER =
  "This information is educational and not a substitute for professional legal advice.";

export const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Kannada", label: "ಕನ್ನಡ" },
  { code: "Hindi", label: "हिन्दी" },
  { code: "Tamil", label: "தமிழ்" },
  { code: "Telugu", label: "తెలుగు" },
  { code: "Malayalam", label: "മലയാളം" },
] as const;

export const TOPICS = [
  { title: "Rights Awareness", prompt: "What are my basic fundamental rights as an Indian citizen?" },
  { title: "Consumer Rights", prompt: "A shop sold me a defective product and refuses a refund. What can I do?" },
  { title: "Tenant Disputes", prompt: "My landlord is refusing to return my security deposit. What are my options?" },
  { title: "Cyber Crime", prompt: "Someone stole money from my bank account through an online fraud. What should I do?" },
  { title: "Women Safety", prompt: "What legal protections exist for women facing harassment at the workplace?" },
  { title: "FIR Assistance", prompt: "How do I file an FIR, and what if the police refuse to register it?" },
  { title: "RTI Assistance", prompt: "How do I file an RTI application to get information from a government office?" },
  { title: "Legal Guidance", prompt: "Where can I get free legal aid in India?" },
];

export const HELPLINES = [
  { number: "112", name: "National Emergency", note: "Police, fire, ambulance — anywhere in India" },
  { number: "1091", name: "Women Helpline", note: "Harassment, violence or distress" },
  { number: "181", name: "Women in Distress", note: "24×7 support and referral" },
  { number: "1930", name: "Cyber Crime", note: "Report online financial fraud fast" },
  { number: "1098", name: "Childline", note: "Children in need of care or protection" },
  { number: "15100", name: "Legal Aid (NALSA)", note: "Free legal services helpline" },
];

export const EMERGENCY_RIGHTS = [
  { title: "Right to know the grounds of arrest", body: "Police must tell you why you are being arrested (Article 22, Constitution; Section 47 BNSS)." },
  { title: "Right to inform a relative", body: "You can have a friend or family member told about your arrest and where you are held." },
  { title: "Right to a lawyer", body: "You may consult a lawyer of your choice. If you cannot afford one, free legal aid is your right." },
  { title: "Produced before a magistrate within 24 hours", body: "You cannot be held in police custody beyond 24 hours without a magistrate's order." },
  { title: "Zero FIR", body: "Any police station must register an FIR for a cognizable offence, no matter where it happened." },
  { title: "Women and arrest", body: "A woman generally cannot be arrested after sunset and before sunrise, except in exceptional cases with a magistrate's permission, and only by a woman officer." },
  { title: "Right to remain silent", body: "You cannot be forced to be a witness against yourself (Article 20(3))." },
  { title: "Free medical examination", body: "An arrested person has the right to be medically examined." },
];
