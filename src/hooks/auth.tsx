import React, {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: User;
  token: string;
}

interface AuthContextData {
  user: User;
  loading: boolean;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>({} as AuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInitialState(): Promise<void> {
      const [tokenPair, userPair] = await AsyncStorage.multiGet([
        '@GoBarber:token',
        '@GoBarber:user',
      ]);

      if (tokenPair[1] && userPair[1]) {
        api.defaults.headers.authorization = `Bearer ${tokenPair[1]}`;
        setData({ token: tokenPair[1], user: JSON.parse(userPair[1]) });
      }

      setLoading(false);
    }
    getInitialState();
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBarber:token', '@GoBarber:user']);

    setData({} as AuthState);
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post('sessions', { email, password });
    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ['@GoBarber:token', token],
      ['@GoBarber:user', JSON.stringify(user)],
    ]);

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, user });
  }, []);

  return (
    <AuthContext.Provider value={{ user: data.user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('This hook must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
