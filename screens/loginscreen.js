import { View, Image, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import React from 'react';
import Loginform from '../components/loginscreen/Loginform';

const LoginScreen = ({ navigation }) => {
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
            <SafeAreaView style={styles.innerContainer}>
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.logo}
                />
                <Loginform navigation={navigation} />
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20, // Ensure padding for the content
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 30,
    },
});

export default LoginScreen;
