// FAKE test data only — no real people.
import { resumeRequestSchema, sopRequestSchema } from "@/lib/schemas";

export const FAKE_RESUME_TEXT = `Aarav Testperson
Email: aarav.test@example.com | Phone: +00 00000 00000
EDUCATION
B.Tech Computer Science, Example Institute of Technology, 2022–2026, CGPA 8.4/10
PROJECTS
Built a movie recommendation system using collaborative filtering in Python
Developed a campus event app used by students in my college
EXPERIENCE
Software intern at Example Labs Pvt Ltd, worked on data pipelines for reporting
ACHIEVEMENTS
Finalist in a national-level college hackathon organised by Example Foundation
Volunteer teacher teaching basic coding to school children on weekends`;

export const FAKE_SOP_TEXT = `Ever since I was a child, I have always been passionate about computers and technology.

During my final-year project, I built a recommendation engine that served 3,000 test users. This taught me how data shapes decisions.

I am a hard-working and dedicated student. Mistakes were made in my early projects, but I learned from them.

I want to join this program because it is one of the best in the world and it will help me achieve my dreams.`;

export const resumeRequest = resumeRequestSchema.parse({
  country: "Germany",
  university: "Example Technical University",
  level: "Postgraduate (Master's)",
  course: "Data Science",
  funding: "I need a partial scholarship",
  academics: { curriculum: "", grade: "8.4/10 CGPA", tests: { IELTS: "7.5" }, intake: "Winter 2027" },
  documentText: FAKE_RESUME_TEXT,
});

export const sopRequest = sopRequestSchema.parse({
  docType: "SOP",
  wordLimit: 1000,
  country: "Germany",
  university: "Example Technical University",
  level: "Postgraduate (Master's)",
  course: "Data Science",
  essayText: FAKE_SOP_TEXT,
  resumeText: FAKE_RESUME_TEXT,
});
