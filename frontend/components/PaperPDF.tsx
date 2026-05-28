'use client';
import {
  Document, Page, Text, View, StyleSheet, pdf, Font,
} from '@react-pdf/renderer';
import { QuestionPaper } from '@/store/assignmentStore';

const difficultyLabel: Record<string, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Challenging',
};

const difficultyColor: Record<string, string> = {
  easy: '#16a34a',
  medium: '#ca8a04',
  hard: '#dc2626',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 50,
    color: '#1a1a1a',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  schoolName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  subHeader: { fontSize: 11, marginBottom: 2 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 10,
  },
  notice: { fontSize: 9, fontStyle: 'italic', marginBottom: 10, color: '#555' },
  studentInfo: { marginBottom: 14 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    fontSize: 10,
  },
  underline: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    marginLeft: 4,
    height: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 14,
  },
  sectionType: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  sectionInstruction: { fontSize: 9, fontStyle: 'italic', color: '#555', marginBottom: 8 },
  questionRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 4,
  },
  questionNum: { fontSize: 10, width: 18, flexShrink: 0, fontFamily: 'Helvetica-Bold' },
  questionBody: { flex: 1 },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  diffBadge: {
    fontSize: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'Helvetica-Bold',
  },
  marks: { fontSize: 9, color: '#555' },
  questionText: { fontSize: 10, lineHeight: 1.5 },
  answerBox: {
    marginTop: 4,
    paddingLeft: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#16a34a',
    backgroundColor: '#f0fdf4',
    padding: 4,
    fontSize: 9,
    color: '#374151',
  },
  endText: {
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  answerKeyTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 20,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  answerItem: { marginBottom: 8, fontSize: 10 },
  answerNum: { fontFamily: 'Helvetica-Bold' },
});

function PaperDocument({ paper, showAnswers }: { paper: QuestionPaper; showAnswers: boolean }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{paper.schoolName}</Text>
          <Text style={styles.subHeader}>Subject: {paper.subject}</Text>
          <Text style={styles.subHeader}>Class: {paper.className}</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text>Time Allowed: {paper.timeAllowed}</Text>
          <Text>Maximum Marks: {paper.maxMarks}</Text>
        </View>

        <Text style={styles.notice}>All questions are compulsory unless stated otherwise.</Text>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <View style={styles.studentRow}>
            <Text>Name: </Text><View style={styles.underline} />
          </View>
          <View style={styles.studentRow}>
            <Text>Roll Number: </Text><View style={styles.underline} />
          </View>
          <View style={styles.studentRow}>
            <Text>Class: {paper.className}  Section: </Text><View style={styles.underline} />
          </View>
        </View>

        {/* Sections */}
        {paper.sections.map((section, si) => (
          <View key={si}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionType}>{section.questionType}</Text>
            <Text style={styles.sectionInstruction}>{section.instruction}</Text>

            {section.questions.map((q, qi) => {
              const color = difficultyColor[q.difficulty] || difficultyColor.medium;
              const label = difficultyLabel[q.difficulty] || 'Moderate';
              return (
                <View key={qi} style={styles.questionRow}>
                  <Text style={styles.questionNum}>{q.number}.</Text>
                  <View style={styles.questionBody}>
                    <View style={styles.questionMeta}>
                      <Text style={[styles.diffBadge, { color, backgroundColor: `${color}18` }]}>
                        {label}
                      </Text>
                      <Text style={styles.marks}>[{q.marks} Marks]</Text>
                    </View>
                    <Text style={styles.questionText}>{q.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.endText}>End of Question Paper</Text>

        {/* Answer Key */}
        {showAnswers && (
          <View>
            <Text style={styles.answerKeyTitle}>Answer Key:</Text>
            {paper.sections.flatMap((s) => s.questions).map((q, i) => (
              q.answer ? (
                <View key={i} style={styles.answerItem}>
                  <Text><Text style={styles.answerNum}>{q.number}. </Text>{q.answer}</Text>
                </View>
              ) : null
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function downloadPaperAsPDF(paper: QuestionPaper, showAnswers: boolean) {
  const blob = await pdf(<PaperDocument paper={paper} showAnswers={showAnswers} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${paper.subject || 'question-paper'}-${paper.className || ''}.pdf`.replace(/\s+/g, '-');
  a.click();
  URL.revokeObjectURL(url);
}
