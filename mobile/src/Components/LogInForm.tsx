import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useUser } from '../UserContext';
import { useNavigation } from '@react-navigation/native';

function LoginForm() {
  const { setUser } = useUser();
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!publicKey || !privateKey) {
      Alert.alert("Public and Private keys are required");
      return;
    }
    try {
      const res = await fetch("https://axion-digitaverse-3.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, privateKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        navigation.navigate('Welcome');
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred during login");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Public Key"
          placeholderTextColor="#999"
          value={publicKey}
          onChangeText={setPublicKey}
        />
        <TextInput
          style={styles.input}
          placeholder="Private Key"
          placeholderTextColor="#999"
          value={privateKey}
          onChangeText={setPrivateKey}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoginForm;
