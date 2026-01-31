
import { DayPlan, Level } from './types';

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
      { id: '2-1', title: 'Airport & Security', description: 'Vocabulary for international travel.', type: 'vocabulary', completed: false, content: 'Boarding pass, customs, gate, delay, departure.' }
    ]
  },
  {
    day: 3,
    week: 1,
    title: "Health & Medicine (Part 1)",
    focus: "Medical Vocabulary",
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

export const INITIAL_SYSTEM_INSTRUCTION = `You are an expert English Language Tutor. Your goal is to help a student improve their proficiency from A2 to B1 level. 
CURRENT FOCUS: Medicine and Health. Encourage the use of medical terms like "appointment", "symptoms", "pharmacist", and "treatment".
Be encouraging, patient, and provide specific corrections for grammar mistakes at the end of your responses.`;

export const getSystemInstruction = (level: Level): string => {
  const base = `You are an expert English Language Tutor. Your goal is to help a student improve their proficiency. 
  CURRENT FOCUS: Medicine and Health. Encourage the use of medical terms like "appointment", "symptoms", "pharmacist", and "treatment".`;
  
  const levelSpecific = {
    'Beginner': `Target Level: Beginner (A1/A2). Use very simple English, short sentences, and basic vocabulary. Focus on high-frequency words. If they make an error, provide a very simple correction.`,
    'Intermediate': `Target Level: Intermediate (B1). Use standard conversational English. Encourage the use of connectors and more descriptive adjectives. Correct common grammar mistakes at the end of responses.`,
    'Advanced': `Target Level: Advanced (C1/C2). Use sophisticated vocabulary, idioms, and complex sentence structures. Challenge the user with nuanced medical topics and professional jargon. Provide high-level stylistic feedback.`
  };

  return `${base}\n${levelSpecific[level] || levelSpecific['Intermediate']}`;
};
