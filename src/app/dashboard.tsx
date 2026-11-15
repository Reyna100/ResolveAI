
import { useRouter } from 'expo-router';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();

  const openGrievance = () => {
    router.push('/grievance');
  };

  const showComingSoon = (feature: string) => {
    Alert.alert(
      feature,
      'This feature will be available in the next development phase.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>ResolveAI</Text>
            <Text style={styles.subtitle}>Citizen Dashboard</Text>
          </View>

          <View style={styles.profileCircle}>
            <Text style={styles.profileLetter}>C</Text>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, Citizen 👋</Text>
          <Text style={styles.welcomeText}>
            How can we help you today?
          </Text>
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>YOUR VOICE MATTERS</Text>
          <Text style={styles.bannerTitle}>
            Every concern deserves to be heard.
          </Text>
          <Text style={styles.bannerDescription}>
            Describe your problem. ResolveAI will help you prepare
            a clear grievance.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <Pressable
          style={styles.actionCard}
          onPress={openGrievance}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📝</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Register a Grievance
            </Text>
            <Text style={styles.actionDescription}>
              Submit your concern through text, voice or sign language.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => showComingSoon('Track Grievance')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🔎</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Track Grievance</Text>
            <Text style={styles.actionDescription}>
              Check the progress of your submitted complaints.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => showComingSoon('My History')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📋</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My History</Text>
            <Text style={styles.actionDescription}>
              View your previous grievance records.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Your overview</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>In progress</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>Recent activity</Text>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyDescription}>
            Your grievance activity will appear here after you
            start using the service.
          </Text>
        </View>

        <Text style={styles.footer}>
          ResolveAI · Your Voice. Your Rights.
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  brand: {
    fontSize: 23,
    fontWeight: '800',
    color: '#4F35B5',
  },
  subtitle: {
    fontSize: 12,
    color: '#88839C',
    marginTop: 3,
  },
  profileCircle: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#E9E2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileLetter: {
    color: '#6042C0',
    fontSize: 17,
    fontWeight: '800',
  },
  welcomeSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  greeting: {
    color: '#29253E',
    fontSize: 25,
    fontWeight: '800',
  },
  welcomeText: {
    color: '#858197',
    fontSize: 14,
    marginTop: 6,
  },
  banner: {
    backgroundColor: '#6849CA',
    borderRadius: 19,
    padding: 21,
    marginBottom: 27,
  },
  bannerLabel: {
    color: '#DCD3FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
    marginTop: 10,
  },
  bannerDescription: {
    color: '#E8E2FF',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  sectionTitle: {
    color: '#302B46',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 13,
    marginTop: 5,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEAF5',
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: '#302B46',
    fontSize: 14,
    fontWeight: '800',
  },
  actionDescription: {
    color: '#858197',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  arrow: {
    color: '#7658D1',
    fontSize: 27,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAF5',
  },
  statNumber: {
    color: '#6042C0',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#858197',
    fontSize: 10,
    marginTop: 5,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEAF5',
  },
  activityTitle: {
    color: '#302B46',
    fontSize: 15,
    fontWeight: '800',
    alignSelf: 'flex-start',
  },
  emptyIcon: {
    fontSize: 30,
    marginTop: 22,
  },
  emptyTitle: {
    color: '#49445F',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 10,
  },
  emptyDescription: {
    color: '#9691A7',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  footer: {
    textAlign: 'center',
    color: '#A29DB2',
    fontSize: 11,
    marginTop: 28,
  },
});
