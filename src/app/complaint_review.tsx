import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Configured in .env (see .env.example). Falls back to localhost for
// emulators and simulators.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api';

type FollowUpQuestion = {
  id: string;
  question: string;
  required: boolean;
};

type ComplaintAnalysis = {
  category: string;
  issue_summary: string;
  questions: FollowUpQuestion[];
  missing_information: string[];
};

type ComplaintDraft = {
  category: string;
  issue_summary: string;
  location: string;
  duration: string;
  urgency: string;
  missing_information: string[];
  citizen_questions: string[];
  email_subject: string;
  email_body: string;
  requires_citizen_review: boolean;
};

export default function ComplaintReviewScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    complaint?: string;
    language?: string;
  }>();

  const complaint = Array.isArray(params.complaint)
    ? params.complaint[0]
    : params.complaint || '';

  const language = Array.isArray(params.language)
    ? params.language[0]
    : params.language || 'English';

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [analysis, setAnalysis] = useState<ComplaintAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [draft, setDraft] = useState<ComplaintDraft | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!complaint.trim()) {
      setAnalysisError('No complaint description was received.');
      return;
    }

    try {
      setLoadingAnalysis(true);
      setAnalysisError('');
      setAnalysis(null);
      setDraft(null);
      setAnswers({});

      const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint_text: complaint.trim(),
          language,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to analyse the complaint.'
        );
      }

      if (!result.data) {
        throw new Error('The AI returned an empty analysis.');
      }

      setAnalysis(result.data);
    } catch (error) {
      console.error('Complaint analysis error:', error);

      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoadingAnalysis(false);
    }
  }, [complaint, language]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await Promise.resolve();

      if (!cancelled) {
        await runAnalysis();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [runAnalysis]);

  const setAnswer = (id: string, value: string) => {
    setAnswers(previous => ({
      ...previous,
      [id]: value,
    }));
  };

  const handleGenerate = async () => {
    if (!complaint.trim()) {
      Alert.alert(
        'Complaint required',
        'Please enter your complaint before continuing.'
      );
      return;
    }

    if (!analysis) {
      Alert.alert(
        'Analysis required',
        'Wait for the analysis to finish before generating the draft.'
      );
      return;
    }

    if (generating) {
      return;
    }

    const missingAnswer = analysis.questions.find(
      item => item.required && !(answers[item.id] || '').trim()
    );

    if (missingAnswer) {
      Alert.alert(
        'Answer required',
        missingAnswer.question
      );
      return;
    }

    try {
      setGenerating(true);
      setDraft(null);

      const payload = {
        complaint_text: complaint.trim(),
        language,
        category: analysis.category,
        answers: analysis.questions
          .map(item => ({
            id: item.id,
            question: item.question,
            answer: (answers[item.id] || '').trim(),
          }))
          .filter(item => item.answer),
      };

      const response = await fetch(
        `${API_BASE_URL}/ai/generate-complaint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to generate the complaint draft.'
        );
      }

      if (!result.data) {
        throw new Error('The AI returned an empty complaint report.');
      }

      setDraft(result.data);

      Alert.alert(
        'Draft ready',
        'Your complaint draft has been generated. Please review it below.'
      );
    } catch (error) {
      console.error('Complaint generation error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';

      Alert.alert(
        'Generation failed',
        `${message}\n\nPlease check your internet connection and backend server.`
      );
    } finally {
      setGenerating(false);
    }
  };

  const questions = analysis?.questions || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.brand}>ResolveAI</Text>
            <Text style={styles.subtitle}>Complaint details</Text>
          </View>
        </View>

        <Text style={styles.stepLabel}>
          STEP 02 · REVIEW YOUR DETAILS
        </Text>

        <Text style={styles.title}>
          Let&apos;s understand your problem better.
        </Text>

        <Text style={styles.description}>
          ResolveAI reviews what you described and asks only for the
          mandatory details that are still missing.
        </Text>

        <View style={styles.originalCard}>
          <Text style={styles.cardLabel}>YOUR ORIGINAL COMPLAINT</Text>

          <Text style={styles.originalText}>
            {complaint || 'No complaint description was received.'}
          </Text>

          <Text style={styles.languageText}>
            Input language: {language}
          </Text>
        </View>

        {loadingAnalysis && (
          <View style={styles.statusCard}>
            <ActivityIndicator color="#6849CA" size="large" />

            <Text style={styles.statusTitle}>
              Reviewing your complaint...
            </Text>

            <Text style={styles.statusText}>
              Identifying the mandatory details that are still missing.
            </Text>
          </View>
        )}

        {!loadingAnalysis && analysisError !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Unable to analyse your complaint
            </Text>

            <Text style={styles.errorText}>{analysisError}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => {
                void runAnalysis();
              }}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {!loadingAnalysis && !analysisError && analysis && (
          <View style={styles.questionsSection}>
            <Text style={styles.sectionTitle}>
              {questions.length > 0
                ? 'A few more details'
                : 'No additional details needed'}
            </Text>

            <Text style={styles.helperText}>
              {questions.length > 0
                ? 'Answer the questions below. Fields marked * are mandatory.'
                : 'Your complaint already contains the mandatory details. Continue to generate the draft.'}
            </Text>

            {questions.map(item => {
              const value = answers[item.id] || '';
              const missing =
                item.required && !value.trim() && !generating;

              return (
                <View key={item.id} style={styles.questionBlock}>
                  <Text style={styles.fieldLabel}>
                    {item.question}
                    {item.required ? ' *' : ''}
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      missing && styles.inputMissing,
                    ]}
                    placeholder="Type your answer"
                    placeholderTextColor="#9994AA"
                    value={value}
                    onChangeText={text => setAnswer(item.id, text)}
                    editable={!generating}
                  />
                </View>
              );
            })}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What happens next?</Text>

              <Text style={styles.infoText}>
                ResolveAI prepares a formal complaint draft from your
                answers. You can review and correct it before using it.
                No email is sent automatically.
              </Text>
            </View>

            <Pressable
              style={[
                styles.continueButton,
                generating && styles.disabledButton,
              ]}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.buttonText}>
                    Preparing your draft...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {draft
                      ? 'Regenerate complaint draft'
                      : 'Generate complaint draft'}
                  </Text>
                  <Text style={styles.buttonArrow}>→</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {draft && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultHeading}>
              AI Complaint Analysis
            </Text>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>PREDICTED CATEGORY</Text>
              <Text style={styles.resultValue}>
                {draft.category}
              </Text>

              <Text style={styles.resultLabel}>ISSUE SUMMARY</Text>
              <Text style={styles.resultText}>
                {draft.issue_summary}
              </Text>

              <Text style={styles.resultLabel}>LOCATION</Text>
              <Text style={styles.resultText}>
                {draft.location || 'Not provided'}
              </Text>

              <Text style={styles.resultLabel}>DURATION</Text>
              <Text style={styles.resultText}>
                {draft.duration || 'Not provided'}
              </Text>

              <Text style={styles.resultLabel}>URGENCY ASSESSMENT</Text>
              <Text style={styles.resultValue}>
                {draft.urgency}
              </Text>

              <Text style={styles.resultLabel}>EMAIL SUBJECT</Text>
              <Text style={styles.resultText}>
                {draft.email_subject}
              </Text>

              <Text style={styles.resultLabel}>GENERATED COMPLAINT</Text>
              <Text style={styles.emailBody}>
                {draft.email_body}
              </Text>

              {draft.missing_information?.length > 0 && (
                <>
                  <Text style={styles.resultLabel}>
                    MISSING INFORMATION
                  </Text>

                  {draft.missing_information.map((item, index) => (
                    <Text key={index} style={styles.listItem}>
                      • {item}
                    </Text>
                  ))}
                </>
              )}

              {draft.citizen_questions?.length > 0 && (
                <>
                  <Text style={styles.resultLabel}>
                    PLEASE PROVIDE THESE DETAILS
                  </Text>

                  {draft.citizen_questions.map((item, index) => (
                    <Text key={index} style={styles.listItem}>
                      {index + 1}. {item}
                    </Text>
                  ))}
                </>
              )}

              <View style={styles.reviewNotice}>
                <Text style={styles.reviewNoticeText}>
                  This is an AI-generated draft. Please verify all
                  information before using it. No email has been sent.
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Your information should remain under your control.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  container: {
    padding: 22,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  backText: {
    color: '#5B3CC4',
    fontSize: 32,
    lineHeight: 36,
  },
  brand: {
    color: '#4F35B5',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#77758B',
    fontSize: 12,
    marginTop: 2,
  },
  stepLabel: {
    color: '#7355D8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  title: {
    color: '#25213B',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
  },
  description: {
    color: '#77758B',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 22,
  },
  originalCard: {
    backgroundColor: '#F0EDFF',
    borderColor: '#DED6FF',
    borderWidth: 1,
    borderRadius: 16,
    padding: 17,
    marginBottom: 27,
  },
  cardLabel: {
    color: '#7658C9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  originalText: {
    color: '#38324F',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  languageText: {
    color: '#81799B',
    fontSize: 11,
    marginTop: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEAF5',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    color: '#302B46',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  statusText: {
    color: '#858197',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3D2D2',
    padding: 18,
  },
  errorTitle: {
    color: '#9B2C2C',
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: '#8A4B4B',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#6849CA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  questionsSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#302B46',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  helperText: {
    color: '#858197',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  questionBlock: {
    marginTop: 16,
  },
  fieldLabel: {
    color: '#39344F',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1F0',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#302B46',
    fontSize: 13,
  },
  inputMissing: {
    borderColor: '#E0A3A3',
    backgroundColor: '#FFFBFB',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEAF5',
    marginTop: 22,
  },
  infoTitle: {
    color: '#4F35B5',
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: '#77758B',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: '#6849CA',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 22,
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 19,
    marginLeft: 9,
  },
  resultContainer: {
    marginTop: 28,
  },
  resultHeading: {
    color: '#302B46',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 14,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E1F0',
    padding: 17,
  },
  resultLabel: {
    color: '#7658C9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 17,
    marginBottom: 7,
  },
  resultValue: {
    color: '#302B46',
    fontSize: 16,
    fontWeight: '800',
  },
  resultText: {
    color: '#48435C',
    fontSize: 13,
    lineHeight: 21,
  },
  emailBody: {
    color: '#38324F',
    fontSize: 13,
    lineHeight: 23,
    backgroundColor: '#F8F7FF',
    padding: 13,
    borderRadius: 10,
  },
  listItem: {
    color: '#48435C',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 7,
  },
  reviewNotice: {
    backgroundColor: '#F0EDFF',
    padding: 13,
    borderRadius: 10,
    marginTop: 20,
  },
  reviewNoticeText: {
    color: '#5B478D',
    fontSize: 12,
    lineHeight: 19,
  },
  footer: {
    color: '#A29DB2',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 22,
  },
});