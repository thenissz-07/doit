
import { DayPlan } from './types';

export const CURRICULUM: DayPlan[] = [
  {
    day: 1,
    week: 1,
    title: "Present Perfect vs. Past Simple",
    focus: "Grammar Foundations",
    lessons: [
      { id: '1-1', title: 'Life Experiences', description: 'Using "have you ever" to discuss travel.', type: 'grammar', completed: false, content: 'Focus on "ever", "never", and past participles.' },
      { id: '1-2', title: 'Specific Times', description: 'Switching to Past Simple for specific dates.', type: 'grammar', completed: false, content: 'Contrasting "yesterday" with "recently".' }
    ]
  },
  {
    day: 2,
    week: 1,
    title: "Travel & Transportation",
    focus: "B1 Vocabulary",
    lessons: [
      { id: '2-1', title: 'Airport & Security', description: 'Vocabulary for international travel.', type: 'vocabulary', completed: false, content: 'Boarding pass, customs, gate, delay, departure.' },
      { id: '2-2', title: 'Booking a Hotel', description: 'Roleplay: Making reservations.', type: 'speaking', completed: false, content: 'Asking for amenities and prices.' }
    ]
  },
  {
    day: 3,
    week: 1,
    title: "Health & Medicine (Part 1)",
    focus: "B1 Medical Vocabulary",
    lessons: [
      { id: '3-1', title: 'At the Doctor', description: 'Describing symptoms and body parts.', type: 'vocabulary', completed: false, content: 'Ache, pain, symptom, swollen, prescription, dizzy.' }
    ]
  },
  {
    day: 4,
    week: 1,
    title: "Medicine & First Aid",
    focus: "Giving Instructions",
    lessons: [
      { id: '4-1', title: 'Medical Advice', description: 'Using imperatives and modals to give health advice.', type: 'grammar', completed: false, content: 'You should take this twice a day.' }
    ]
  }
];

export const INITIAL_SYSTEM_INSTRUCTION = `You are an expert English Language Tutor specializing in the CEFR B1 level. 
Your goal is to help a student transition from A2 to B1.
Guidelines:
1. Use intermediate level English (B1 level vocabulary).
2. If the user makes a significant grammatical error, gently correct them at the end of your response.
3. Be encouraging and conversational.
4. CURRENT FOCUS: Medicine and Health. Encourage the use of medical terms like "appointment", "symptoms", "pharmacist", and "treatment".
5. Focus topics: Daily routines, health, travel, work, and environment.`;
