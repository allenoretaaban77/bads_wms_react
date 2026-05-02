import create from 'zustand';
import { login as loginApi } from '../api/authService';
import { setAccessToken } from '../api/apiService';

// localStorage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'wms_access_token',
  USER_DATA: 'wms_user_data',
  IS_LOGGED_IN: 'wms_is_logged_in',
  USERNAME: 'wms_username',
};

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME) || '';

    if (accessToken && userData && isLoggedIn) {
      // Set token in apiService for immediate use
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
  { key: 'inventory', label: 'Inventory' },
  { key: 'stocks', label: 'Stocks' },
  { key: 'sales', label: 'Sales' },
  { key: 'users', label: 'Users' },
  { key: 'profile', label: 'Profile' },
  { key: 'logout', label: 'Logout' },
];

const sampleRows = [
  { item: 'Item A', status: 'Available', qty: 24 },
  { item: 'Item B', status: 'Low Stock', qty: 8 },
  { item: 'Item C', status: 'Pending', qty: 14 },
  { item: 'Item D', status: 'Available', qty: 65 },
];

const initialState = loadInitialState();

const useAppViewModel = create((set, get) => ({
  ...initialState,
  password: '',
  activeMenu: 'inventory',
  sidebarCollapsed: true,
  formError: '',
  isLoading: false,
  menuItems,
  sampleRows,

  // Save state to localStorage
  saveAuthState: (isLoggedIn, accessToken, userData, username) => {
    try {
      if (isLoggedIn && accessToken && userData) {
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.USERNAME, username);
      } else {
        // Clear auth data
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.USERNAME);
      }
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  },

  setField: (name, value) => set({ [name]: value, formError: '' }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  selectMenu: (key) => {
    if (key === 'logout') {
      get().logout();
      return;
    }
    set({ activeMenu: key });
  },

  login: async () => {
    const { username, password } = get();
    
    // Validate inputs
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

    // Set loading state
    set({ isLoading: true, formError: '' });

    try {
      const result = await loginApi(username, password);

      if (result.success) {
        const { data } = result;
        
        // Set access token for future API calls
        setAccessToken(data.access_token || '');
        
        const userData = {
          id: data.id,
          employee_id: data.employee_id,
          employee_number: data.employee_number,
          firstname: data.firstname,
          lastname: data.lastname,
          surname: data.surname,
          username: data.username,
          position_name: data.position_name,
          position_id: data.position_id,
          status: data.status,
          status_id: data.status_id,
          date_created: data.date_created,
          date_updated: data.date_updated
        };
        
        // Save to localStorage
        get().saveAuthState(true, data.access_token || '', userData, username);
        
        set({ 
          isLoggedIn: true, 
          activeMenu: 'inventory', 
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
    // Show confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to logout?');
    
    if (isConfirmed) {
      // Clear access token from apiService
      setAccessToken('');
      
      // Clear localStorage
      get().saveAuthState(false, '', null, '');
      
      set({
        isLoggedIn: false,
        username: '',
        password: '',
        activeMenu: 'inventory',
        sidebarCollapsed: true,
        formError: '',
        accessToken: '',
        userData: null,
        isLoading: false,
      });
    }
  },
}));

export default useAppViewModel;
