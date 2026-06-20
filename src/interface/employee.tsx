export interface Employee {
  id: string | number;
  employee_number: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  username: string;
  position_name?: string;
  status?: string;
  password: string;
  status_id?: string;
  position_id: string;
  date_created: string;
  date_updated: string;
}

export interface EmployeesTableProps {
  page_type: string;
}

export interface AlertState {
  show: boolean;
  message: string;
  type: string;
}

export interface FetchParams {
  type: string;
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  status: string;
  position_id: string;
}

export interface CreateEmployeesModalProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  onSave: (data: Employee) => Promise<{ success: boolean; errors?: Record<string, string> }>;
}

export interface UpdateEmployeesModalProps {
  selectedItem: Employee;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  onSave: (data: Employee) => Promise<{ success: boolean; errors?: Record<string, string> }>;
}

export interface ViewEmployeesModalProps {
  selectedItem: Employee;
  showViewModal: boolean;
  setShowViewModal: (show: boolean) => void;
}

export const initialFormState: Employee = {
  id: '',
  employee_number: '',
  firstname: '',
  lastname: '',
  middlename: '',
  username: '',
  position_name: '',
  status: 'Active',
  password: '',
  status_id: '',
  position_id: '',
  date_created: '',
  date_updated: ''
};
