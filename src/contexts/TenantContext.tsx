import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Restaurant, Settings } from '../types';

interface TenantContextType {
  restaurant: Restaurant | null;
  settings: Settings | null;
  tenantId: string | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubSettings: (() => void) | undefined;

    async function fetchRestaurant() {
      if (!restaurantSlug) {
        setLoading(false);
        setRestaurant(null);
        setTenantId(null);
        setSettings(null);
        return;
      }

      setLoading(true);
      try {
        const q = query(
          collection(db, 'restaurants'),
          where('slug', '==', restaurantSlug),
          where('isActive', '==', true),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.error(`Restaurant not found for slug: ${restaurantSlug}`);
          setRestaurant(null);
          setTenantId(null);
          setSettings(null);
          setLoading(false);
        } else {
          const restaurantDoc = querySnapshot.docs[0];
          const restaurantData = restaurantDoc.data() as Restaurant;
          setRestaurant({ ...restaurantData, id: restaurantDoc.id });
          setTenantId(restaurantDoc.id);

          // Escuta as configurações em tempo real
          unsubSettings = onSnapshot(
            doc(db, 'restaurants', restaurantDoc.id, 'settings', 'general'),
            (docSnap) => {
              if (docSnap.exists()) {
                setSettings({ id: docSnap.id, ...docSnap.data() } as Settings);
              } else {
                setSettings(null);
              }
              setLoading(false);
            },
            (error) => {
              console.error('Error fetching settings:', error);
              setLoading(false);
            }
          );
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        setLoading(false);
      }
    }

    fetchRestaurant();

    return () => {
      if (unsubSettings) unsubSettings();
    };
  }, [restaurantSlug, navigate]);

  return (
    <TenantContext.Provider value={{ restaurant, settings, tenantId, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
