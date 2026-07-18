import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/config/firebase';
import { useAuth } from '../src/context/AuthContext';
import { Globe as GoogleIcon } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { signInWithGoogle, signInAnonymouslyUser, bypassLogin } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      Alert.alert('Authentication Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>MINIMAL</Text>
          <Text style={styles.subtitle}>FITNESS TRACKER</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="EMAIL"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="PASSWORD"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
              <Text style={styles.primaryButtonText}>{isLogin ? 'LOG IN' : 'SIGN UP'}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
              <GoogleIcon size={20} color="#000" style={{ marginRight: 10 }} />
              <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.googleButton, { marginTop: 10 }]} onPress={signInAnonymouslyUser}>
              <Text style={styles.googleButtonText}>CONTINUE AS GUEST (ANONYMOUS)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.googleButton, { marginTop: 10, backgroundColor: '#f0f0f0' }]} onPress={bypassLogin}>
              <Text style={styles.googleButtonText}>DEVELOPER BYPASS (OFFLINE MOCK)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '300',
    color: '#666',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 60,
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    height: 55,
    paddingHorizontal: 20,
    fontSize: 14,
    letterSpacing: 2,
    color: '#000',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  primaryButton: {
    backgroundColor: '#000',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#000',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
