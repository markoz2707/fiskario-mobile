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
import DeclarationPreviewScreen from '../screens/main/DeclarationPreviewScreen';
import VATRegisterScreen from '../screens/main/VATRegisterScreen';
import JPKV7Screen from '../screens/main/JPKV7Screen';
import PLReportScreen from '../screens/main/PLReportScreen';
import ZUSScreen from '../screens/main/ZUSScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import TaxRulesScreen from '../screens/main/TaxRulesScreen';
import DeadlinesScreen from '../screens/main/DeadlinesScreen';
import KPiRScreen from '../screens/main/KPiRScreen';
import FixedAssetsScreen from '../screens/main/FixedAssetsScreen';
import AnnualTaxScreen from '../screens/main/AnnualTaxScreen';
import TaxOptimizationScreen from '../screens/main/TaxOptimizationScreen';
import AiChatScreen from '../screens/main/AiChatScreen';

// Orphaned screens wired in
import EDeklaracjeScreen from '../screens/EDeklaracjeScreen';
import UPOListScreen from '../screens/UPOListScreen';
import UPOViewScreen from '../screens/UPOViewScreen';
import ReceivedInvoicesScreen from '../screens/ReceivedInvoicesScreen';
import InvoiceApprovalScreen from '../screens/InvoiceApprovalScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  CompanyStack: undefined;
  KPiR: undefined;
  FixedAssets: undefined;
  AnnualTax: undefined;
  TaxOptimization: undefined;
  AiChat: undefined;
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
   InvoiceScanner: undefined;
   ReceivedInvoices: undefined;
   InvoiceApproval: { invoiceId: string };
 };

export type DeclarationsStackParamList = {
   DeclarationsList: undefined;
   DeclarationCreator: undefined;
   DeclarationPreview: { declarationData?: any; formData?: any; formType?: any };
   VATRegister: undefined;
   JPKV7: undefined;
   PLReport: { period?: string; year?: number };
   EDeklaracje: undefined;
   UPOList: { companyId: string };
   UPOView: { upoNumber: string };
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
const InvoicingStackNav = createStackNavigator<InvoicingStackParamList>();
const DeclarationsStack = createStackNavigator<DeclarationsStackParamList>();
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
        options={{ title: 'Szczegoly firmy' }}
      />
      <CompanyStack.Screen
         name="CompanyCreator"
         component={CompanyCreatorScreen}
         options={{ title: 'Dodaj firme' }}
       />
      <CompanyStack.Screen
         name="CompanyEditor"
         component={CompanyEditorScreen}
         options={{ title: 'Edytuj firme' }}
       />
    </CompanyStack.Navigator>
  );
};

const InvoicingNavigator = () => {
   return (
     <InvoicingStackNav.Navigator>
       <InvoicingStackNav.Screen
         name="InvoiceList"
         component={InvoicingScreen}
         options={{ headerShown: false }}
       />
       <InvoicingStackNav.Screen
         name="InvoiceDetail"
         component={InvoicePreviewScreen}
         options={{ title: 'Szczegoly faktury' }}
       />
       <InvoicingStackNav.Screen
         name="InvoiceCreator"
         component={InvoiceCreatorScreen}
         options={{ title: 'Nowa faktura' }}
       />
       <InvoicingStackNav.Screen
         name="CustomerSelector"
         component={CustomerSelectorScreen}
         options={{ title: 'Wybierz kontrahenta' }}
       />
       <InvoicingStackNav.Screen
         name="CustomerCreator"
         component={CompanyCreatorScreen}
         options={{ title: 'Dodaj kontrahenta' }}
       />
       <InvoicingStackNav.Screen
         name="InvoiceScanner"
         component={InvoiceScannerScreen}
         options={{ title: 'Skanuj fakture', headerShown: false }}
       />
       <InvoicingStackNav.Screen
         name="ReceivedInvoices"
         component={ReceivedInvoicesScreen}
         options={{ title: 'Faktury otrzymane' }}
       />
       <InvoicingStackNav.Screen
         name="InvoiceApproval"
         component={InvoiceApprovalScreen}
         options={{ title: 'Zatwierdzanie faktury' }}
       />
     </InvoicingStackNav.Navigator>
   );
 };

const DeclarationsNavigator = () => {
  return (
    <DeclarationsStack.Navigator>
      <DeclarationsStack.Screen
        name="DeclarationsList"
        component={DeclarationsScreen}
        options={{ headerShown: false }}
      />
      <DeclarationsStack.Screen
        name="DeclarationCreator"
        component={DeclarationCreatorScreen}
        options={{ title: 'Nowa deklaracja' }}
      />
      <DeclarationsStack.Screen
        name="DeclarationPreview"
        component={DeclarationPreviewScreen}
        options={{ title: 'Podglad deklaracji' }}
      />
      <DeclarationsStack.Screen
        name="VATRegister"
        component={VATRegisterScreen}
        options={{ title: 'Rejestr VAT' }}
      />
      <DeclarationsStack.Screen
        name="JPKV7"
        component={JPKV7Screen}
        options={{ title: 'JPK_V7' }}
      />
      <DeclarationsStack.Screen
        name="PLReport"
        component={PLReportScreen}
        options={{ title: 'Rachunek Zyskow i Strat' }}
      />
      <DeclarationsStack.Screen
        name="EDeklaracje"
        component={EDeklaracjeScreen}
        options={{ title: 'e-Deklaracje' }}
      />
      <DeclarationsStack.Screen
        name="UPOList"
        component={UPOListScreen}
        options={{ title: 'Lista UPO' }}
      />
      <DeclarationsStack.Screen
        name="UPOView"
        component={UPOViewScreen}
        options={{ title: 'Szczegoly UPO' }}
      />
    </DeclarationsStack.Navigator>
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
        options={{ title: 'Reguly podatkowe' }}
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
        component={DeclarationsNavigator}
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
            <RootStack.Screen name="KPiR" component={KPiRScreen} options={{ title: 'Ksiega Przychodow i Rozchodow' }} />
            <RootStack.Screen name="FixedAssets" component={FixedAssetsScreen} options={{ title: 'Srodki Trwale' }} />
            <RootStack.Screen name="AnnualTax" component={AnnualTaxScreen} options={{ title: 'Rozliczenie Roczne PIT' }} />
            <RootStack.Screen name="TaxOptimization" component={TaxOptimizationScreen} options={{ title: 'Optymalizacja Podatkowa' }} />
            <RootStack.Screen name="AiChat" component={AiChatScreen} options={{ title: 'AI Ksiegowa' }} />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
