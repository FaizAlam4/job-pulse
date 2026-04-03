/**
 * Redux Provider Wrapper
 * Wraps the application with Redux store and Auth context
 */

'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { TrackingInitializer } from '@/modules/tracking/components/TrackingInitializer';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <TrackingInitializer>
          {children}
        </TrackingInitializer>
      </AuthProvider>
    </Provider>
  );
};

export default Providers;
