import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './loginscreen';
import SignupScreen from './sinupscreen';
import SignUpAdditionalInfo from '../components/signupscreen/additionalinfo';

const AuthStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="SignUpAdditionalInfo" component={SignUpAdditionalInfo} />
  </AuthStack.Navigator>
);

export default AuthNavigator;
