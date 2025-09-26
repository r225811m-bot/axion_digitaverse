import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { UserProvider, useUser } from "./UserContext";
import Wallet from "./Components/Wallet";
import SendAcoin from "./Components/SendAcoin";
import PythonIDE from "./Components/PythonIDE";
import Credits from "./Components/Credits";
import SignUpForm from "./Components/SignUpForm";
import LoginForm from "./Components/LogInForm";
import Explorer from "./Components/Explorer";
import WelcomePage from "./Components/Welcome";
import Agents from "./Components/Agents";
import AxionAI from "./Components/AxionAI";
import AxionAIDashboard from "./Components/AxionAIDashboard";

// Shorten address for display
function shortAddress(address: string) {
    if (!address) return "";
    return address.slice(0, 8) + "..." + address.slice(-4);
}

// Navbar (with all links)
function Navbar({ navigation }) {
    const { user, setUser } = useUser();
    const [copied, setCopied] = useState(false);

    const handleLogout = () => {
        setUser(null);
        navigation.navigate("Login");
    };

    const handleCopy = () => {
        if (user?.address) {
            // Clipboard is not directly available in React Native.
            // A third-party library would be needed.
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <View style={styles.navbar}>
            <TouchableOpacity onPress={() => navigation.navigate("AxionDigitaverse")}>
                <Text style={styles.navBrand}>Axion Digitaverse</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate("Wallet")}
                >
                    <Text style={styles.navLink}>Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate("Send")}
                >
                    <Text style={styles.navLink}>Send acoin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate("Chain")}
                >
                    <Text style={styles.navLink}>Explorer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate("IDE")}
                >
                    <Text style={styles.navLink}>Python IDE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate("Agents")}
                >
                    <Text style={styles.navLink}>Agents</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate("Credits")}
                >
                    <Text style={styles.navLink}>Credits</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate("AxionAI")}
                >
                    <Text style={styles.navLink}>Axion AI</Text>
                </TouchableOpacity>
            </ScrollView>
            <View style={styles.userContainer}>
                {!user ? (
                    <>
                        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                            <Text style={styles.navLink}>Sign Up</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                            <Text style={styles.navLink}>Login</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.userInfo}>
                        <Image
                            source={{
                                uri: user.profilePic
                                    ? `https://axion-digitaverse-3.onrender.com/api/profile-pic/${user.address}`
                                    : "https://via.placeholder.com/36",
                            }}
                            style={styles.profilePic}
                        />
                        <Text style={styles.userAddress}>{shortAddress(user.address)}</Text>
                        <TouchableOpacity onPress={handleCopy}>
                            <Text>Copy</Text>
                        </TouchableOpacity>
                        {copied && <Text>Copied!</Text>}
                        <TouchableOpacity onPress={handleLogout}>
                            <Text>Logout</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const Stack = createStackNavigator();

function App() {
    return (
        <UserProvider>
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        header: (props) => <Navbar {...props} />,
                    }}
                >
                    <Stack.Screen name="AxionDigitaverse" component={WelcomePage} />
                    <Stack.Screen name="Wallet" component={Wallet} />
                    <Stack.Screen name="Send" component={SendAcoin} />
                    <Stack.Screen name="Chain" component={Explorer} />
                    <Stack.Screen name="IDE" component={PythonIDE} />
                    <Stack.Screen name="Agents" component={Agents} />
                    <Stack.Screen name="Credits" component={Credits} />
                    <Stack.Screen name="SignUp" component={SignUpForm} />
                    <Stack.Screen name="Login" component={LoginForm} />
                    <Stack.Screen name="AxionAI" component={AxionAI} />
                    <Stack.Screen name="AxionAIDashboard" component={AxionAIDashboard} />
                </Stack.Navigator>
            </NavigationContainer>
        </UserProvider>
    );
}

const styles = StyleSheet.create({
    navbar: {
        backgroundColor: "#007bff",
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    navBrand: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
    },
    navItem: {
        marginLeft: 10,
    },
    navLink: {
        color: "white",
        fontWeight: "bold",
    },
    userContainer: {
        flexDirection: "row",
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    profilePic: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 8,
    },
    userAddress: {
        color: "white",
        marginRight: 8,
    },
});

export default App;
