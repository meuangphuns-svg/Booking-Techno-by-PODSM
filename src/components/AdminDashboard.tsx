import React, { useState, useEffect } from 'react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { Equipment, Booking, AdminEmailDoc } from '../types';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SEED_EQUIPMENT } from '../data/seedData';
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
  FileCheck,
  Check,
  Upload,
  Layers,
  Phone
} from 'lucide-react';
import { BookingSlipModal } from './BookingSlipModal';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isSuperAdmin, adminEmails, addAdminEmail, removeAdminEmail } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'bookings' | 'equipments' | 'admins'>('overview');
  
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
  const [eqLocation, setEqLocation] = useState('ห้องปฏิบัติการ 302');
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

  // New admin email input
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState('');

  // Seeding state
  const [seeding, setSeeding] = useState(false);

  // Filters
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('pending');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [equipmentSearch, setEquipmentSearch] = useState<string>('');

  // Listen to equipments
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'equipments'),
      (snapshot) => {
        const list: Equipment[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Equipment);
        });
        list.sort((a, b) => a.code.localeCompare(b.code));
        setEquipments(list);
        setLoadingEquipments(false);
      },
      (error) => {
        console.error('Equipments admin listener error:', error);
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
        console.error('Bookings admin listener error:', error);
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
    setEqLocation('ห้อง Lab 302 ภาควิชาเทคโนโลยีการศึกษา');
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
      handleFirestoreError(err, editingEquipment ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setSavingEquipment(false);
    }
  };

  const handleDeleteEquipment = async (item: Equipment) => {
    const confirmed = window.confirm(`คุณแน่ใจว่าต้องการลบอุปกรณ์ "${item.name}" (${item.code}) หรือไม่?`);
    if (!confirmed) return;

    const path = `equipments/${item.id}`;
    try {
      await deleteDoc(doc(db, 'equipments', item.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Seed sample data
  const handleSeedData = async () => {
    const confirmed = window.confirm('ระบบจะเพิ่มข้อมูลตัวอย่างอุปกรณ์เทคโนโลยีการศึกษา 12 รายการเข้าสู่ระบบ คุณต้องการดำเนินการหรือไม่?');
    if (!confirmed) return;

    setSeeding(true);
    const path = 'equipments';
    try {
      for (const item of SEED_EQUIPMENT) {
        await addDoc(collection(db, path), {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      alert('เพิ่มข้อมูลตัวอย่างอุปกรณ์เทคโนโลยีการศึกษาเรียบร้อยแล้ว!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setSeeding(false);
    }
  };

  // Approve booking & deduct available inventory
  const handleApproveBooking = async (booking: Booking) => {
    const confirmed = window.confirm(
      `ยืนยันการ "อนุมัติการยืม" ให้กับ ${booking.userName}?\n\nอุปกรณ์: ${booking.equipmentName} (${booking.quantity} ชิ้น)\nเมื่อกดยืนยัน ระบบจะปรับสถานะเป็น "กำลังยืม" และตัดสต็อกในคลังทันที`
    );
    if (!confirmed) return;

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (booking.equipmentId) {
        try {
          const eqRef = doc(db, 'equipments', booking.equipmentId);
          const eqDoc = await getDoc(eqRef);
          if (eqDoc.exists()) {
            const eqData = eqDoc.data() as Equipment;
            const currentQty = eqData.availableQuantity ?? eqData.totalQuantity ?? 1;
            const newAvailable = Math.max(0, currentQty - booking.quantity);
            await updateDoc(eqRef, {
              availableQuantity: newAvailable,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (eqErr) {
          console.warn('Equipment inventory update note:', eqErr);
        }
      }

      alert(`อนุมัติการยืมอุปกรณ์ "${booking.equipmentName}" ให้กับ ${booking.userName} สำเร็จแล้ว!`);
    } catch (err: any) {
      console.error('Approval failed:', err);
      alert(`เกิดข้อผิดพลาดในการอนุมัติ: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    }
  };

  // Record Return & restore inventory
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

      alert(`บันทึกการส่งคืนอุปกรณ์ "${returningBooking.equipmentName}" เรียบร้อยแล้ว สต็อกถูกปรับคืนเข้าสู่คลัง`);
      setReturningBooking(null);
    } catch (err: any) {
      console.error('Return failed:', err);
      alert(`เกิดข้อผิดพลาดในการบันทึกการคืน: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Reject Booking
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
      alert(`ปฏิเสธคำขอยืม "${rejectingBooking.equipmentName}" เรียบร้อยแล้ว`);
      setRejectingBooking(null);
    } catch (err: any) {
      console.error('Reject failed:', err);
      alert(`เกิดข้อผิดพลาด: ${err?.message || 'กรุณาลองใหม่อีกครั้ง'}`);
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
      setAdminActionMsg(`เพิ่มสิทธิ์แอดมินให้ ${newAdminEmail.trim()} สำเร็จ`);
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
  const totalBorrowedCount = totalEquipmentsCount - totalAvailableCount;
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeLoans = bookings.filter((b) => b.status === 'approved');
  const returnedBookings = bookings.filter((b) => b.status === 'returned');

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
    return (
      item.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      item.code.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(equipmentSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Title & Sub-navigation */}
      <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              ระบบจัดการสำหรับผู้ดูแลระบบ (Admin Portal)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            บริหารจัดการอุปกรณ์ ตรวจสอบอนุมัติการยืม และบันทึกการส่งคืนอุปกรณ์ ภาควิชาเทคโนโลยีการศึกษา
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-orange-50/70 rounded-2xl border border-orange-100">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>ภาพรวม Dashboard</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer relative ${
              activeSubTab === 'bookings'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>คำขอยืม-คืน</span>
            {pendingBookings.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {pendingBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('equipments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'equipments'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>จัดการอุปกรณ์</span>
            <span className="text-[11px] opacity-80">({equipments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('admins')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'admins'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>จัดการสิทธิ์แอดมิน</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW DASHBOARD */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs hover:border-orange-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500">อุปกรณ์ทั้งหมด</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalEquipmentsCount} ชิ้น</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{equipments.length} รายการในระบบ</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs hover:border-orange-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500">อุปกรณ์ที่ถูกยืมอยู่</p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">{totalBorrowedCount} ชิ้น</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{activeLoans.length} รายการที่กำลังใช้งาน</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs hover:border-orange-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500">คำขอรออนุมัติ</p>
                  <h3 className="text-2xl font-bold text-red-600 mt-1">{pendingBookings.length} คำขอ</h3>
                  <p className="text-[11px] text-red-500 mt-0.5">ต้องการการตรวจสอบจากแอดมิน</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs hover:border-orange-200 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-500">ประวัติการคืนแล้ว</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">{returnedBookings.length} ครั้ง</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">การยืมและคืนเสร็จสมบูรณ์</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Seeding Card */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>การเริ่มต้นระบบและจัดการด่วน</span>
              </h3>
              <p className="text-xs text-gray-600">
                หากระบบยังไม่มีอุปกรณ์ สามารถกดปุ่มเพื่อสร้างอุปกรณ์ตัวอย่างภาควิชาเทคโนโลยีการศึกษา 12 รายการได้ทันที
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="bg-white hover:bg-orange-50 text-orange-700 border border-orange-300 font-semibold px-4 py-2 rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>{seeding ? 'กำลังนำเข้าข้อมูล...' : 'เติมข้อมูลตัวอย่างอุปกรณ์ (12 ชิ้น)'}</span>
              </button>
              <button
                onClick={handleOpenAddEquipment}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มอุปกรณ์ใหม่</span>
              </button>
            </div>
          </div>

          {/* Pending Requests Table Preview */}
          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">คำขอยืมที่รออนุมัติด่วน (Pending Requests)</h3>
                <p className="text-xs text-gray-500">ตรวจสอบและกดอนุมัติเมื่อผู้ใช้มารับอุปกรณ์</p>
              </div>
              <button
                onClick={() => {
                  setActiveSubTab('bookings');
                  setBookingStatusFilter('pending');
                }}
                className="text-xs text-orange-600 font-semibold hover:underline"
              >
                ดูทั้งหมด ({pendingBookings.length})
              </button>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                ไม่มีคำขอยืมที่รออนุมัติในขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-orange-50/60 text-gray-600 font-semibold border-b border-orange-100">
                    <tr>
                      <th className="py-3 px-4">ผู้ขอยืม</th>
                      <th className="py-3 px-4">อุปกรณ์</th>
                      <th className="py-3 px-4">จำนวน</th>
                      <th className="py-3 px-4">ช่วงเวลาที่ยืม</th>
                      <th className="py-3 px-4">วัตถุประสงค์</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingBookings.slice(0, 5).map((b) => (
                      <tr key={b.id} className="hover:bg-orange-50/30 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{b.userName}</p>
                          <p className="text-gray-400 text-[11px]">{b.userStudentId || b.userEmail}</p>
                          <p className="text-gray-400 text-[11px]">{b.userPhone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{b.equipmentName}</p>
                          <span className="font-mono text-orange-600 text-[10px] bg-orange-50 px-1.5 py-0.5 rounded">
                            {b.equipmentCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{b.quantity} ชิ้น</td>
                        <td className="py-3 px-4 text-gray-600">
                          {b.borrowDate} ถึง {b.returnDate}
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{b.purpose}</td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleApproveBooking(b)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-lg text-xs shadow-xs transition"
                          >
                            อนุมัติการยืม
                          </button>
                          <button
                            onClick={() => setRejectingBooking(b)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-lg text-xs transition"
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

      {/* SUB-TAB 2: BOOKING MANAGEMENT */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ยืม, รหัสนักศึกษา, อุปกรณ์..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'pending', label: 'รออนุมัติ', badge: pendingBookings.length },
                { key: 'approved', label: 'กำลังยืม', badge: activeLoans.length },
                { key: 'returned', label: 'คืนแล้ว' },
                { key: 'rejected', label: 'ปฏิเสธ' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setBookingStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    bookingStatusFilter === tab.key
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-white/30 text-white text-[10px] px-1 rounded">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xs overflow-hidden">
            {loadingBookings ? (
              <div className="py-20 text-center text-gray-500 text-sm">
                กำลังโหลดรายการจอง...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                ไม่พบรายการคำขอในสถานะที่เลือก
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-orange-50/70 text-gray-700 font-bold border-b border-orange-100">
                    <tr>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4">ผู้ขอยืม</th>
                      <th className="py-3 px-4">อุปกรณ์</th>
                      <th className="py-3 px-4">จำนวน</th>
                      <th className="py-3 px-4">กำหนดวันยืม - คืน</th>
                      <th className="py-3 px-4">วัตถุประสงค์</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-orange-50/30 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {b.status === 'pending' && (
                            <span className="inline-block bg-amber-100 text-amber-800 border border-amber-300 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                              รออนุมัติ
                            </span>
                          )}
                          {b.status === 'approved' && (
                            <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                              กำลังยืม
                            </span>
                          )}
                          {b.status === 'returned' && (
                            <span className="inline-block bg-blue-100 text-blue-800 border border-blue-300 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                              คืนแล้ว
                            </span>
                          )}
                          {b.status === 'rejected' && (
                            <span className="inline-block bg-red-100 text-red-800 border border-red-300 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                              ถูกปฏิเสธ
                            </span>
                          )}
                          {b.status === 'cancelled' && (
                            <span className="inline-block bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                              ยกเลิกแล้ว
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-gray-900">{b.userName}</p>
                          <p className="text-gray-400 text-[11px] font-mono">{b.userStudentId || '-'}</p>
                          <p className="text-orange-600 text-[11px]">{b.userPhone}</p>
                        </td>

                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="font-bold text-gray-900 leading-snug truncate">{b.equipmentName}</p>
                          <span className="font-mono text-gray-500 text-[10px]">
                            {b.equipmentCode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {b.quantity} ชิ้น
                        </td>

                        <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                          <div>ยืม: <span className="font-medium text-gray-800">{b.borrowDate}</span></div>
                          <div>คืน: <span className="font-medium text-orange-700">{b.returnDate}</span></div>
                        </td>

                        <td className="py-3.5 px-4 max-w-[220px]">
                          <p className="text-gray-700 line-clamp-2">{b.purpose}</p>
                          {b.conditionOnReturn && (
                            <p className="text-[11px] text-emerald-700 mt-1 bg-emerald-50 p-1 rounded">
                              สภาพตอนคืน: {b.conditionOnReturn}
                            </p>
                          )}
                          {b.adminNotes && (
                            <p className="text-[11px] text-amber-700 mt-0.5 bg-amber-50 p-1 rounded">
                              โน้ต: {b.adminNotes}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Print / View voucher button */}
                          <button
                            onClick={() => setSelectedBookingForSlip(b)}
                            className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-lg transition"
                            title="ดูใบยืม"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Actions based on status */}
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveBooking(b)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-lg text-xs shadow-xs transition"
                              >
                                อนุมัติการยืม
                              </button>
                              <button
                                onClick={() => setRejectingBooking(b)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-lg text-xs transition"
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
                              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1 rounded-lg text-xs shadow-xs transition flex items-center gap-1 inline-flex"
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

      {/* SUB-TAB 3: EQUIPMENT MANAGEMENT */}
      {activeSubTab === 'equipments' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                placeholder="ค้นหาชื่อหรือรหัสอุปกรณ์..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>เติมข้อมูลตัวอย่าง</span>
              </button>
              <button
                onClick={handleOpenAddEquipment}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มอุปกรณ์</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-orange-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-orange-50/70 text-gray-700 font-bold border-b border-orange-100">
                  <tr>
                    <th className="py-3 px-4">ภาพ</th>
                    <th className="py-3 px-4">รหัสอุปกรณ์</th>
                    <th className="py-3 px-4">ชื่ออุปกรณ์</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4">จำนวนคงเหลือ / ทั้งหมด</th>
                    <th className="py-3 px-4">สถานที่จัดเก็บ</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEquipments.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/30 transition">
                      <td className="py-2.5 px-4">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </td>

                      <td className="py-2.5 px-4 font-mono font-bold text-orange-700">
                        {item.code}
                      </td>

                      <td className="py-2.5 px-4 font-bold text-gray-900 max-w-[200px]">
                        <p className="truncate">{item.name}</p>
                      </td>

                      <td className="py-2.5 px-4 text-gray-600">
                        {item.category}
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="font-bold text-orange-600">{item.availableQuantity}</span> / {item.totalQuantity} ชิ้น
                      </td>

                      <td className="py-2.5 px-4 text-gray-500">
                        {item.location || '-'}
                      </td>

                      <td className="py-2.5 px-4">
                        {item.status === 'available' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                            พร้อมใช้งาน
                          </span>
                        ) : item.status === 'maintenance' ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                            ซ่อมบำรุง
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                            งดให้บริการ
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditEquipment(item)}
                          className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="แก้ไขอุปกรณ์"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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

      {/* SUB-TAB 4: ADMIN ROLE MANAGEMENT */}
      {activeSubTab === 'admins' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
          {/* Super Admin Info Card */}
          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  จัดการสิทธิ์ผู้ดูแลระบบ (Admin Role Management)
                </h3>
                <p className="text-xs text-gray-500">
                  กำหนดรายชื่ออีเมลที่ได้รับอนุญาตให้เป็น Admin ในการอนุมัติการยืม คืน และจัดการอุปกรณ์
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
                  👑 ผู้ดูแลระบบหลัก (Super Administrator)
                </span>
                <p className="font-mono font-bold text-gray-900 text-sm mt-0.5">{SUPER_ADMIN_EMAIL}</p>
                <p className="text-[11px] text-gray-500">
                  บัญชีผู้สร้างระบบเริ่มต้น ได้รับสิทธิ์บริหารจัดการสูงสุดเสมอ
                </p>
              </div>
              <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
                เจ้าของระบบ
              </span>
            </div>

            {/* Add New Admin Form */}
            <form onSubmit={handleAddAdmin} className="pt-2 space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                เพิ่มอีเมลผู้ดูแลระบบเพิ่มเติม (เช่น อาจารย์ร่วมภาควิชา หรือเจ้าหน้าที่ห้องปฏิบัติการ)
              </label>

              {adminActionMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-medium">
                  {adminActionMsg}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="เช่น co_teacher@silpakorn.edu หรือ staff@gmail.com"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  required
                />
                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{addingAdmin ? 'กำลังเพิ่ม...' : 'เพิ่มสิทธิ์แอดมิน'}</span>
                </button>
              </div>
            </form>

            {/* Existing Co-Admins List */}
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                รายชื่อแอดมินที่ได้รับอนุญาต ({adminEmails.length} บัญชี)
              </h4>

              {adminEmails.length === 0 ? (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                  ยังไม่มีการเพิ่มแอดมินคนอื่นเพิ่มเติม (ปัจจุบันมีเพียงผู้ดูแลหลัก)
                </p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                  {adminEmails.map((admin) => (
                    <div
                      key={admin.id}
                      className="p-3.5 flex items-center justify-between hover:bg-orange-50/40 transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{admin.email}</p>
                        <p className="text-[11px] text-gray-400">
                          เพิ่มโดย: {admin.addedBy} • เมื่อ {new Date(admin.createdAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const conf = window.confirm(`คุณแน่ใจว่าต้องการลบสิทธิ์แอดมินของ ${admin.email} หรือไม่?`);
                          if (conf) {
                            await removeAdminEmail(admin.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                        title="ลบสิทธิ์แอดมิน"
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

      {/* MODAL 1: ADD / EDIT EQUIPMENT */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-orange-100 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">
                {editingEquipment ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบ'}
              </h3>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    รหัสอุปกรณ์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eqCode}
                    onChange={(e) => setEqCode(e.target.value)}
                    placeholder="เช่น CAM-001"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    หมวดหมู่อุปกรณ์
                  </label>
                  <select
                    value={eqCategory}
                    onChange={(e) => setEqCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่ออุปกรณ์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  placeholder="เช่น Sony Alpha 7 IV หรือ Rode Wireless GO II"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    จำนวนทั้งหมด
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={eqTotalQty}
                    onChange={(e) => setEqTotalQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    จำนวนคงเหลือ
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={eqTotalQty}
                    value={eqAvailableQty}
                    onChange={(e) => setEqAvailableQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-orange-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={eqStatus}
                    onChange={(e) => setEqStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  >
                    <option value="available">พร้อมใช้งาน</option>
                    <option value="maintenance">ซ่อมบำรุง</option>
                    <option value="out_of_service">งดให้บริการ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL รูปภาพอุปกรณ์
                </label>
                <input
                  type="url"
                  value={eqImageUrl}
                  onChange={(e) => setEqImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
                {eqImageUrl && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img src={eqImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  สถานที่จัดเก็บ / ตู้เก็บ
                </label>
                <input
                  type="text"
                  value={eqLocation}
                  onChange={(e) => setEqLocation(e.target.value)}
                  placeholder="เช่น ตู้ A2 ห้องปฏิบัติการ 302"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  รายละเอียด สเปค และอุปกรณ์เสริมที่มีให้
                </label>
                <textarea
                  rows={3}
                  value={eqDetails}
                  onChange={(e) => setEqDetails(e.target.value)}
                  placeholder="เช่น มีแบตเตอรี่ 2 ก้อน, สายชาร์จ, เมมโมรี่การ์ด, กระเป๋าใส่..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-orange-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  บันทึกการส่งคืนอุปกรณ์
                </h3>
                <p className="text-xs text-gray-500">
                  ตรวจสอบสภาพอุปกรณ์และความสมบูรณ์ก่อนรับคืนเข้าคลัง
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <p className="font-bold text-gray-900">{returningBooking.equipmentName}</p>
              <p className="text-gray-500">ผู้ยืม: {returningBooking.userName} ({returningBooking.userStudentId || returningBooking.userPhone})</p>
              <p className="text-orange-700 font-semibold">จำนวนที่คืน: {returningBooking.quantity} ชิ้น</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                การตรวจสอบสภาพอุปกรณ์ที่ส่งคืน <span className="text-red-500">*</span>
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium"
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
              <label className="block text-xs font-bold text-gray-700 mb-1">
                บันทึกหมายเหตุเพิ่มเติมจากเจ้าหน้าที่
              </label>
              <textarea
                rows={2}
                value={returnAdminNote}
                onChange={(e) => setReturnAdminNote(e.target.value)}
                placeholder="เช่น คืนอุปกรณ์ครบตรงเวลา อุปกรณ์เสริมครบ..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturningBooking(null)}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
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

      {/* MODAL 3: REJECT BOOKING MODAL */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  ปฏิเสธคำขอยืมอุปกรณ์
                </h3>
                <p className="text-xs text-gray-500">
                  ระบุเหตุผลเพื่อแจ้งให้ผู้ขอยืมทราบในระบบ
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <p className="font-bold text-gray-900">{rejectingBooking.equipmentName}</p>
              <p className="text-gray-500">ผู้ยืม: {rejectingBooking.userName}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                เหตุผลในการปฏิเสธคำขอ
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ติดช่วงสอบ, อุปกรณ์ต้องใช้จัดสัมมนาคณะ..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
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

      {/* Slip Modal */}
      <BookingSlipModal
        booking={selectedBookingForSlip}
        isOpen={Boolean(selectedBookingForSlip)}
        onClose={() => setSelectedBookingForSlip(null)}
      />
    </div>
  );
};
