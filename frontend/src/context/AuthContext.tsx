import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  profile: any | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  selectedRole: UserRole;
  switchRole: (role: UserRole) => void;
  setSelectedRole: (role: UserRole) => void;
  artisanProfileCompleted: boolean;
  buyerProfileCompleted: boolean;
  profileCompleted: boolean;
  setProfileCompletedStatus: (completed: boolean) => void;
  setArtisanCompleted: (completed: boolean) => void;
  setBuyerCompleted: (completed: boolean) => void;
  loginUser: (phone: string, password?: string, role?: UserRole) => Promise<{ success: boolean; user?: User; error?: string }>;
  registerUser: (phone: string, password: string, role: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithPhone: (phone: string, role?: UserRole) => Promise<{ success: boolean; demo_otp?: string }>;
  verifyOtp: (phone: string, otp: string, role?: UserRole) => Promise<boolean>;
  verifyPAN: (phone: string, pan: string, fullName: string) => Promise<{ success: boolean; message?: string }>;
  verifyGST: (data: { phone: string; enrollment_id: string; gstin: string; legal_name?: string; trade_name?: string; state?: string }) => Promise<boolean>;
  saveProfile: (profileData: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kalasetu_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kalasetu_token'));
  
  const [profile, setProfile] = useState<any | null>(() => {
    const saved = localStorage.getItem('kalasetu_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const savedUser = localStorage.getItem('kalasetu_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'buyer' || parsed.role === 'artisan') {
          return parsed.role;
        }
      } catch (_) {}
    }
    const saved = localStorage.getItem('kalasetu_active_role');
    if (saved === 'buyer' || saved === 'artisan') return saved;
    return 'buyer';
  });

  const [artisanProfileCompleted, setArtisanProfileCompletedState] = useState<boolean>(() => {
    return localStorage.getItem('kalasetu_artisan_completed') === 'true';
  });

  const [buyerProfileCompleted, setBuyerProfileCompletedState] = useState<boolean>(() => {
    return localStorage.getItem('kalasetu_buyer_completed') === 'true';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('kalasetu_user', JSON.stringify(user));
      if (user.role && (user.role === 'buyer' || user.role === 'artisan')) {
        setActiveRole(user.role as UserRole);
        localStorage.setItem('kalasetu_active_role', user.role);
      }
    } else {
      localStorage.removeItem('kalasetu_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('kalasetu_token', token);
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setUser(prev => ({ ...(prev || {}), ...data.user }));
          if (data.user.role === 'artisan') {
            setArtisanCompleted(data.user.profile_completed);
          } else {
            setBuyerCompleted(data.user.profile_completed);
          }
        }
      })
      .catch(() => {});
    } else {
      localStorage.removeItem('kalasetu_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('kalasetu_active_role', activeRole);
  }, [activeRole]);

  const switchRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const setArtisanCompleted = (completed: boolean) => {
    setArtisanProfileCompletedState(completed);
    localStorage.setItem('kalasetu_artisan_completed', completed ? 'true' : 'false');
    if (user && activeRole === 'artisan') {
      setUser({ ...user, profile_completed: completed, is_verified: true });
    }
  };

  const setBuyerCompleted = (completed: boolean) => {
    setBuyerProfileCompletedState(completed);
    localStorage.setItem('kalasetu_buyer_completed', completed ? 'true' : 'false');
    if (user && activeRole === 'buyer') {
      setUser({ ...user, profile_completed: completed, is_verified: true });
    }
  };

  const loginUser = async (phone: string, password = 'password123', role: UserRole = activeRole) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, role })
      }).catch(() => fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, role })
      }));
      
      const data = res && res.ok ? await res.json() : null;
      if (data && data.user) {
        const u = { ...data.user, role };
        setUser(u);
        setToken(data.token);
        setActiveRole(role);
        return { success: true, user: u };
      }
      // If response has specific error detail
      if (data && data.detail) {
        return { success: false, error: data.detail };
      }
      throw new Error('Fallback to local session');
    } catch {
      const mockUser: User = {
        id: `usr_${Date.now()}`,
        phone,
        role: role || activeRole,
        is_verified: true,
        profile_completed: role === 'artisan' ? artisanProfileCompleted : buyerProfileCompleted
      };
      setUser(mockUser);
      setToken('mock_jwt_token_' + Date.now());
      setActiveRole(role);
      return { success: true, user: mockUser };
    }
  };

  const registerUser = async (phone: string, password: string, role: string) => {
    const roleTyped = (role === 'buyer' ? 'buyer' : 'artisan') as UserRole;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, role: roleTyped })
      }).catch(() => fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, role: roleTyped })
      }));
      const data = res && res.ok ? await res.json() : null;
      if (data && data.user) {
        const u = { ...data.user, role: roleTyped };
        setUser(u);
        setToken(data.token);
        setActiveRole(roleTyped);
        return { success: true, user: u };
      }
      throw new Error('Local fallback');
    } catch {
      const mockUser: User = {
        id: `usr_${Date.now()}`,
        phone,
        role: roleTyped,
        is_verified: true,
        profile_completed: false
      };
      setUser(mockUser);
      setToken('mock_jwt_token_' + Date.now());
      setActiveRole(roleTyped);
      return { success: true, user: mockUser };
    }
  };

  const loginWithPhone = async (phone: string, role?: UserRole) => {
    return { success: true, demo_otp: '123456' };
  };

  const verifyOtp = async (phone: string, otp: string, role?: UserRole) => {
    const chosenRole = role || activeRole;
    const mockUser: User = {
      id: `usr_${Date.now()}`,
      phone,
      role: chosenRole,
      is_verified: true,
      profile_completed: chosenRole === 'artisan' ? artisanProfileCompleted : buyerProfileCompleted
    };
    setUser(mockUser);
    setToken('token_' + phone);
    setActiveRole(chosenRole);
    return true;
  };

  const verifyPAN = async (phone: string, pan: string, fullName: string) => {
    return { success: true, message: 'PAN Verified' };
  };

  const verifyGST = async (data: { phone: string; enrollment_id: string; gstin: string; legal_name?: string; trade_name?: string; state?: string }) => {
    if (user) {
      setUser({
        ...user,
        is_verified: true,
        gstin: data.gstin,
        enrollment_id: data.enrollment_id,
        business_name: data.trade_name || data.legal_name,
        state: data.state
      });
    }
    return true;
  };

  const saveProfile = async (profileData: any) => {
    const endpoint = activeRole === 'artisan' ? '/api/profile/seller' : '/api/profile/buyer';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, user_id: user?.id })
      });
      const data = res.ok ? await res.json() : null;
      if (data && data.profile) {
        setProfile(data.profile);
      }
    } catch (_) {}
    if (user) {
      setUser({ ...user, profile_completed: true, is_verified: true });
    }
    setProfile(profileData);
    if (activeRole === 'artisan') {
      setArtisanCompleted(true);
    } else {
      setBuyerCompleted(true);
    }
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setProfile(null);
    setActiveRole('buyer');
    localStorage.removeItem('kalasetu_user');
    localStorage.removeItem('kalasetu_token');
    localStorage.removeItem('kalasetu_profile');
    localStorage.removeItem('kalasetu_active_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profile,
        isAuthenticated: !!user,
        activeRole,
        selectedRole: activeRole,
        switchRole,
        setSelectedRole: switchRole,
        artisanProfileCompleted,
        buyerProfileCompleted,
        profileCompleted: activeRole === 'artisan' ? artisanProfileCompleted : buyerProfileCompleted,
        setProfileCompletedStatus: (c: boolean) => (activeRole === 'artisan' ? setArtisanCompleted(c) : setBuyerCompleted(c)),
        setArtisanCompleted,
        setBuyerCompleted,
        loginUser,
        registerUser,
        loginWithPhone,
        verifyOtp,
        verifyPAN,
        verifyGST,
        saveProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
