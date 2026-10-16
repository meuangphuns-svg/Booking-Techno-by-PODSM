import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { Equipment, Booking, AdminEmailDoc } from '../types';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SEED_EQUIPMENT, DEFAULT_EQUIPMENTS } from '../data/seedData';
import { 
  LayoutDashboard, 
  Package, 
  CalendarClock, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  Search, 
  Sparkles, 
  Printer, 
  ShieldCheck, 
  UserPlus, 
  MapPin, 
  Eye, 
  Layers, 
  ArrowLeft,
  SlidersHorizontal,
  FileSpreadsheet,
  Clock,
  Check,
  TrendingUp,
  Boxes,
  Database,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { BookingSlipModal } from './BookingSlipModal';

interface AdminBackofficeProps {
  onExitBackoffice: () => void;
}

export const AdminBackoffice: React.FC<AdminBackofficeProps> = ({ onExitBackoffice }) => {
  const { currentUser, isSuperAdmin, isAdmin, adminEmails, addAdminEmail, removeAdminEmail } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'equipments' | 'reports' | 'admins'>('overview');
  
  // Data lists
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Equipment Modal state (Create / Edit)
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [eqCode, setEqCode] = useState('');
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('กล้องถ่ายภาพและวิดีโอ');
  const [eqTotalQty, setEqTotalQty] = useState<number>(1);
  const [eqAvailableQty, setEqAvailableQty] = useState<number>(1);
  const [eqStatus, setEqStatus] = useState<Equipment['status']>('available');
  const [eqImageUrl, setEqImageUrl] = useState('');
  const [eqDetails, setEqDetails] = useState('');
  const [eqLocation, setEqLocation] = useState('ห้องปฏิบัติการ 302 อาคารศึกษาศาสตร์ 1');
  const [savingEquipment, setSavingEquipment] = useState(false);

  // Return inspection modal
  const [returningBooking, setReturningBooking] = useState<Booking | null>(null);
  const [returnCondition, setReturnCondition] = useState('สภาพสมบูรณ์ปกติ พร้อมอุปกรณ์เสริมครบถ้วน');
  const [returnAdminNote, setReturnAdminNote] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Rejection modal
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('อุปกรณ์มีความจำเป็นต้องใช้ในการเรียนการสอนวิชาหลักในช่วงเวลาดังกล่าว');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Slip modal
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<Booking | null>(null);

  // In-app Approval Modal state (replaces window.confirm)
  const [approvingBooking, setApprovingBooking] = useState<Booking | null>(null);
  const [approvalAdminNote, setApprovalAdminNote] = useState('ตรวจเช็คสภาพสมบูรณ์ ส่งมอบอุปกรณ์เรียบร้อย');
  const [isProcessingApprove, setIsProcessingApprove] = useState(false);
  const [approvalErrorMsg, setApprovalErrorMsg] = useState('');

  // In-app Delete Equipment Modal state (replaces window.confirm)
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);
  const [isDeletingEquipment, setIsDeletingEquipment] = useState(false);

  // New admin email input
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState('');

  // Seeding state
  const [seeding, setSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState('');

  // Filters
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [equipmentSearch, setEquipmentSearch] = useState<string>('');
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState<string>('ทั้งหมด');

  // Listen to equipments from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'equipments'),
      (snapshot) => {
        const list: Equipment[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Equipment);
        });
        if (list.length === 0) {
          // If empty, display default educational tech gear
          setEquipments(DEFAULT_EQUIPMENTS);
        } else {
          list.sort((a, b) => a.code.localeCompare(b.code));
          setEquipments(list);
        }
        setLoadingEquipments(false);
      },
      (error) => {
        console.warn('Equipments admin listener note:', error);
        setEquipments(DEFAULT_EQUIPMENTS);
        setLoadingEquipments(false);
      }
    );
    return () => unsub();
  }, []);

  // Listen to all bookings
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Booking);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(list);
        setLoadingBookings(false);
      },
      (error) => {
        console.warn('Bookings admin listener note:', error);
        setLoadingBookings(false);
      }
    );
    return () => unsub();
  }, []);

  // Open equipment modal
  const handleOpenAddEquipment = () => {
    setEditingEquipment(null);
    setEqCode(`EQ-${Math.floor(100 + Math.random() * 900)}`);
    setEqName('');
    setEqCategory('กล้องถ่ายภาพและวิดีโอ');
    setEqTotalQty(1);
    setEqAvailableQty(1);
    setEqStatus('available');
    setEqImageUrl('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80');
    setEqDetails('');
    setEqLocation('ห้อง Lab 302 อาคารศึกษาศาสตร์ 1');
    setIsEquipmentModalOpen(true);
  };

  const handleOpenEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setEqCode(item.code);
    setEqName(item.name);
    setEqCategory(item.category);
    setEqTotalQty(item.totalQuantity);
    setEqAvailableQty(item.availableQuantity);
    setEqStatus(item.status);
    setEqImageUrl(item.imageUrl);
    setEqDetails(item.details || '');
    setEqLocation(item.location || '');
    setIsEquipmentModalOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName.trim() || !eqCode.trim()) return;

    setSavingEquipment(true);
    const path = 'equipments';
    try {
      const payload: Omit<Equipment, 'id'> = {
        code: eqCode.trim().toUpperCase(),
        name: eqName.trim(),
        category: eqCategory,
        totalQuantity: Number(eqTotalQty),
        availableQuantity: Number(eqAvailableQty),
        status: eqStatus,
        imageUrl: eqImageUrl.trim() || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
        details: eqDetails.trim(),
        location: eqLocation.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (editingEquipment) {
        await updateDoc(doc(db, 'equipments', editingEquipment.id), payload);
      } else {
        await addDoc(collection(db, path), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }
      setIsEquipmentModalOpen(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, editingEquipment ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setSavingEquipment(false);
    }
  };

  const handleDeleteEquipment = (item: Equipment) => {
    setDeletingEquipment(item);
  };

  const executeDeleteEquipment = async () => {
    if (!deletingEquipment) return;
    setIsDeletingEquipment(true);
    const path = `equipments/${deletingEquipment.id}`;
    try {
      await deleteDoc(doc(db, 'equipments', deletingEquipment.id));
      setSeedSuccessMsg(`ลบอุปกรณ์ "${deletingEquipment.name}" ออกจากระบบเรียบร้อยแล้ว`);
      setTimeout(() => setSeedSuccessMsg(''), 4000);
      setDeletingEquipment(null);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, path);
    } finally {
      setIsDeletingEquipment(false);
    }
  };

  // Seed / Sync 12 default equipments into Firestore (No window.confirm)
  const handleSeedAllEquipment = async () => {
    setSeeding(true);
    setSeedSuccessMsg('');
    const path = 'equipments';
    try {
      for (const item of SEED_EQUIPMENT) {
        const docId = `edtech-${item.code.toLowerCase()}`;
        await setDoc(doc(db, path, docId), {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setSeedSuccessMsg('✅ นำเข้าอุปกรณ์ 12 รายการเข้าสู่ฐานข้อมูล Firestore สำเร็จเรียบร้อยแล้ว!');
      setTimeout(() => setSeedSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setSeeding(false);
    }
  };

  // Open Approval In-App Modal
  const handleOpenApproveModal = (booking: Booking) => {
    setApprovingBooking(booking);
    setApprovalAdminNote('ตรวจเช็คสภาพอุปกรณ์สมบูรณ์ ส่งมอบอุปกรณ์เรียบร้อย');
    setApprovalErrorMsg('');
  };

  // Execute approval directly in Firestore
  const executeApproveBooking = async () => {
    if (!approvingBooking) return;
    setIsProcessingApprove(true);
    setApprovalErrorMsg('');

    try {
      // 1. Update booking status to approved
      const bookingRef = doc(db, 'bookings', approvingBooking.id);
      await updateDoc(bookingRef, {
        status: 'approved',
        adminNotes: approvalAdminNote.trim() || 'อนุมัติการยืมเรียบร้อย',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 2. Adjust available inventory on equipment if present
      if (approvingBooking.equipmentId) {
        try {
          const eqRef = doc(db, 'equipments', approvingBooking.equipmentId);
          const eqDoc = await getDoc(eqRef);
          if (eqDoc.exists()) {
            const eqData = eqDoc.data() as Equipment;
            const currentQty = eqData.availableQuantity ?? eqData.totalQuantity ?? 1;
            const newAvailable = Math.max(0, currentQty - approvingBooking.quantity);
            await updateDoc(eqRef, {
              availableQuantity: newAvailable,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (eqErr) {
          console.warn('Equipment inventory update note:', eqErr);
        }
      }

      setSeedSuccessMsg(`✅ อนุมัติการยืมอุปกรณ์ "${approvingBooking.equipmentName}" ให้กับ ${approvingBooking.userName} เรียบร้อยแล้ว!`);
      setTimeout(() => setSeedSuccessMsg(''), 5000);
      setApprovingBooking(null);
    } catch (err: any) {
      console.error('Approval failed:', err);
      setApprovalErrorMsg(`เกิดข้อผิดพลาดในการอนุมัติ: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsProcessingApprove(false);
    }
  };

  // Record Return & restore inventory (uses in-app returningBooking modal)
  const handleConfirmReturn = async () => {
    if (!returningBooking) return;
    setSubmittingReturn(true);

    try {
      const bookingRef = doc(db, 'bookings', returningBooking.id);
      await updateDoc(bookingRef, {
        status: 'returned',
        conditionOnReturn: returnCondition.trim(),
        adminNotes: returnAdminNote.trim(),
        returnedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (returningBooking.equipmentId) {
        try {
          const eqRef = doc(db, 'equipments', returningBooking.equipmentId);
          const eqDoc = await getDoc(eqRef);
          if (eqDoc.exists()) {
            const eqData = eqDoc.data() as Equipment;
            const currentQty = eqData.availableQuantity ?? 0;
            const maxQty = eqData.totalQuantity ?? 10;
            const newAvailable = Math.min(maxQty, currentQty + returningBooking.quantity);
            await updateDoc(eqRef, {
              availableQuantity: newAvailable,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (eqErr) {
          console.warn('Equipment inventory restore note:', eqErr);
        }
      }

      setSeedSuccessMsg(`✅ บันทึกการส่งคืนอุปกรณ์ "${returningBooking.equipmentName}" เรียบร้อยแล้ว สต็อกถูกปรับคืนเข้าสู่คลัง`);
      setTimeout(() => setSeedSuccessMsg(''), 5000);
      setReturningBooking(null);
    } catch (err: any) {
      console.error('Return failed:', err);
      setSeedSuccessMsg(`เกิดข้อผิดพลาดในการบันทึกการคืน: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Reject Booking (uses in-app rejectingBooking modal)
  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    setSubmittingReject(true);

    try {
      await updateDoc(doc(db, 'bookings', rejectingBooking.id), {
        status: 'rejected',
        adminNotes: rejectReason.trim(),
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSeedSuccessMsg(`ปฏิเสธคำขอยืม "${rejectingBooking.equipmentName}" เรียบร้อยแล้ว`);
      setTimeout(() => setSeedSuccessMsg(''), 4000);
      setRejectingBooking(null);
    } catch (err: any) {
      console.error('Reject failed:', err);
      setSeedSuccessMsg(`เกิดข้อผิดพลาด: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setSubmittingReject(false);
    }
  };

  // Add Admin Email
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAddingAdmin(true);
    setAdminActionMsg('');
    try {
      await addAdminEmail(newAdminEmail.trim());
      setAdminActionMsg(`เพิ่มสิทธิ์ผู้ดูแลระบบให้ ${newAdminEmail.trim()} สำเร็จแล้ว`);
      setNewAdminEmail('');
      setTimeout(() => setAdminActionMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setAdminActionMsg('เกิดข้อผิดพลาดในการเพิ่มสิทธิ์แอดมิน');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Calculated Stats
  const totalEquipmentsCount = equipments.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
  const totalAvailableCount = equipments.reduce((sum, item) => sum + (item.availableQuantity || 0), 0);
  const totalBorrowedCount = Math.max(0, totalEquipmentsCount - totalAvailableCount);
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeLoans = bookings.filter((b) => b.status === 'approved');
  const returnedBookings = bookings.filter((b) => b.status === 'returned');
  const maintenanceCount = equipments.filter((e) => e.status === 'maintenance').length;

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const matchesSearch =
      b.equipmentName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.userName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.userStudentId.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.equipmentCode.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered equipments
  const filteredEquipments = equipments.filter((item) => {
    const matchesCategory = equipmentCategoryFilter === 'ทั้งหมด' || item.category === equipmentCategoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      item.code.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(equipmentSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[85vh] bg-slate-900 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Top Backoffice App Bar */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">
                ระบบจัดการหลังบ้าน (Admin Backoffice)
              </span>
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                EdTech Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>ฐานข้อมูล Firestore: <strong className="text-orange-300 font-mono">edtech-borrowing</strong></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-400 font-medium">ออนไลน์</span>
            </p>
          </div>
        </div>

        {/* Backoffice Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSeedAllEquipment}
            disabled={seeding}
            className="bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="บันทึกอุปกรณ์ 12 ชิ้นเข้าสู่ Firestore"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>{seeding ? 'กำลังนำเข้า...' : 'ซิงค์อุปกรณ์ 12 รายการเข้าสู่คลัง'}</span>
          </button>

          <button
            onClick={onExitBackoffice}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-orange-500/25 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>กลับสู่หน้าเว็บผู้ใช้งาน (Frontend)</span>
          </button>
        </div>
      </div>

      {/* Main Backoffice Container with Sidebar & Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-950/70 border-r border-slate-800/80 p-4 space-y-6 flex-shrink-0">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              เมนูบริหารจัดการ
            </p>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>แดชบอร์ดภาพรวม</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="w-4 h-4" />
                  <span>คำขอยืม-คืนอุปกรณ์</span>
                </div>
                {pendingBookings.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingBookings.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('equipments')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'equipments'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  <span>คลังอุปกรณ์และสต็อก</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {equipments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>รายงานและประวัติ</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>สิทธิ์แอดมินและผู้ดูแล</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Quick System Badge */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
              สถานะสิทธิ์ในระบบ
            </span>
            <p className="text-xs font-semibold text-white truncate">
              {currentUser?.email || 'Admin Mode (Active)'}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>ได้รับสิทธิ์บริหารจัดการ</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {seedSuccessMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-2xl p-4 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{seedSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">อุปกรณ์ทั้งหมดในระบบ</p>
                      <h3 className="text-3xl font-extrabold text-white mt-1">{totalEquipmentsCount}</h3>
                      <p className="text-[11px] text-orange-400 mt-1">{equipments.length} รายการ (พร้อมให้บริการ)</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Boxes className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">กำลังถูกยืมใช้งาน</p>
                      <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{totalBorrowedCount}</h3>
                      <p className="text-[11px] text-slate-400 mt-1">{activeLoans.length} รายการที่ส่งมอบแล้ว</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">คำขอยืมรอการอนุมัติ</p>
                      <h3 className="text-3xl font-extrabold text-red-400 mt-1">{pendingBookings.length}</h3>
                      <p className="text-[11px] text-red-300 mt-1">ต้องตรวจเช็คก่อนจ่ายของ</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">ประวัติการคืนสมบูรณ์</p>
                      <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{returnedBookings.length}</h3>
                      <p className="text-[11px] text-emerald-300 mt-1">คืนเข้าคลังเรียบร้อย</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action shortcuts banner */}
              <div className="bg-gradient-to-r from-orange-950/60 via-slate-800/80 to-slate-800/80 rounded-3xl p-6 border border-orange-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <span>คลังอุปกรณ์เริ่มต้น ภาควิชาเทคโนโลยีการศึกษา</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    มีอุปกรณ์สตูดิโอ 12 รายการพร้อมใช้งาน (กล้อง A7 IV, ไมค์ DJI Mic 2, กิมบอล RS3, ขาตั้ง Manfrotto, ไฟ Amaran, จอ Wacom, แว่น VR)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleSeedAllEquipment}
                    disabled={seeding}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-orange-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                    <span>ซิงค์ 12 รายการเข้าสู่ Firestore</span>
                  </button>
                  <button
                    onClick={handleOpenAddEquipment}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs border border-slate-600 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มอุปกรณ์ชิ้นใหม่</span>
                  </button>
                </div>
              </div>

              {/* Pending Queue Priority Table */}
              <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/60 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">
                      รายการขอยืมที่รออนุมัติเร่งด่วน ({pendingBookings.length} คำขอ)
                    </h3>
                    <p className="text-xs text-slate-400">กดปุ่มอนุมัติเมื่อผู้ยืมมาติดต่อรับอุปกรณ์ ณ ห้องปฏิบัติการ</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('bookings');
                      setBookingStatusFilter('pending');
                    }}
                    className="text-xs text-orange-400 font-semibold hover:underline"
                  >
                    ดูรายการคำขอทั้งหมด →
                  </button>
                </div>

                {pendingBookings.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
                    ✨ ยอดเยี่ยม! ไม่มีคำขอยืมตกค้างที่รออนุมัติในขณะนี้
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-700">
                        <tr>
                          <th className="py-3 px-4">ผู้ขอยืม</th>
                          <th className="py-3 px-4">อุปกรณ์</th>
                          <th className="py-3 px-4">จำนวน</th>
                          <th className="py-3 px-4">กำหนดวันยืม - คืน</th>
                          <th className="py-3 px-4">วัตถุประสงค์</th>
                          <th className="py-3 px-4 text-right">ดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60">
                        {pendingBookings.slice(0, 5).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-700/30 transition">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white">{b.userName}</p>
                              <p className="text-slate-400 text-[11px] font-mono">{b.userStudentId || '-'}</p>
                              <p className="text-orange-400 text-[11px]">{b.userPhone}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-white">{b.equipmentName}</p>
                              <span className="font-mono text-orange-400 text-[10px] bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/30">
                                {b.equipmentCode}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white">{b.quantity} ชิ้น</td>
                            <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                              <div>ยืม: {b.borrowDate}</div>
                              <div className="text-orange-300">คืน: {b.returnDate}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">{b.purpose}</td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenApproveModal(b)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-md transition cursor-pointer"
                              >
                                อนุมัติการยืม
                              </button>
                              <button
                                onClick={() => setRejectingBooking(b)}
                                className="bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40 px-2.5 py-1.5 rounded-lg text-xs transition"
                              >
                                ปฏิเสธ
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BOOKING OPERATIONS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Filter bar */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="ค้นหาชื่อผู้ยืม, รหัสนักศึกษา, อุปกรณ์..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {[
                    { key: 'all', label: 'ทั้งหมด' },
                    { key: 'pending', label: 'รออนุมัติ', count: pendingBookings.length },
                    { key: 'approved', label: 'กำลังยืม', count: activeLoans.length },
                    { key: 'returned', label: 'คืนแล้ว' },
                    { key: 'rejected', label: 'ปฏิเสธ' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setBookingStatusFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        bookingStatusFilter === tab.key
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings Table */}
              <div className="bg-slate-800/80 rounded-3xl border border-slate-700/60 shadow-xl overflow-hidden">
                {filteredBookings.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    ไม่พบรายการคำขอในสถานะที่เลือก
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-300 font-bold border-b border-slate-700">
                        <tr>
                          <th className="py-3 px-4">สถานะ</th>
                          <th className="py-3 px-4">ผู้ขอยืม</th>
                          <th className="py-3 px-4">อุปกรณ์</th>
                          <th className="py-3 px-4">จำนวน</th>
                          <th className="py-3 px-4">กำหนดวันยืม - คืน</th>
                          <th className="py-3 px-4">วัตถุประสงค์</th>
                          <th className="py-3 px-4 text-right">ดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-700/30 transition">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {b.status === 'pending' && (
                                <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                                  รออนุมัติ
                                </span>
                              )}
                              {b.status === 'approved' && (
                                <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                                  กำลังยืม
                                </span>
                              )}
                              {b.status === 'returned' && (
                                <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                                  คืนแล้ว
                                </span>
                              )}
                              {b.status === 'rejected' && (
                                <span className="inline-block bg-red-500/20 text-red-300 border border-red-500/40 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                                  ถูกปฏิเสธ
                                </span>
                              )}
                              {b.status === 'cancelled' && (
                                <span className="inline-block bg-slate-700 text-slate-400 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                                  ยกเลิกแล้ว
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white">{b.userName}</p>
                              <p className="text-slate-400 text-[11px] font-mono">{b.userStudentId || '-'}</p>
                              <p className="text-orange-400 text-[11px]">{b.userPhone}</p>
                            </td>

                            <td className="py-3.5 px-4 max-w-[200px]">
                              <p className="font-bold text-white leading-snug truncate">{b.equipmentName}</p>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {b.equipmentCode}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-white">
                              {b.quantity} ชิ้น
                            </td>

                            <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                              <div>ยืม: <span className="font-medium text-white">{b.borrowDate}</span></div>
                              <div>คืน: <span className="font-medium text-orange-400">{b.returnDate}</span></div>
                            </td>

                            <td className="py-3.5 px-4 max-w-[220px]">
                              <p className="text-slate-300 line-clamp-2">{b.purpose}</p>
                              {b.conditionOnReturn && (
                                <p className="text-[11px] text-emerald-400 mt-1 bg-emerald-950/40 p-1 rounded border border-emerald-500/20">
                                  สภาพคืน: {b.conditionOnReturn}
                                </p>
                              )}
                              {b.adminNotes && (
                                <p className="text-[11px] text-amber-300 mt-0.5 bg-amber-950/40 p-1 rounded border border-amber-500/20">
                                  โน้ต: {b.adminNotes}
                                </p>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedBookingForSlip(b)}
                                className="p-1.5 text-orange-400 hover:bg-slate-700 rounded-lg transition"
                                title="ดูใบยืมอุปกรณ์"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleOpenApproveModal(b)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                                  >
                                    อนุมัติการยืม
                                  </button>
                                  <button
                                    onClick={() => setRejectingBooking(b)}
                                    className="bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 px-2 py-1 rounded-lg text-xs transition"
                                  >
                                    ปฏิเสธ
                                  </button>
                                </>
                              )}

                              {b.status === 'approved' && (
                                <button
                                  onClick={() => {
                                    setReturningBooking(b);
                                    setReturnCondition('สภาพสมบูรณ์ปกติ พร้อมอุปกรณ์เสริมครบถ้วน');
                                    setReturnAdminNote('');
                                  }}
                                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1 rounded-lg text-xs transition flex items-center gap-1 inline-flex"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>บันทึกการคืน</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EQUIPMENT INVENTORY */}
          {activeTab === 'equipments' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ, รหัสอุปกรณ์, ตู้จัดเก็บ..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSeedAllEquipment}
                    disabled={seeding}
                    className="bg-slate-900 hover:bg-slate-700 text-orange-400 border border-orange-500/30 font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>ซิงค์ 12 รายการเข้าสู่ Firestore</span>
                  </button>
                  <button
                    onClick={handleOpenAddEquipment}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มอุปกรณ์ใหม่</span>
                  </button>
                </div>
              </div>

              {/* Equipment Table */}
              <div className="bg-slate-800/80 rounded-3xl border border-slate-700/60 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-300 font-bold border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">รูปภาพ</th>
                        <th className="py-3 px-4">รหัส</th>
                        <th className="py-3 px-4">ชื่ออุปกรณ์</th>
                        <th className="py-3 px-4">หมวดหมู่</th>
                        <th className="py-3 px-4">คงเหลือ / ทั้งหมด</th>
                        <th className="py-3 px-4">สถานที่จัดเก็บ</th>
                        <th className="py-3 px-4">สถานะ</th>
                        <th className="py-3 px-4 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {filteredEquipments.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-700/30 transition">
                          <td className="py-2.5 px-4">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                          </td>

                          <td className="py-2.5 px-4 font-mono font-bold text-orange-400">
                            {item.code}
                          </td>

                          <td className="py-2.5 px-4 font-bold text-white max-w-[200px]">
                            <p className="truncate">{item.name}</p>
                          </td>

                          <td className="py-2.5 px-4 text-slate-300">
                            {item.category}
                          </td>

                          <td className="py-2.5 px-4">
                            <span className="font-bold text-orange-400">{item.availableQuantity}</span> / {item.totalQuantity} ชิ้น
                          </td>

                          <td className="py-2.5 px-4 text-slate-400">
                            {item.location || '-'}
                          </td>

                          <td className="py-2.5 px-4">
                            {item.status === 'available' ? (
                              <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold text-[11px]">
                                พร้อมใช้งาน
                              </span>
                            ) : item.status === 'maintenance' ? (
                              <span className="text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded font-semibold text-[11px]">
                                ซ่อมบำรุง
                              </span>
                            ) : (
                              <span className="text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded font-semibold text-[11px]">
                                งดให้บริการ
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditEquipment(item)}
                              className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-slate-700 rounded-lg transition"
                              title="แก้ไขอุปกรณ์"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEquipment(item)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                              title="ลบอุปกรณ์"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REPORTS & LOGS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/60 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-base">รายงานสรุปการยืม-คืนอุปกรณ์</h3>
                    <p className="text-xs text-slate-400">สรุปบันทึกการใช้งานทั้งหมดของภาควิชาเทคโนโลยีการศึกษา</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์รายงานสรุป</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <p className="text-slate-400">อัตราการใช้งานอุปกรณ์ (Utilization)</p>
                    <p className="text-xl font-bold text-orange-400 mt-1">
                      {totalEquipmentsCount > 0 ? Math.round((totalBorrowedCount / totalEquipmentsCount) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <p className="text-slate-400">คำขอที่อนุมัติสำเร็จแล้วทั้งหมด</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                      {activeLoans.length + returnedBookings.length} ครั้ง
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <p className="text-slate-400">คำขอที่ถูกปฏิเสธ / ยกเลิก</p>
                    <p className="text-xl font-bold text-red-400 mt-1">
                      {bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length} ครั้ง
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">วันที่ทำรายการ</th>
                        <th className="py-2.5 px-3">ผู้ยืม</th>
                        <th className="py-2.5 px-3">อุปกรณ์</th>
                        <th className="py-2.5 px-3">ช่วงเวลายืม</th>
                        <th className="py-2.5 px-3">สถานะ</th>
                        <th className="py-2.5 px-3">สภาพตอนคืน / โน้ต</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-700/20">
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(b.createdAt).toLocaleDateString('th-TH')}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-white">{b.userName}</td>
                          <td className="py-2.5 px-3 text-slate-200">{b.equipmentName}</td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{b.borrowDate} - {b.returnDate}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-300">{b.status}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                            {b.conditionOnReturn || b.adminNotes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN ROLE MANAGEMENT */}
          {activeTab === 'admins' && (
            <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
              <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/60 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      การจัดการสิทธิ์ผู้ดูแลระบบ (Admin Role Access)
                    </h3>
                    <p className="text-xs text-slate-400">
                      เพิ่มอีเมลของอาจารย์ร่วมภาควิชา หรือผู้ช่วยแล็บ เพื่อเข้าถึงหน้าหลังบ้านนี้
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-orange-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                      👑 ผู้ดูแลระบบหลัก (Super Administrator)
                    </span>
                    <p className="font-mono font-bold text-white text-sm mt-0.5">{SUPER_ADMIN_EMAIL}</p>
                    <p className="text-[11px] text-slate-400">
                      บัญชีตั้งต้นของภาควิชาเทคโนโลยีการศึกษา ได้รับสิทธิ์สูงสุด
                    </p>
                  </div>
                  <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    เจ้าของระบบ
                  </span>
                </div>

                {/* Add admin email form */}
                <form onSubmit={handleAddAdmin} className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-300">
                    เพิ่มอีเมล Admin อื่น ๆ
                  </label>
                  {adminActionMsg && (
                    <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl p-3 text-xs">
                      {adminActionMsg}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="เช่น co_teacher@silpakorn.edu"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-orange-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={addingAdmin}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{addingAdmin ? 'กำลังเพิ่ม...' : 'เพิ่มสิทธิ์แอดมิน'}</span>
                    </button>
                  </div>
                </form>

                {/* Current Co-admins */}
                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    รายชื่อแอดมินเพิ่มเติม ({adminEmails.length} บัญชี)
                  </h4>
                  {adminEmails.length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-900/60 p-4 rounded-xl text-center">
                      ยังไม่มีการเพิ่มแอดมินคนอื่นเพิ่มเติม
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-700/60 border border-slate-700/60 rounded-2xl overflow-hidden bg-slate-900">
                      {adminEmails.map((admin) => (
                        <div key={admin.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800 transition">
                          <div>
                            <p className="font-semibold text-white text-xs">{admin.email}</p>
                            <p className="text-[10px] text-slate-400">เพิ่มโดย: {admin.addedBy}</p>
                          </div>
                          <button
                            onClick={async () => {
                              await removeAdminEmail(admin.id);
                              setSeedSuccessMsg(`ลบสิทธิ์แอดมินของ ${admin.email} เรียบร้อยแล้ว`);
                              setTimeout(() => setSeedSuccessMsg(''), 4000);
                            }}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                            title="ลบสิทธิ์"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ADD / EDIT EQUIPMENT */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden my-8 max-h-[92vh] flex flex-col text-slate-100">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-base text-white">
                {editingEquipment ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่เข้าสู่คลัง'}
              </h3>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    รหัสอุปกรณ์ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={eqCode}
                    onChange={(e) => setEqCode(e.target.value)}
                    placeholder="เช่น CAM-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold uppercase text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    หมวดหมู่อุปกรณ์
                  </label>
                  <select
                    value={eqCategory}
                    onChange={(e) => setEqCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="กล้องถ่ายภาพและวิดีโอ">กล้องถ่ายภาพและวิดีโอ</option>
                    <option value="ไมโครโฟนและระบบเสียง">ไมโครโฟนและระบบเสียง</option>
                    <option value="ขาตั้งและอุปกรณ์กันสั่น">ขาตั้งและอุปกรณ์กันสั่น</option>
                    <option value="ไฟสตูดิโอและระบบแสง">ไฟสตูดิโอและระบบแสง</option>
                    <option value="โปรเจกเตอร์และจอฉาย">โปรเจกเตอร์และจอฉาย</option>
                    <option value="อุปกรณ์ VR และสื่อปฏิสัมพันธ์">อุปกรณ์ VR และสื่อปฏิสัมพันธ์</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่ออุปกรณ์ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  placeholder="เช่น Sony Alpha 7 IV หรือ DJI Mic 2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    จำนวนทั้งหมด
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={eqTotalQty}
                    onChange={(e) => setEqTotalQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    จำนวนคงเหลือ
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={eqTotalQty}
                    value={eqAvailableQty}
                    onChange={(e) => setEqAvailableQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-orange-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={eqStatus}
                    onChange={(e) => setEqStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="available">พร้อมใช้งาน</option>
                    <option value="maintenance">ซ่อมบำรุง</option>
                    <option value="out_of_service">งดให้บริการ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL รูปภาพอุปกรณ์
                </label>
                <input
                  type="url"
                  value={eqImageUrl}
                  onChange={(e) => setEqImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  สถานที่จัดเก็บ / ตู้เก็บ
                </label>
                <input
                  type="text"
                  value={eqLocation}
                  onChange={(e) => setEqLocation(e.target.value)}
                  placeholder="เช่น ตู้ A2 ห้องปฏิบัติการ 302"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  รายละเอียด สเปค และอุปกรณ์เสริม
                </label>
                <textarea
                  rows={3}
                  value={eqDetails}
                  onChange={(e) => setEqDetails(e.target.value)}
                  placeholder="เช่น แบตเตอรี่ 2 ก้อน, สายชาร์จ, เมมโมรี่การ์ด, กระเป๋าใส่..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingEquipment}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-md"
                >
                  {savingEquipment ? 'กำลังบันทึก...' : 'บันทึกข้อมูลอุปกรณ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RETURN INSPECTION MODAL */}
      {returningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-800 p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  บันทึกการส่งคืนอุปกรณ์
                </h3>
                <p className="text-xs text-slate-400">
                  ตรวจสอบสภาพอุปกรณ์และความสมบูรณ์ก่อนรับคืนเข้าสต็อก
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">{returningBooking.equipmentName}</p>
              <p className="text-slate-400">ผู้ยืม: {returningBooking.userName} ({returningBooking.userStudentId || returningBooking.userPhone})</p>
              <p className="text-orange-400 font-semibold">จำนวนที่คืน: {returningBooking.quantity} ชิ้น</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                การตรวจสอบสภาพอุปกรณ์ที่ส่งคืน <span className="text-red-400">*</span>
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="สภาพสมบูรณ์ปกติ พร้อมอุปกรณ์เสริมครบถ้วน">
                  ✅ สภาพสมบูรณ์ปกติ พร้อมอุปกรณ์เสริมครบถ้วน
                </option>
                <option value="มีรอยขีดข่วนเล็กน้อย ไม่กระทบการใช้งาน">
                  ⚠️ มีรอยขีดข่วนเล็กน้อย ไม่กระทบการใช้งาน
                </option>
                <option value="อุปกรณ์เสริมสูญหาย (โปรดระบุในหมายเหตุ)">
                  ❌ อุปกรณ์เสริมสูญหาย (โปรดระบุในหมายเหตุ)
                </option>
                <option value="อุปกรณ์ชำรุดเสียหาย ต้องส่งซ่อมบำรุง">
                  🛠️ อุปกรณ์ชำรุดเสียหาย ต้องส่งซ่อมบำรุง
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                บันทึกหมายเหตุเพิ่มเติม
              </label>
              <textarea
                rows={2}
                value={returnAdminNote}
                onChange={(e) => setReturnAdminNote(e.target.value)}
                placeholder="เช่น คืนอุปกรณ์ตรงเวลา..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReturningBooking(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={submittingReturn}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-md"
              >
                {submittingReturn ? 'กำลังบันทึก...' : 'ยืนยันการรับคืนเข้าคลัง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT MODAL */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-red-500/30 p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  ปฏิเสธคำขอยืมอุปกรณ์
                </h3>
                <p className="text-xs text-slate-400">
                  ระบุเหตุผลเพื่อแจ้งให้ผู้ขอยืมทราบในระบบ
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">{rejectingBooking.equipmentName}</p>
              <p className="text-slate-400">ผู้ยืม: {rejectingBooking.userName}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                เหตุผลในการปฏิเสธคำขอ
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ติดช่วงสอบ, อุปกรณ์ต้องใช้จัดสัมมนาคณะ..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingReject}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-md"
              >
                {submittingReject ? 'กำลังบันทึก...' : 'ยืนยันการปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: IN-APP APPROVAL CONFIRMATION MODAL */}
      {approvingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-emerald-500/30 p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  อนุมัติการยืมอุปกรณ์
                </h3>
                <p className="text-xs text-slate-400">
                  ยืนยันการส่งมอบอุปกรณ์และตัดสต็อกในคลัง
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-[11px]">อุปกรณ์ที่ขอยืม:</p>
                  <p className="font-bold text-white text-sm">{approvingBooking.equipmentName}</p>
                  <span className="font-mono text-orange-400 text-[10px] bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/30">
                    {approvingBooking.equipmentCode}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-orange-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                    {approvingBooking.quantity} ชิ้น
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">ผู้ขอยืม:</span>
                  <p className="font-semibold text-white">{approvingBooking.userName}</p>
                  <p className="text-slate-400 font-mono">{approvingBooking.userStudentId || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">เบอร์โทรติดต่อ:</span>
                  <p className="font-semibold text-orange-400">{approvingBooking.userPhone || '-'}</p>
                </div>
              </div>

              <div className="pt-1 text-[11px]">
                <span className="text-slate-500">ช่วงเวลาที่ยืม:</span>
                <p className="font-medium text-slate-300">
                  {approvingBooking.borrowDate} ถึง {approvingBooking.returnDate}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                บันทึกหมายเหตุการส่งมอบ (ถ้ามี)
              </label>
              <input
                type="text"
                value={approvalAdminNote}
                onChange={(e) => setApprovalAdminNote(e.target.value)}
                placeholder="เช่น ตรวจเช็คอุปกรณ์และอุปกรณ์เสริมครบถ้วนแล้ว"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {approvalErrorMsg && (
              <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 rounded-xl text-xs">
                {approvalErrorMsg}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setApprovingBooking(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={executeApproveBooking}
                disabled={isProcessingApprove}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessingApprove ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยืนยันอนุมัติการยืม</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE EQUIPMENT CONFIRMATION */}
      {deletingEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-red-500/30 p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  ยืนยันการลบอุปกรณ์
                </h3>
                <p className="text-xs text-slate-400">
                  คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้ออกจากระบบ?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">{deletingEquipment.name}</p>
              <p className="text-orange-400 font-mono text-[11px]">{deletingEquipment.code} • {deletingEquipment.category}</p>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingEquipment(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={executeDeleteEquipment}
                disabled={isDeletingEquipment}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-md"
              >
                {isDeletingEquipment ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      <BookingSlipModal
        booking={selectedBookingForSlip}
        isOpen={Boolean(selectedBookingForSlip)}
        onClose={() => setSelectedBookingForSlip(null)}
      />
    </div>
  );
};
