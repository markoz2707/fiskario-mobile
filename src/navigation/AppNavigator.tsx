import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import CompanyCreatorScreen from '../screens/main/CompanyCreatorScreen';
import InvoicingScreen from '../screens/main/InvoicingScreen';
import InvoiceDetailScreen from '../screens/main/InvoiceDetailScreen';
import CostsScreen from '../screens/main/CostsScreen';
import DeclarationsScreen from '../screens/main/DeclarationsScreen';
import DeclarationCreatorScreen from '../screens/main/DeclarationCreatorScreen';
import VATRegisterScreen from '../screens/main/VATRegisterScreen';
import ZUSScreen from '../screens/main/ZUSScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Company screens
import CompanyListScreen from '../screens/company/CompanyListScreen';
import CompanyDetailScreen from '../screens/company/CompanyDetailScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CompanyStack: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Companies: undefined;
  Invoicing: undefined;
  Costs: undefined;
  Declarations: undefined;
  ZUS: undefined;
  Reports: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type CompanyStackParamList = {
  CompanyList: undefined;
  CompanyDetail: { companyId: string };
  CompanyCreator: undefined;
};

export type InvoicingStackParamList = {
  InvoiceList: undefined;
  InvoiceDetail: { invoiceId: string };
  InvoiceCreator: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const CompanyStack = createStackNavigator<CompanyStackParamList>();
const InvoicingStack = createStackNavigator<InvoicingStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const CompanyNavigator = () => {
  return (
    <CompanyStack.Navigator>
      <CompanyStack.Screen
        name="CompanyList"
        component={CompanyListScreen}
        options={{ title: 'Firmy' }}
      />
      <CompanyStack.Screen
        name="CompanyDetail"
        component={CompanyDetailScreen}
        options={{ title: 'Szczegóły firmy' }}
      />
      <CompanyStack.Screen
        name="CompanyCreator"
        component={CompanyCreatorScreen}
        options={{ title: 'Dodaj firmę' }}
      />
    </CompanyStack.Navigator>
  );
};

const InvoicingNavigator = () => {
  return (
    <InvoicingStack.Navigator>
      <InvoicingStack.Screen
        name="InvoiceList"
        component={InvoicingScreen}
        options={{ title: 'Faktury' }}
      />
      <InvoicingStack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ title: 'Szczegóły faktury' }}
      />
    </InvoicingStack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Companies':
              iconName = 'business';
              break;
            case 'Invoicing':
              iconName = 'receipt';
              break;
            case 'Costs':
              iconName = 'account-balance-wallet';
              break;
            case 'Declarations':
              iconName = 'assignment';
              break;
            case 'ZUS':
              iconName = 'group';
              break;
            case 'Reports':
              iconName = 'analytics';
              break;
            case 'Notifications':
              iconName = 'notifications';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Panel' }}
      />
      <MainTab.Screen
        name="Companies"
        component={CompanyNavigator}
        options={{ title: 'Firmy' }}
      />
      <MainTab.Screen
        name="Invoicing"
        component={InvoicingNavigator}
        options={{ title: 'Fakturowanie' }}
      />
      <MainTab.Screen
        name="Costs"
        component={CostsScreen}
        options={{ title: 'Koszty' }}
      />
      <MainTab.Screen
        name="Declarations"
        component={DeclarationsScreen}
        options={{ title: 'Deklaracje' }}
      />
      <MainTab.Screen
        name="ZUS"
        component={ZUSScreen}
        options={{ title: 'ZUS' }}
      />
      <MainTab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Raporty' }}
      />
      <MainTab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Powiadomienia' }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ustawienia' }}
      />
    </MainTab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;