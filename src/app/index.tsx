
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Screen = 'welcome' | 'register' | 'login';

const VIOLET = '#6254D9';
const DARK = '#272344';
const MUTED = '#85819A';
const BG = '#F8F7FC';

function Brand({ small = false }: { small?: boolean }) {
  return (
    <View style={styles.brand}>
      <View style={[styles.logoBox, small && styles.smallLogo]}>
        <Text style={[styles.logoLetter, small && { fontSize: 23 }]}>
          R
        </Text>
      </View>

      <Text style={[styles.brandName, small && { fontSize: 22 }]}>
        Resolve<Text style={{ color: VIOLET }}>AI</Text>
      </Text>

      {!small && (
        <Text style={styles.brandCaption}>
          CITIZEN GRIEVANCE SERVICES
        </Text>
      )}
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  optional = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  optional?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        {label}
        {optional && (
          <Text style={{ color: MUTED }}> (Optional)</Text>
        )}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#AAA6B9"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>('welcome');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('English');
  const [consent, setConsent] = useState(false);

  const [loginMobile, setLoginMobile] = useState('');

  // Navigate to dashboard
  const goToDashboard = () => {
    router.replace('/dashboard');
  };

  // Registration validation
  const register = () => {
    if (
      !name.trim() ||
      !mobile.trim() ||
      !stateName.trim() ||
      !district.trim()
    ) {
      Alert.alert(
        'Incomplete details',
        'Please fill in all required fields.'
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      Alert.alert(
        'Invalid number',
        'Enter a valid 10-digit mobile number.'
      );
      return;
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      Alert.alert(
        'Invalid email',
        'Enter a valid email address.'
      );
      return;
    }

    if (!consent) {
      Alert.alert(
        'Consent required',
        'Please accept the privacy notice.'
      );
      return;
    }

    Alert.alert(
      'Registration successful',
      'Your prototype profile has been created.',
      [
        {
          text: 'Continue',
          onPress: goToDashboard,
        },
      ]
    );
  };

  // Login validation - OTP removed for now
  const login = () => {
    if (!/^[6-9]\d{9}$/.test(loginMobile.trim())) {
      Alert.alert(
        'Invalid number',
        'Enter a valid 10-digit mobile number.'
      );
      return;
    }

    goToDashboard();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* WELCOME SCREEN */}
      {screen === 'welcome' && (
        <View style={styles.welcomeScreen}>
          <View style={styles.topDecoration} />

          <ScrollView
            contentContainerStyle={styles.welcomeScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeContent}>
              <Brand />

              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <Text style={styles.heroSymbol}>✦</Text>
                </View>

                <Text style={styles.heroTitle}>
                  Your Voice.{' \n'}
                  <Text style={{ color: VIOLET }}>
                    Your Rights.
                  </Text>
                </Text>

                <Text style={styles.heroDescription}>
                  A simpler, smarter way to raise public
                  grievances and make your concerns heard.
                </Text>
              </View>

              <View style={styles.features}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✧</Text>
                  <Text style={styles.featureText}>
                    AI-assisted complaints
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>◷</Text>
                  <Text style={styles.featureText}>
                    Transparent tracking
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>◎</Text>
                  <Text style={styles.featureText}>
                    Citizen-focused services
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setScreen('register')}
              >
                <Text style={styles.primaryButtonText}>
                  Create an Account
                </Text>
                <Text style={styles.buttonArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setScreen('login')}
              >
                <Text style={styles.secondaryButtonText}>
                  Already registered?{' '}
                  <Text style={{ color: VIOLET }}>
                    Login
                  </Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.bottomNote}>
                Independent citizen grievance assistance prototype
              </Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* REGISTRATION SCREEN */}
      {screen === 'register' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formScreen}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setScreen('welcome')}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Brand small />

            <Text style={styles.formTitle}>
              Create your account
            </Text>

            <Text style={styles.formSubtitle}>
              Join ResolveAI to access citizen grievance services.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.sectionHeading}>
                PERSONAL INFORMATION
              </Text>

              <Field
                label="Full name *"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
              />

              <Field
                label="Mobile number *"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />

              <Field
                label="Email address"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                optional
              />

              <View style={styles.separator} />

              <Text style={styles.sectionHeading}>
                LOCATION DETAILS
              </Text>

              <Field
                label="State *"
                placeholder="Enter your state"
                value={stateName}
                onChangeText={setStateName}
              />

              <Field
                label="District *"
                placeholder="Enter your district"
                value={district}
                onChangeText={setDistrict}
              />

              <Text style={styles.label}>
                Preferred language
              </Text>

              <View style={styles.languageRow}>
                {['English', 'தமிழ்', 'हिन्दी'].map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setLanguage(item)}
                    style={[
                      styles.languageChip,
                      language === item && styles.languageActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageChipText,
                        language === item && styles.languageActiveText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.consentContainer}
              onPress={() => setConsent(!consent)}
            >
              <View
                style={[
                  styles.checkbox,
                  consent && styles.checkedBox,
                ]}
              >
                {consent && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>

              <Text style={styles.consentText}>
                I agree to the privacy notice and consent to the
                processing of my details for this service.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={register}
            >
              <Text style={styles.primaryButtonText}>
                Create Account
              </Text>
              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScreen('login')}
            >
              <Text style={styles.switchText}>
                Already have an account?{' '}
                <Text style={{ color: VIOLET, fontWeight: 'bold' }}>
                  Login
                </Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Independent prototype · Not an official government portal
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* LOGIN SCREEN */}
      {screen === 'login' && (
        <ScrollView
          contentContainerStyle={styles.loginScreen}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('welcome')}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Brand small />

          <View style={styles.loginCard}>
            <Text style={styles.formTitle}>
              Welcome back
            </Text>

            <Text style={styles.formSubtitle}>
              Enter your registered mobile number to continue.
            </Text>

            <Field
              label="Registered mobile number"
              placeholder="Enter your mobile number"
              value={loginMobile}
              onChangeText={setLoginMobile}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 28 }]}
              onPress={login}
            >
              <Text style={styles.primaryButtonText}>
                Continue
              </Text>
              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScreen('register')}
              style={{ marginTop: 24 }}
            >
              <Text style={styles.switchText}>
                New citizen?{' '}
                <Text style={{ color: VIOLET, fontWeight: 'bold' }}>
                  Register here
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  welcomeScreen: {
    flex: 1,
  },
  welcomeScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 27,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topDecoration: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#EEEBFF',
    top: -135,
    right: -85,
  },
  welcomeContent: {
    alignItems: 'center',
    paddingTop: 5,
  },
  brand: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 66,
    height: 66,
    borderRadius: 21,
    backgroundColor: VIOLET,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: VIOLET,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  smallLogo: {
    width: 45,
    height: 45,
    borderRadius: 14,
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: '800',
  },
  brandName: {
    color: DARK,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  brandCaption: {
    color: MUTED,
    fontSize: 9,
    letterSpacing: 2.5,
    fontWeight: '600',
    marginTop: 6,
  },
  hero: {
    alignItems: 'center',
    marginTop: 26,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#EFEDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 21,
  },
  heroSymbol: {
    color: VIOLET,
    fontSize: 29,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: DARK,
    lineHeight: 46,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  heroDescription: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 15,
    paddingHorizontal: 7,
    letterSpacing: 0.15,
  },
  features: {
    alignSelf: 'stretch',
    marginTop: 20,
    gap: 12,
    paddingLeft: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  featureIcon: {
    color: VIOLET,
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    color: '#514D68',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bottomActions: {
    marginTop: 16,
    paddingBottom: 5,
  },
  primaryButton: {
    backgroundColor: VIOLET,
    borderRadius: 13,
    height: 56,
    paddingHorizontal: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: VIOLET,
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    position: 'absolute',
    right: 19,
  },
  secondaryButton: {
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E1F3',
  },
  secondaryButtonText: {
    color: DARK,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNote: {
    textAlign: 'center',
    fontSize: 9,
    color: MUTED,
    marginTop: 12,
    letterSpacing: 0.3,
  },
  formScreen: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 35,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 18,
  },
  backText: {
    color: VIOLET,
    fontWeight: '700',
    fontSize: 14,
  },
  formTitle: {
    color: DARK,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 30,
  },
  formSubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 23,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 19,
    borderWidth: 1,
    borderColor: '#ECEAF4',
  },
  sectionHeading: {
    fontSize: 10,
    color: VIOLET,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  fieldGroup: {
    marginTop: 15,
  },
  label: {
    color: '#403C59',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 9,
    letterSpacing: 0.25,
  },
  input: {
    height: 51,
    backgroundColor: '#FAFAFD',
    borderWidth: 1,
    borderColor: '#E8E5F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: DARK,
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#EFEDF5',
    marginVertical: 24,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 3,
  },
  languageChip: {
    borderWidth: 1,
    borderColor: '#E2DFED',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: '#FAFAFD',
  },
  languageActive: {
    backgroundColor: '#EFEDFF',
    borderColor: VIOLET,
  },
  languageChipText: {
    fontSize: 12,
    color: '#625D78',
    fontWeight: '600',
  },
  languageActiveText: {
    color: VIOLET,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginVertical: 21,
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#B7B2C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: VIOLET,
    borderColor: VIOLET,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  consentText: {
    flex: 1,
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
  },
  switchText: {
    color: MUTED,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 22,
  },
  disclaimer: {
    color: '#A19CAF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
  },
  loginScreen: {
    flexGrow: 1,
    padding: 25,
    paddingTop: 25,
  },
  loginCard: {
    marginTop: 70,
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#ECEAF4',
  },
});
