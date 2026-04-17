import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { Restaurant, Settings } from '../types';

interface AdminContextType {
  restaurant: Restaurant | null;
  settings: Settings | null;
  loading: boolean;
  refreshRestaurant: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async () => {
    if (!user) {
      setRestaurant(null);
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'restaurants'),
        where('ownerUid', '==', user.uid),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const restaurantDoc = querySnapshot.docs[0];
        setRestaurant({ id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant);

        // Escuta as configurações em tempo real para o admin
        const unsubSettings = onSnapshot(
          doc(db, 'restaurants', restaurantDoc.id, 'settings', 'general'),
          (docSnap) => {
            if (docSnap.exists()) {
              setSettings({ id: docSnap.id, ...docSnap.data() } as Settings);
            } else {
              setSettings(null);
            }
          },
          (error) => {
            console.error('Error fetching admin settings:', error);
          }
        );

        return () => unsubSettings();
      } else {
        setRestaurant(null);
        setSettings(null);
      }
    } catch (error) {
      console.error('Error fetching admin restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cleanup = fetchRestaurant();
    return () => {
      cleanup.then(unsub => { if (typeof unsub === 'function') unsub(); });
    };
  }, [user]);

  return (
    <AdminContext.Provider value={{ restaurant, settings, loading, refreshRestaurant: fetchRestaurant }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
