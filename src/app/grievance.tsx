
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type InputMethod = 'text' | 'voice' | 'sign';
type Language = 'English' | 'தமிழ்' | 'हिन्दी';

// Configured in .env (see .env.example). Falls back to localhost for
// emulators and simulators.
const AI_BASE_URL =
  process.env.EXPO_PUBLIC_AI_BASE_URL || 'http://127.0.0.1:8000';

const getApiLanguage = (language: Language) => {
  if (language === 'தமிழ்') return 'Tamil';
  if (language === 'हिन्दी') return 'Hindi';
  return 'English';
};

export default function GrievanceScreen() {
  const router = useRouter();

  const [selectedMethod, setSelectedMethod] =
    useState<InputMethod>('text');

  const [language, setLanguage] = useState<Language>('English');
  const [complaint, setComplaint] = useState('');
  const [transcribing, setTranscribing] = useState(false);

  const audioRecorder = useAudioRecorder(
    RecordingPresets.HIGH_QUALITY
  );

  const recorderState = useAudioRecorderState(audioRecorder);

  const handleContinue = () => {
    if (!complaint.trim()) {
      Alert.alert(
        'Complaint required',
        'Please describe your problem before continuing.'
      );
      return;
    }

    router.push({
      pathname: '/complaint_review',
      params: {
        complaint: complaint.trim(),
        language: getApiLanguage(language),
      },
    });
  };

  const handleStartRecording = async () => {
    try {
      if (transcribing) return;

      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Microphone permission required',
          'Please allow microphone access in your phone settings to record your complaint.'
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

    } catch (error) {
      console.error('Recording start error:', error);

      Alert.alert(
        'Unable to start recording',
        'Please check microphone permission and try again.'
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      await audioRecorder.stop();

      const audioUri = audioRecorder.uri;

      if (!audioUri) {
        Alert.alert(
          'Recording unavailable',
          'The recording could not be found. Please record again.'
        );
        return;
      }

      await uploadRecording(audioUri);

    } catch (error) {
      console.error('Recording stop error:', error);

      Alert.alert(
        'Recording error',
        'Unable to finish the recording. Please try again.'
      );
    }
  };

  const uploadRecording = async (audioUri: string) => {
    try {
      setTranscribing(true);
      setComplaint('');

      let result: any;

      if (Platform.OS === 'web') {
        const audioBlob = await (await fetch(audioUri)).blob();
        const formData = new FormData();
        formData.append('file', audioBlob, 'resolveai-voice.m4a');
        formData.append('language', getApiLanguage(language));

        const response = await fetch(`${AI_BASE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        });

        result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(
            result.detail || result.message || 'Unable to transcribe your recording.'
          );
        }
      } else {
        const uploadResponse = await FileSystem.uploadAsync(
          `${AI_BASE_URL}/transcribe`,
          audioUri,
          {
            fieldName: 'file',
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            parameters: {
              language: getApiLanguage(language),
            },
          }
        );

        result = JSON.parse(uploadResponse.body);
        if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
          throw new Error(
            result.detail || result.message || 'Unable to transcribe your recording.'
          );
        }
      }

      if (!result.success) {
        throw new Error(
          result.detail ||
          result.message ||
          'Unable to transcribe your recording.'
        );
      }

      if (!result.transcript || !result.transcript.trim()) {
        throw new Error('No speech was detected in your recording.');
      }

      setComplaint(result.transcript.trim());

      Alert.alert(
        'Transcription completed',
        'Your speech has been converted into text. Please review and correct it before continuing.'
      );

    } catch (error) {
      console.error('Transcription error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong during transcription.';

      Alert.alert(
        'Transcription failed',
        `${message}\n\nCheck that your Python service is running and your phone and computer are connected to the same Wi-Fi.`
      );

    } finally {
      setTranscribing(false);
    }
  };

  const handleMethodSelection = (method: InputMethod) => {
    setSelectedMethod(method);

    if (method === 'sign') {
      Alert.alert(
        'Sign-language input',
        'Camera-based Indian Sign Language recognition will be implemented in the next phase.'
      );
    }
  };

  const renderLanguageSelector = () => (
    <>
      <Text style={styles.fieldLabel}>Preferred language</Text>

      <View style={styles.languageContainer}>
        {(['English', 'தமிழ்', 'हिन्दी'] as Language[]).map(
          (item) => (
            <Pressable
              key={item}
              onPress={() => setLanguage(item)}
              style={[
                styles.languageButton,
                language === item && styles.selectedLanguage,
              ]}
            >
              <Text
                style={[
                  styles.languageText,
                  language === item && styles.selectedLanguageText,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View>
              <Text style={styles.brand}>ResolveAI</Text>
              <Text style={styles.headerSubtitle}>
                Grievance registration
              </Text>
            </View>
          </View>

          <View style={styles.introSection}>
            <Text style={styles.stepLabel}>
              STEP 01 · YOUR VOICE MATTERS
            </Text>

            <Text style={styles.title}>
              Tell us what{'\n'}happened.
            </Text>

            <Text style={styles.description}>
              Explain your problem in the way that is most comfortable
              for you. Our goal is to make grievance registration
              accessible to everyone.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Choose how to describe your problem
          </Text>

          <View style={styles.methodContainer}>
            <Pressable
              style={[
                styles.methodCard,
                selectedMethod === 'text' && styles.selectedMethod,
              ]}
              onPress={() => handleMethodSelection('text')}
            >
              <View style={styles.methodIcon}>
                <Text style={styles.methodEmoji}>✍️</Text>
              </View>

              <View style={styles.methodTextContainer}>
                <Text style={styles.methodTitle}>Text input</Text>
                <Text style={styles.methodDescription}>
                  Type your complaint in your preferred language.
                </Text>
              </View>

              <View style={styles.radioOuter}>
                {selectedMethod === 'text' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.methodCard,
                selectedMethod === 'voice' && styles.selectedMethod,
              ]}
              onPress={() => handleMethodSelection('voice')}
            >
              <View style={styles.methodIcon}>
                <Text style={styles.methodEmoji}>🎙️</Text>
              </View>

              <View style={styles.methodTextContainer}>
                <Text style={styles.methodTitle}>Voice input</Text>
                <Text style={styles.methodDescription}>
                  Record your complaint in Tamil, English or Hindi.
                </Text>
              </View>

              <View style={styles.radioOuter}>
                {selectedMethod === 'voice' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.methodCard,
                selectedMethod === 'sign' && styles.selectedMethod,
              ]}
              onPress={() => handleMethodSelection('sign')}
            >
              <View style={styles.methodIcon}>
                <Text style={styles.methodEmoji}>🤟</Text>
              </View>

              <View style={styles.methodTextContainer}>
                <Text style={styles.methodTitle}>Sign language</Text>
                <Text style={styles.methodDescription}>
                  Use your camera to communicate through Indian Sign Language.
                </Text>
              </View>

              <View style={styles.radioOuter}>
                {selectedMethod === 'sign' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </Pressable>
          </View>

          {selectedMethod === 'text' && (
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>
                Describe your grievance
              </Text>

              <Text style={styles.helperText}>
                You don't need to know the department or complaint category.
                Just explain what happened.
              </Text>

              {renderLanguageSelector()}

              <Text style={styles.fieldLabel}>
                What is the problem?
              </Text>

              <TextInput
                style={styles.complaintInput}
                multiline
                textAlignVertical="top"
                placeholder={
                  language === 'தமிழ்'
                    ? 'உங்கள் பிரச்சினையை இங்கே விவரிக்கவும்...'
                    : language === 'हिन्दी'
                      ? 'अपनी समस्या यहाँ बताएं...'
                      : 'Example: There has been no drinking water supply in our area for the past three days...'
                }
                placeholderTextColor="#9CA3AF"
                value={complaint}
                onChangeText={setComplaint}
                maxLength={2000}
              />

              <Text style={styles.characterCount}>
                {complaint.length}/2000 characters
              </Text>

              <View style={styles.privacyNote}>
                <Text style={styles.privacyIcon}>🔒</Text>
                <Text style={styles.privacyText}>
                  Your complaint details should only be used to assist
                  with grievance preparation and processing.
                </Text>
              </View>

              <Pressable
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Text style={styles.continueArrow}>→</Text>
              </Pressable>
            </View>
          )}

          {selectedMethod === 'voice' && (
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>
                Speak in your own language
              </Text>

              <Text style={styles.helperText}>
                Select your language, record your complaint and let
                ResolveAI convert your speech into editable text.
              </Text>

              {renderLanguageSelector()}

              <View style={styles.voiceCard}>
                <Text style={styles.voiceIcon}>🎙️</Text>

                <Text style={styles.voiceTitle}>
                  {recorderState.isRecording
                    ? 'Recording your complaint...'
                    : transcribing
                      ? 'Transcribing your speech...'
                      : 'Ready to record'}
                </Text>

                <Text style={styles.voiceDescription}>
                  {recorderState.isRecording
                    ? 'Speak clearly. Press Stop when you finish.'
                    : transcribing
                      ? 'Your audio is being processed online. Please wait.'
                      : 'Allow microphone access and speak naturally in your selected language.'}
                </Text>

                {recorderState.isRecording && (
                  <Text style={styles.recordingTime}>
                    {Math.floor(recorderState.durationMillis / 1000)} seconds
                  </Text>
                )}

                {transcribing ? (
                  <View style={styles.transcribingStatus}>
                    <ActivityIndicator color="#6849CA" size="large" />
                    <Text style={styles.transcribingText}>
                      Sending audio for speech recognition...
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={[
                      styles.recordButton,
                      recorderState.isRecording && styles.stopButton,
                    ]}
                    onPress={
                      recorderState.isRecording
                        ? handleStopRecording
                        : handleStartRecording
                    }
                  >
                    <Text style={styles.recordButtonText}>
                      {recorderState.isRecording
                        ? '■  Stop recording'
                        : '●  Start recording'}
                    </Text>
                  </Pressable>
                )}
              </View>

              {complaint.trim().length > 0 && (
                <View style={styles.transcriptSection}>
                  <Text style={styles.sectionTitle}>
                    Review your transcript
                  </Text>

                  <Text style={styles.helperText}>
                    Speech recognition may make mistakes. Edit the text
                    below to make sure your complaint is accurate.
                  </Text>

                  <TextInput
                    style={styles.complaintInput}
                    multiline
                    textAlignVertical="top"
                    value={complaint}
                    onChangeText={setComplaint}
                    maxLength={2000}
                    placeholder="Your transcribed complaint will appear here..."
                    placeholderTextColor="#9CA3AF"
                  />

                  <Text style={styles.characterCount}>
                    {complaint.length}/2000 characters
                  </Text>

                  <Pressable
                    style={styles.continueButton}
                    onPress={handleContinue}
                  >
                    <Text style={styles.continueButtonText}>
                      Use transcript and continue
                    </Text>
                    <Text style={styles.continueArrow}>→</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {selectedMethod === 'sign' && (
            <View style={styles.comingSoonPanel}>
              <Text style={styles.panelIcon}>🤟</Text>

              <Text style={styles.panelTitle}>
                Communicate through sign language
              </Text>

              <Text style={styles.panelDescription}>
                The planned ISL feature will use your camera and a
                sign-language recognition model to translate signs
                into text.
              </Text>
            </View>
          )}

          <Text style={styles.footer}>
            ResolveAI · Your Voice. Your Rights.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
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
    elevation: 2,
  },
  backIcon: {
    fontSize: 32,
    color: '#5B3CC4',
    lineHeight: 36,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4F35B5',
  },
  headerSubtitle: {
    color: '#77758B',
    fontSize: 12,
    marginTop: 2,
  },
  introSection: {
    marginBottom: 25,
  },
  stepLabel: {
    color: '#7355D8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  title: {
    color: '#25213B',
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '800',
  },
  description: {
    color: '#77758B',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  sectionTitle: {
    color: '#29253E',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  methodContainer: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECEAF5',
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMethod: {
    borderColor: '#7454D6',
    backgroundColor: '#F3F0FF',
  },
  methodIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  methodEmoji: {
    fontSize: 23,
  },
  methodTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  methodTitle: {
    color: '#302B46',
    fontSize: 15,
    fontWeight: '800',
  },
  methodDescription: {
    color: '#858197',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#B8B3CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6849CA',
  },
  inputSection: {
    marginTop: 29,
  },
  helperText: {
    color: '#858197',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 19,
  },
  fieldLabel: {
    color: '#39344F',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 16,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#E5E1F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectedLanguage: {
    backgroundColor: '#6849CA',
    borderColor: '#6849CA',
  },
  languageText: {
    color: '#69647B',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedLanguageText: {
    color: '#FFFFFF',
  },
  complaintInput: {
    minHeight: 155,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E1F0',
    borderRadius: 15,
    padding: 15,
    color: '#302B46',
    fontSize: 14,
    lineHeight: 22,
  },
  characterCount: {
    color: '#9995A9',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 7,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: '#F0EDFF',
    padding: 13,
    borderRadius: 12,
    marginTop: 18,
    alignItems: 'flex-start',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: 9,
  },
  privacyText: {
    color: '#6E6590',
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#6849CA',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  continueArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 10,
  },
  voiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6F5',
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  voiceIcon: {
    fontSize: 42,
    marginBottom: 13,
  },
  voiceTitle: {
    color: '#302B46',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  voiceDescription: {
    color: '#858197',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },
  recordingTime: {
    color: '#6849CA',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 16,
  },
  recordButton: {
    backgroundColor: '#6849CA',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 13,
    marginTop: 22,
    minWidth: 205,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#D9485F',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  transcribingStatus: {
    alignItems: 'center',
    marginTop: 22,
    gap: 12,
  },
  transcribingText: {
    color: '#6849CA',
    fontSize: 12,
    textAlign: 'center',
  },
  transcriptSection: {
    marginTop: 28,
  },
  comingSoonPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6F5',
    padding: 25,
    alignItems: 'center',
    marginTop: 25,
  },
  panelIcon: {
    fontSize: 38,
    marginBottom: 14,
  },
  panelTitle: {
    color: '#302B46',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  panelDescription: {
    color: '#858197',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },
  footer: {
    textAlign: 'center',
    color: '#A29DB2',
    fontSize: 11,
    marginTop: 32,
  },
});
