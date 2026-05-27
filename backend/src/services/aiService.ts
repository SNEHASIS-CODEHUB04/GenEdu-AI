import Groq from 'groq-sdk';
import { IQuestionType } from '../models/Assignment';

let _client: Groq | null = null;
function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

export interface GeneratedQuestion {
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  answer: string;
}

export interface GeneratedSection {
  title: string;
  instruction: string;
  questionType: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: GeneratedSection[];
}

// Per-type instructions so the AI knows exactly what each question type means
const QUESTION_TYPE_GUIDANCE: Record<string, string> = {
  'Multiple Choice Questions': 'Write a question stem followed by 4 options (A, B, C, D). The question text must include the options inline like: "Which of the following...? A) ... B) ... C) ... D) ..."',
  'Short Questions': 'Write short-answer questions that require 2-4 sentence answers. Focus on definitions, explanations, or comparisons directly from the topic.',
  'Long Questions': 'Write detailed essay-style questions requiring 8-12 sentence answers. Ask students to explain, analyze, or evaluate concepts from the topic.',
  'Diagram/Graph-Based Questions': 'Write questions that ask students to DRAW, LABEL, or INTERPRET a specific diagram, graph, or chart related to the topic. Examples: "Draw and label the diagram of...", "Interpret the given graph showing...", "Sketch the life cycle of..."',
  'Numerical Problems': 'Write calculation-based problems with specific numbers that require mathematical steps to solve. Include units. Examples: "Calculate the speed if...", "Find the resistance when...", "A train travels X km in Y hours, find..."',
  'Fill in the Blanks': 'Write sentences with one key term missing, indicated by a blank line. The answer should be a single word or short phrase.',
  'True/False': 'Write statements that are clearly either true or false based on the topic. The answer must be "True" or "False" with a brief justification.',
  'Match the Following': 'Write a matching exercise with Column A (5 terms) and Column B (5 definitions/descriptions). Format as: "Match Column A with Column B: Column A: 1. [term] 2. [term]... Column B: a. [def] b. [def]..."',
};

function getTypeGuidance(type: string): string {
  // Fuzzy match
  for (const [key, val] of Object.entries(QUESTION_TYPE_GUIDANCE)) {
    if (type.toLowerCase().includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return 'Write appropriate questions for this type based on the topic.';
}

function buildPrompt(
  questionTypes: IQuestionType[],
  additionalInstructions: string,
  fileText?: string
): string {
  const totalMarks = questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);
  const sectionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const totalTime = Math.max(30, Math.round(totalMarks * 1.5));

  // Build section specs with type-specific guidance
  const sectionsSpec = questionTypes.map((qt, i) => {
    const guidance = getTypeGuidance(qt.type);
    return `Section ${sectionLabels[i]} — "${qt.type}" (${qt.count} questions × ${qt.marks} marks each):
  HOW TO WRITE THIS TYPE: ${guidance}`;
  }).join('\n\n');

  // If we have document content, make it the MANDATORY topic source
  const topicBlock = fileText && fileText.trim().length > 100
    ? `MANDATORY: All questions MUST be based ONLY on the following document content. Do NOT use any outside knowledge. Extract topics, concepts, terms, and data directly from this text:
---BEGIN DOCUMENT---
${fileText.slice(0, 4000)}
---END DOCUMENT---`
    : `No document provided. Generate questions on a relevant academic topic based on the assignment title and additional instructions.`;

  // Infer subject/class from content or instructions
  const inferHint = additionalInstructions
    ? `Additional context from teacher: ${additionalInstructions}`
    : '';

  return `You are an expert exam paper setter for school students.

${topicBlock}

${inferHint}

Create a question paper with EXACTLY these sections:
${sectionsSpec}

STRICT RULES:
1. Every question MUST be directly based on the document content above (if provided)
2. Each question type MUST follow its specific format described above
3. Numerical problems MUST have actual numbers and require calculation
4. Diagram questions MUST ask to draw/label/interpret a specific diagram
5. MCQ questions MUST include 4 options (A, B, C, D) in the question text
6. difficulty values must be EXACTLY one of: "easy", "medium", "hard"
7. Distribute difficulty per section: ~40% easy, ~40% medium, ~20% hard
8. Each answer must be a complete, correct answer for that question
9. Infer subject name and class from the document content

Respond ONLY with this exact JSON structure (no extra text):
{
  "subject": "<inferred from document>",
  "className": "<inferred from document or instructions>",
  "timeAllowed": "${totalTime} minutes",
  "maxMarks": ${totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questionType": "<exact type name>",
      "questions": [
        {
          "number": 1,
          "text": "<full question text>",
          "difficulty": "easy",
          "marks": <marks per question>,
          "answer": "<complete answer>"
        }
      ]
    }
  ]
}`;
}

export async function generateQuestionPaper(
  questionTypes: IQuestionType[],
  additionalInstructions: string,
  fileText?: string
): Promise<GeneratedPaper> {
  const prompt = buildPrompt(questionTypes, additionalInstructions, fileText);

  const response = await getClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are an expert exam paper setter. You always respond with valid JSON only. You strictly follow the document content provided and never make up topics not present in the document.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4, // Lower = more faithful to instructions
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const parsed = JSON.parse(content) as GeneratedPaper;

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid AI response structure');
  }

  const sectionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Enforce correct section structure and question counts
  parsed.sections = parsed.sections.map((section, i) => {
    const expectedType = questionTypes[i];
    const marksEach = expectedType?.marks ?? section.questions?.[0]?.marks ?? 1;

    return {
      ...section,
      title: `Section ${sectionLabels[i]}`,
      instruction: section.instruction || `Attempt all questions. Each question carries ${marksEach} mark${marksEach > 1 ? 's' : ''}.`,
      questionType: expectedType?.type || section.questionType,
      questions: (section.questions || []).map((q, qi) => ({
        ...q,
        number: qi + 1,
        marks: marksEach,
        difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty)
          ? q.difficulty
          : 'medium') as 'easy' | 'medium' | 'hard',
      })),
    };
  });

  return parsed;
}
