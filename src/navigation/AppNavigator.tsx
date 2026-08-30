import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HouseholdScreen from '../screens/HouseholdScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeEditScreen from '../screens/RecipeEditScreen';
import WeeklyPlanScreen from '../screens/WeeklyPlanScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// === Einkauf-Stack ===
function ShoppingStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Einkaufsliste' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoriten' }} />
    </Stack.Navigator>
  );
}

// === Kochbuch-Stack ===
function RecipeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="RecipeList" component={RecipeListScreen} options={{ title: 'Kochbuch' }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecipeEdit" component={RecipeEditScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// === Haupt-Tab-Navigation ===
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          if (route.name === 'Einkauf') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Kochbuch') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Woche') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF007F',
        tabBarInactiveTintColor: '#4E4960',
        tabBarStyle: {
          backgroundColor: '#161224',
          borderTopColor: '#26203D',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
        },
        headerStyle: {
          backgroundColor: '#161224',
          borderBottomWidth: 1,
          borderBottomColor: '#26203D',
        } as any,
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: '900',
          color: '#FFF',
          fontSize: 17,
        },
      })}
    >
      <Tab.Screen
        name="Einkauf"
        component={ShoppingStack}
        options={{ headerShown: false, tabBarLabel: 'Einkauf' }}
      />
      <Tab.Screen
        name="Kochbuch"
        component={RecipeStack}
        options={{ headerShown: false, tabBarLabel: 'Kochbuch' }}
      />
      <Tab.Screen
        name="Woche"
        component={WeeklyPlanScreen}
        options={{ title: 'Wochenplan', tabBarLabel: 'Woche' }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ title: 'Mein Profil', tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

// === Haupt-Navigator: Prüft Auth-Status und leitet entsprechend weiter ===
function RootNavigator() {
  const { user, household, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF007F" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  if (!user.householdId) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Household" component={HouseholdScreen} />
      </Stack.Navigator>
    );
  }

  return <MainTabs />;
}

// === App-Root: Wrapper mit AuthProvider und NavigationContainer ===
export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#FF007F',
          background: '#0B0813',
          card: '#161224',
          text: '#FFFFFF',
          border: '#26203D',
          notification: '#FF007F',
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: '#161224',
  },
  headerTintColor: '#FFF',
  headerTitleStyle: {
    fontWeight: '900' as const,
    color: '#FFF',
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: '#0B0813',
  },
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0813',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
