import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { MaterialIcons as Icon } from '@expo/vector-icons';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import CompanyListScreen from '../screens/main/CompanyListScreen';
import CompanyCreatorScreen from '../screens/main/CompanyCreatorScreen';
import CompanyEditorScreen from '../screens/main/CompanyEditorScreen';
import InvoicingScreen from '../screens/main/InvoicingScreen';
import InvoicePreviewScreen from '../screens/main/InvoicePreviewScreen';
import InvoiceScannerScreen from '../screens/main/InvoiceScannerScreen';
import InvoiceCreatorScreen from '../screens/main/InvoiceCreatorScreen';
import CustomerSelectorScreen from '../screens/main/CustomerSelectorScreen';
import CostsScreen from '../screens/main/CostsScreen';
import DeclarationsScreen from '../screens/main/DeclarationsScreen';
import DeclarationCreatorScreen from '../screens/main/DeclarationCreatorScreen';
import VATRegisterScreen from '../screens/main/VATRegisterScreen';
import ZUSScreen from '../screens/main/ZUSScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import TaxRulesScreen from '../screens/main/TaxRulesScreen';
import DeadlinesScreen from '../screens/main/DeadlinesScreen';

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
   Invoicing: undefined;
   Costs: undefined;
   Declarations: undefined;
   Deadlines: undefined;
   ZUS: undefined;
   Settings: undefined;
 };

export type CompanyStackParamList = {
   CompanyList: undefined;
   CompanyDetail: { companyId: string };
   CompanyCreator: undefined;
   CompanyEditor: { companyId: string };
 };

export type InvoicingStackParamList = {
   InvoiceList: undefined;
   InvoiceDetail: { invoiceId: string };
   InvoiceCreator: { selectedCustomer?: any } | undefined;
   CustomerSelector: { onCustomerSelected?: (customer: any) => void };
   CustomerCreator: { onCustomerCreated?: (customer: any) => void };
 };

export type SettingsStackParamList = {
   Settings: undefined;
   Notifications: undefined;
   Reports: undefined;
   TaxRules: undefined;
 };

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const CompanyStack = createStackNavigator<CompanyStackParamList>();
const InvoicingStack = createStackNavigator<InvoicingStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

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
        component={DashboardScreen}
        options={{ title: 'Szczegóły firmy' }}
      />
      <CompanyStack.Screen
         name="CompanyCreator"
         component={CompanyCreatorScreen}
         options={{ title: 'Dodaj firmę' }}
       />
      <CompanyStack.Screen
         name="CompanyEditor"
         component={CompanyEditorScreen}
         options={{ title: 'Edytuj firmę' }}
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
         options={{ headerShown: false }}
       />
       <InvoicingStack.Screen
         name="InvoiceDetail"
         component={InvoicePreviewScreen}
         options={{ title: 'Szczegóły faktury' }}
       />
       <InvoicingStack.Screen
         name="InvoiceCreator"
         component={InvoiceCreatorScreen}
         options={{ title: 'Nowa faktura' }}
       />
       <InvoicingStack.Screen
         name="CustomerSelector"
         component={CustomerSelectorScreen}
         options={{ title: 'Wybierz kontrahenta' }}
       />
       <InvoicingStack.Screen
         name="CustomerCreator"
         component={CompanyCreatorScreen}
         options={{ title: 'Dodaj kontrahenta' }}
       />
     </InvoicingStack.Navigator>
   );
 };

const SettingsNavigator = () => {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ustawienia' }}
      />
      <SettingsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Powiadomienia' }}
      />
      <SettingsStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Raporty' }}
      />
      <SettingsStack.Screen
        name="TaxRules"
        component={TaxRulesScreen}
        options={{ title: 'Reguły podatkowe' }}
      />
    </SettingsStack.Navigator>
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
            case 'Invoicing':
              iconName = 'receipt';
              break;
            case 'Costs':
              iconName = 'account-balance-wallet';
              break;
            case 'Declarations':
              iconName = 'assignment';
              break;
            case 'Deadlines':
              iconName = 'event-note';
              break;
            case 'ZUS':
              iconName = 'group';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Panel' }}
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
        name="Deadlines"
        component={DeadlinesScreen}
        options={{ title: 'Terminy' }}
      />
      <MainTab.Screen
        name="ZUS"
        component={ZUSScreen}
        options={{ title: 'ZUS' }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsNavigator}
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
          <>
            <RootStack.Screen name="Main" component={MainTabNavigator} />
            <RootStack.Screen name="CompanyStack" component={CompanyNavigator} />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;