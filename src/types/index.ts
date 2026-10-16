export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  status: 'available' | 'maintenance' | 'out_of_service';
  imageUrl: string;
  details: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus = 'pending' | 'approved' | 'returned' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  equipmentImageUrl?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userStudentId: string;
  userDepartment?: string;
  quantity: number;
  borrowDate: string;
  returnDate: string;
  purpose: string;
  courseOrProject?: string;
  status: BookingStatus;
  conditionOnReturn?: string;
  adminNotes?: string;
  approvedAt?: string;
  returnedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  studentId?: string;
  department?: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminEmailDoc {
  id: string;
  email: string;
  addedBy: string;
  createdAt: string;
}
