
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Button, StyleSheet, Platform } from 'react-native';
import { useUser } from '../UserContext';
import Clipboard from '@react-native-community/clipboard';
import QRCode from 'react-native-qrcode-svg';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';

function shortAddress(address) {
  if (!address) return "";
  return address.slice(0, 8) + "..." + address.slice(-4);
}

function WelcomePage() {
  const { user, setUser } = useUser();
  const [copied, setCopied] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  const handleCopy = () => {
    if (user?.address) {
      Clipboard.setString(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleChoosePhoto = () => {
    launchImageLibrary({ noData: true }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        setProfilePic(response.assets[0]);
      }
    });
  };

  const handleUpload = async () => {
    if (!user || !profilePic) return;

    const uri = Platform.OS === "android" ? profilePic.uri : profilePic.uri.replace("file://", "");
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    const formData = new FormData();
    formData.append("address", user.address);
    formData.append("profilePic", {
      uri: uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });

    try {
      const res = await fetch("https://axion-digitaverse-3.onrender.com/api/upload-profile-pic", {
        method: "POST",
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, profilePic: data.profilePic });
        setShowPopup(false);
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const profilePicUrl = user?.profilePic
    ? `https://axion-digitaverse-3.onrender.com/api/profile-pic/${user.address}?t=${Date.now()}`
    : "https://axion-digitaverse-3.onrender.com/api/profile-pic/default.png";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          Enjoy Your Web 3.0 with Axion Digitaverse Infrastructure
        </Text>
        <Text style={styles.subtitle}>
          Welcome to the future of decentralized finance, identity, and smart contracts.
        </Text>
        {user && (
          <View style={styles.userInfoContainer}>
            <TouchableOpacity onPress={() => setShowPopup(true)}>
              <Image
                source={{ uri: profilePicUrl }}
                style={styles.profilePic}
              />
            </TouchableOpacity>
            <Text style={styles.welcomeText}>
              Welcome, {user.username}!
            </Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>
                Address: {shortAddress(user.address)}
              </Text>
              <TouchableOpacity onPress={handleCopy}>
                <Text style={styles.copyIcon}>Copy</Text>
              </TouchableOpacity>
              {copied && <Text style={styles.copiedText}>Copied!</Text>}
            </View>
            <View style={styles.qrCodeContainer}>
              <QRCode value={user.address} size={60} bgColor="#181c2f" fgColor="#1c92d2" />
              <Text style={styles.qrCodeText}>
                Scan to send acoin
              </Text>
            </View>
            <Text style={styles.balanceText}>
              Balance: {user.balance} acoin
            </Text>
          </View>
        )}
      </View>
      {user && (
        <Modal
          visible={showPopup}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPopup(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Profile Pic Options</Text>
              <Button title="View Profile Pic" onPress={() => setShowPopup(false)} />
              <Button title="Choose Photo" onPress={handleChoosePhoto} />
              {profilePic && <Image source={{ uri: profilePic.uri }} style={{ width: 100, height: 100 }} />}
              <Button title="Upload/Change Profile Pic" onPress={handleUpload} />
              <Button title="Close" onPress={() => setShowPopup(false)} color="red" />
            </View>
          </View>
        </Modal>
      )}
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
    maxWidth: 600,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    color: '#1c92d2',
    fontWeight: '700',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 500,
    alignSelf: 'center',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  welcomeText: {
    marginTop: 10,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  addressText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 14,
  },
  copyIcon: {
    color: '#1c92d2',
  },
  copiedText: {
    color: 'green',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  qrCodeContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  qrCodeText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 12,
  },
  balanceText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default WelcomePage;

