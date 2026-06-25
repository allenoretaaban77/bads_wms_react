import { create } from 'zustand';
import { login as loginApi } from '../api/authService';
import { setAccessToken } from '../api/tokenService';
import { APP_CONFIG } from '../config/constants';

// localStorage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'wms_access_token',
  USER_DATA: 'wms_user_data',
  IS_LOGGED_IN: 'wms_is_logged_in',
  USERNAME: 'wms_username',
};

// 1. Define the User Data shape explicitly
interface UserData {
  id: any;
  employee_id: any;
  employee_number: any;
  firstname: string;
  lastname: string;
  middlename: string;
  username: string;
  position_name: string;
  position_id: any;
  status: any;
  status_id: any;
  date_created: string;
  date_updated: string;
}

// 2. Define the Complete Store State and Actions Interface
interface AppViewModelState {
  // State variables
  isLoggedIn: boolean;
  accessToken: string;
  userData: UserData | null;
  username: string;
  password?: string;
  activeMenu: string;
  activeTitle?: string;
  activeLabel?: string;
  sidebarCollapsed: boolean;
  formError: string;
  isLoading: boolean;
  menuItems: Array<{ key: string; label: string; children?: Array<{ key: string; label: string }> }>;

  // Actions / Methods
  saveAuthState: (isLoggedIn: boolean, accessToken: string, userData: UserData | null, username: string) => void;
  setField: (name: string, value: any) => void;
  toggleSidebar: () => void;
  selectMenu: (key: string, type: string, label: string) => void;
  login: () => Promise<{ success: boolean; error?: string; data?: any }>;
  logout: () => void;
}

// Load initial state from localStorage
const loadInitialState = (): Pick<AppViewModelState, 'isLoggedIn' | 'accessToken' | 'userData' | 'username'> => {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME) || '';

    if (accessToken && userData && isLoggedIn) {
      setAccessToken(accessToken);
      
      return {
        isLoggedIn: true,
        accessToken,
        userData: JSON.parse(userData),
        username,
      };
    }
  } catch (error) {
    console.error('Error loading initial state:', error);
  }
  
  return {
    isLoggedIn: false,
    accessToken: '',
    userData: null,
    username: '',
  };
};

const menuItems = [
  { 
    key: 'inventory', 
    label: 'Inventory',
    children: Object.entries(APP_CONFIG.INVENTORY_MENU).map(([key, value]) => ({
      key: `inventory|${value.toLowerCase().replace(/[\s&]+/g, '_')}`, // e.g., 'inventory_nuts_bolts'
      label: value,                                       // e.g., 'Nuts & Bolts'
      title: `Inventory Management - `                        // e.g., 'Nuts & Bolts Management'
    })),
    title: 'Inventory Management'
  },
  { key: 'replenishment', label: 'Replenishment', title: 'Stock Replenishment',
    children: [
      { key: 'replenishment_management', label: 'Stock Management', title: 'Stock Management' },
      { key: 'suppliers', label: 'Suppliers', title: 'Suppliers' },
    ]
  },
  { key: 'sales', label: 'Sales', title: 'Sales Management' },
  { key: 'returns', label: 'Returns', title: 'Returns Management' },
  { key: 'employees', label: 'Employees', title: 'Employees Management' },
  { key: 'reports', label: 'Reports', title: 'Daily Sales Reports',
    children: [
      { key: 'reports|sales', label: 'Daily Sales Reports', title: 'Daily Sales Reports' },
      // { key: 'reports_generate', label: 'Generate Reeports', title: 'Generate Reeports' }
    ] 
  },
  { 
    key: 'logout', 
    label: 'Logout',
  },
];

const initialState = loadInitialState();

// 3. Pass <AppViewModelState> generic here to permanently clean up all "unknown" errors
const useAppViewModel = create<AppViewModelState>((set, get) => ({
  ...initialState,
  password: '',
  activeMenu: 'inventory',
  activeTitle: '',
  sidebarCollapsed: false,
  formError: '',
  isLoading: false,
  menuItems,

  saveAuthState: (isLoggedIn, accessToken, userData, username) => {
    try {
      if (isLoggedIn && accessToken && userData) {
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.USERNAME, username);
      } else {
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.USERNAME);
      }
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  },

  setField: (name, value) => set((state) => ({ ...state, [name]: value, formError: '' })),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // 4. Safely uncommented and typed!
  selectMenu: (key: string, title: string, label: string) => {
    if (key === 'logout') {
      get().logout(); // Works instantly!
      return;
    }
    set({ activeMenu: key, activeTitle: title, activeLabel: label });
  },

  login: async () => {
    // Clean code: type assertions like 'as { username: string }' are no longer required
    const { username, password } = get();
    
    if (!username && !password) {
      set({ formError: 'Please enter both username and password' });
      return { success: false, error: 'Please enter both username and password' };
    }
    
    if (!username) {
      set({ formError: 'Username is required' });
      return { success: false, error: 'Username is required' };
    }
    
    if (!password) {
      set({ formError: 'Password is required' });
      return { success: false, error: 'Password is required' };
    }

    set({ isLoading: true, formError: '' });

    try {
      const result = await loginApi(username, password);

      if (result.success) {
        const { data } = result;
        
        setAccessToken(data.access_token || '');
        
        const userData: UserData = {
          id: data.id,
          employee_id: data.employee_id,
          employee_number: data.employee_number,
          firstname: data.firstname,
          lastname: data.lastname,
          middlename: data.middlename,
          username: data.username,
          position_name: data.position_name,
          position_id: data.position_id,
          status: data.status,
          status_id: data.status_id,
          date_created: data.date_created,
          date_updated: data.date_updated
        };
        
        get().saveAuthState(true, data.access_token || '', userData, username);
        
        set({ 
          isLoggedIn: true, 
          activeMenu: 'inventory', 
          activeTitle: '', 
          activeLabel: '', 
          formError: '', 
          isLoading: false,
          accessToken: data.access_token || '',
          userData,
        });
      } else {
        set({ formError: result.error || 'Login failed', isLoading: false });
      }

      return result;
    } catch (error) {
      set({ formError: 'An unexpected error occurred', isLoading: false });
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  logout: () => {
    const isConfirmed = window.confirm('Are you sure you want to logout?');
    
    if (isConfirmed) {
      setAccessToken('');
      get().saveAuthState(false, '', null, '');
      
      set({
        isLoggedIn: false,
        username: '',
        password: '',
        activeMenu: 'inventory',
        activeTitle: '',
        activeLabel: '',
        sidebarCollapsed: false,
        formError: '',
        accessToken: '',
        userData: null,
        isLoading: false,
      });
    }
  },
}));

export default useAppViewModel;
