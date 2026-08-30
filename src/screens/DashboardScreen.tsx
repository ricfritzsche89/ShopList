import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToShoppingItems } from '../services/shoppingRepository';
import { subscribeToFavorites, addFavoriteToShoppingList } from '../services/favoriteRepository';
import { subscribeToWeeklyPlan, getWeekId } from '../services/weeklyPlanRepository';
import { ShoppingItem, FavoriteItem, WeeklyPlan } from '../models/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const { user, household } = useAuth();
  
  const [openItemsCount, setOpenItemsCount] = useState(0);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const todayName = new Date().toLocaleDateString('de-DE', { weekday: 'long' }).toLowerCase();
  
  // Wochentag-Mapper von Deutsch auf Englisch (WeeklyPlan-Keys)
  const dayKeyMap: { [key: string]: keyof WeeklyPlan['days'] } = {
    'montag': 'monday',
    'dienstag': 'tuesday',
    'mittwoch': 'wednesday',
    'donnerstag': 'thursday',
    'freitag': 'friday',
    'samstag': 'saturday',
    'sonntag': 'sunday'
  };
  
  const todayKey = dayKeyMap[todayName] || 'monday';

  useEffect(() => {
    if (!user?.householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Einkaufsliste abonnieren
    const unsubscribeShopping = subscribeToShoppingItems(user.householdId, (items) => {
      const openCount = items.filter(item => !item.isBought).length;
      setOpenItemsCount(openCount);
      setLoading(false);
    });

    // 2. Favoriten abonnieren
    const unsubscribeFavorites = subscribeToFavorites(user.householdId, (favs) => {
      setFavorites(favs.slice(0, 5)); // Zeige max 5 Schnellfavoriten
    });

    // 3. Wochenplan abonnieren
    const weekId = getWeekId();
    const unsubscribePlan = subscribeToWeeklyPlan(user.householdId, weekId, (plan) => {
      setWeeklyPlan(plan);
    });

    return () => {
      unsubscribeShopping();
      unsubscribeFavorites();
      unsubscribePlan();
    };
  }, [user?.householdId]);

  const handleQuickAdd = async (favorite: FavoriteItem) => {
    if (!user?.householdId || !user?.id) return;
    try {
      await addFavoriteToShoppingList(user.householdId, favorite, user.id);
      Alert.alert('Hinzugefügt', `"${favorite.name}" wurde auf deine Einkaufsliste gesetzt!`, [{ text: 'OK', style: 'default' }], { cancelable: true });
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Zutat konnte nicht hinzugefügt werden.');
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 11) return 'Guten Morgen';
    if (hr < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const handleShareId = () => {
    if (user?.householdId) {
      Share.share({
        message: `Tritt unserem Haushalt "${household?.name}" in der Einkaufs- & Kochbuch-App bei! Nutze diese ID: ${user.householdId}`,
        title: 'Haushalts-Einladung'
      });
    }
  };

  const todayMeal = weeklyPlan?.days[todayKey];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF007F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
          <Text style={styles.userNameText}>{user?.displayName}</Text>
        </View>
        <TouchableOpacity style={styles.householdTag} onPress={handleShareId}>
          <Ionicons name="people-outline" size={16} color="#00F0FF" />
          <Text style={styles.householdTagText}>{household?.name || 'Haushalt'}</Text>
        </TouchableOpacity>
      </View>

      {/* Sektion: Einkaufsliste Status */}
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('Einkauf')}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCirclePink}>
            <Ionicons name="cart" size={24} color="#FF007F" />
          </View>
          <View style={styles.cardHeaderTexts}>
            <Text style={styles.cardLabel}>EINKAUFSLISTE</Text>
            <Text style={styles.cardHighlight}>
              {openItemsCount === 0 ? 'Keine offenen Artikel' : `${openItemsCount} offene Artikel`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#4E4960" />
        </View>
      </TouchableOpacity>

      {/* Sektion: Heute geplant */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Heute auf dem Plan 🍽️</Text>
        {todayMeal && todayMeal.recipeId ? (
          <TouchableOpacity 
            style={styles.mealContainer}
            onPress={() => navigation.navigate('Kochbuch', { screen: 'RecipeDetail', params: { recipeId: todayMeal.recipeId } })}
          >
            <View style={styles.mealDetails}>
              <MaterialCommunityIcons name="food-fork-drink" size={28} color="#00F0FF" />
              <View style={styles.mealTexts}>
                <Text style={styles.mealName}>{todayMeal.recipeName}</Text>
                <Text style={styles.mealServings}>{todayMeal.servings} Personen</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4E4960" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyMealContainer}>
            <Text style={styles.emptyText}>Für heute ist kein Gericht geplant.</Text>
            <TouchableOpacity 
              style={styles.planButton}
              onPress={() => navigation.navigate('Woche')}
            >
              <Text style={styles.planButtonText}>Planen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sektion: Schnell Hinzufügen (Favoriten) */}
      <View style={styles.favoritesSection}>
        <Text style={styles.sectionTitle}>Schnell hinzufügen ⚡</Text>
        {favorites.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favScroll}>
            {favorites.map((fav) => (
              <TouchableOpacity 
                key={fav.id} 
                style={styles.favBadge}
                onPress={() => handleQuickAdd(fav)}
              >
                <Text style={styles.favBadgeText}>+ {fav.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Noch keine Favoriten gespeichert.</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Einkauf', { screen: 'Favorites' })}
            >
              <Text style={styles.linkText}>Favoriten verwalten</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sektion: Wochenvorschau */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Wochenplan Vorschau 📅</Text>
        <View style={styles.weekGrid}>
          {weeklyPlan ? (
            Object.keys(weeklyPlan.days).map((dayName) => {
              const day = weeklyPlan.days[dayName as keyof WeeklyPlan['days']];
              const translate: { [key: string]: string } = {
                monday: 'Mo', tuesday: 'Di', wednesday: 'Mi', thursday: 'Do',
                friday: 'Fr', saturday: 'Sa', sunday: 'So'
              };
              return (
                <View key={dayName} style={styles.weekRow}>
                  <Text style={styles.weekDayLabel}>{translate[dayName]}</Text>
                  <Text style={styles.weekDayValue} numberOfLines={1}>
                    {day.recipeId ? day.recipeName : '—'}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Kein aktiver Wochenplan gefunden.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0813',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0813',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 16,
    color: '#9E97B2',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  householdTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  householdTagText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#161224',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCirclePink: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 0, 127, 0.15)',
    borderWidth: 1,
    borderColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTexts: {
    flex: 1,
    marginLeft: 16,
  },
  cardLabel: {
    fontSize: 10,
    color: '#9E97B2',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  mealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0B1E',
    borderWidth: 1,
    borderColor: '#2D254B',
    borderRadius: 12,
    padding: 12,
  },
  mealDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTexts: {
    marginLeft: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mealServings: {
    fontSize: 12,
    color: '#9E97B2',
    marginTop: 2,
  },
  emptyMealContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    color: '#9E97B2',
    fontSize: 14,
    textAlign: 'center',
  },
  planButton: {
    backgroundColor: '#FF007F',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 12,
  },
  planButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoritesSection: {
    marginBottom: 20,
  },
  favScroll: {
    flexDirection: 'row',
  },
  favBadge: {
    backgroundColor: '#161224',
    borderWidth: 1,
    borderColor: '#26203D',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  favBadgeText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    color: '#00F0FF',
    marginTop: 6,
    fontWeight: 'bold',
  },
  weekGrid: {
    backgroundColor: '#0F0B1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D254B',
    padding: 12,
  },
  weekRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
  },
  weekDayLabel: {
    width: 40,
    color: '#00F0FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  weekDayValue: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
});
