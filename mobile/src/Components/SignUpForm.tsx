import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useUser } from '../UserContext';
import Clipboard from '@react-native-community/clipboard';
import { useNavigation } from '@react-navigation/native';

function SignUpForm() {
  const { setUser } = useUser();
  const [username, setUsername] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [counter, setCounter] = useState(15);
  const navigation = useNavigation();

  useEffect(() => {
    let timer;
    if (showKeys && counter > 0) {
      timer = setTimeout(() => setCounter(counter - 1), 1000);
    }
    if (showKeys && counter === 0) {
      navigation.navigate('Welcome');
    }
    return () => clearTimeout(timer);
  }, [showKeys, counter, navigation]);

  const handleSignUp = async () => {
    if (!username) {
      Alert.alert("Username is required");
      return;
    }
    try {
      const res = await fetch("https://axion-digitaverse-3.onrender.com/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setPublicKey(data.publicKey);
      setPrivateKey(data.privateKey);
      setShowKeys(true);
      setUser({ username, address: data.publicKey, token: data.privateKey, balance: data.balance, profilePic: null });
    } catch (error) {
      console.error(error);
      Alert.alert("Sign up failed");
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied to clipboard");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        {showKeys && (
          <View style={styles.keysContainer}>
            <Text style={styles.keyLabel}>Public Key:</Text>
            <Text style={styles.keyText}>{publicKey}</Text>
            <TouchableOpacity onPress={() => copyToClipboard(publicKey)}>
              <Text style={styles.copyButton}>Copy</Text>
            </TouchableOpacity>

            <Text style={styles.keyLabel}>Private Key:</Text>
            <Text style={styles.keyText}>{privateKey}</Text>
            <TouchableOpacity onPress={() => copyToClipboard(privateKey)}>
              <Text style={styles.copyButton}>Copy</Text>
            </TouchableOpacity>
            
            <Text style={styles.warningText}>
              Never share your private key. Keep it safe!
            </Text>
            <Text style={styles.redirectText}>
              Redirecting to home in {counter} seconds...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181c2f',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1c92d2',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  keysContainer: {
    marginTop: 20,
  },
  keyLabel: {
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  keyText: {
    color: 'white',
    fontSize: 12,
  },
  copyButton: {
    color: '#1c92d2',
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
  warningText: {
    color: 'orange',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  redirectText: {
    color: '#1c92d2',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
  },
});

export default SignUpForm;
