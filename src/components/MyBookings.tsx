import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Booking } from '../types';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  CalendarClock, 
  Search, 
  Filter, 
  Package, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Printer, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { BookingSlipModal } from './BookingSlipModal';

interface MyBookingsProps {
  onGoToCatalog: () => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ onGoToCatalog }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = 'bookings';
    const q = query(
      collection(db, path),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        });
        // Sort descending by createdAt
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching my bookings:', error);
        handleFirestoreError(error, OperationType.LIST, path);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleCancelBooking = async (booking: Booking) => {
    if (booking.status !== 'pending') return;

    setCancellingId(booking.id);
    const path = `bookings/${booking.id}`;
    try {
      const docRef = doc(db, 'bookings', booking.id);
      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> รออนุมัติ
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> กำลังยืมใช้งาน
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> คืนแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" /> ถูกปฏิเสธ
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            ยกเลิกแล้ว
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">คำขอจองอุปกรณ์ของฉัน</h1>
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {bookings.length} รายการ
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ติดตามสถานะคำขอยืม อนุมัติ และพิมพ์เอกสารหลักฐานนำไปรับอุปกรณ์
          </p>
        </div>

        <button
          onClick={onGoToCatalog}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md shadow-orange-500/20 transition self-start sm:self-auto flex items-center gap-2 cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>ขอยืมอุปกรณ์เพิ่ม</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {[
          { key: 'all', label: 'ทั้งหมด', count: bookings.length },
          { key: 'pending', label: 'รออนุมัติ', count: bookings.filter((b) => b.status === 'pending').length },
          { key: 'approved', label: 'กำลังยืม', count: bookings.filter((b) => b.status === 'approved').length },
          { key: 'returned', label: 'คืนแล้ว', count: bookings.filter((b) => b.status === 'returned').length },
          { key: 'rejected', label: 'ถูกปฏิเสธ', count: bookings.filter((b) => b.status === 'rejected').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50 hover:text-orange-700'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              statusFilter === tab.key ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">กำลังโหลดข้อมูลรายการจอง...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-orange-200 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <CalendarClock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {statusFilter === 'all' ? 'ยังไม่มีประวัติการจองอุปกรณ์' : 'ไม่มีรายการในหมวดหมู่นี้'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            คุณสามารถเลือกดูอุปกรณ์ทั้งหมดของภาควิชา และส่งคำขอจองได้ทันที
          </p>
          <button
            onClick={onGoToCatalog}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            ไปยังหน้ารายการอุปกรณ์
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              {/* Left Details */}
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={booking.equipmentImageUrl}
                  alt={booking.equipmentName}
                  className="w-20 h-20 rounded-xl object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80';
                  }}
                />

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                      {booking.equipmentCode}
                    </span>
                    {getStatusBadge(booking.status)}
                    <span className="text-xs text-gray-400 font-mono">
                      #{booking.id.slice(0, 6)}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    {booking.equipmentName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="font-semibold text-gray-800">
                      จำนวน: {booking.quantity} ชิ้น
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      {booking.borrowDate} ถึง {booking.returnDate}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 line-clamp-1">
                    <span className="text-gray-400">วัตถุประสงค์: </span>
                    {booking.purpose}
                  </div>

                  {booking.adminNotes && (
                    <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold">ข้อความจากเจ้าหน้าที่: </span>
                      {booking.adminNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex sm:flex-row md:flex-col items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                <button
                  onClick={() => setSelectedBookingForSlip(booking)}
                  className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="ดูใบยืมอุปกรณ์"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-600" />
                  <span>ใบยืมอุปกรณ์</span>
                </button>

                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleCancelBooking(booking)}
                    disabled={cancellingId === booking.id}
                    className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{cancellingId === booking.id ? 'กำลังยกเลิก...' : 'ยกเลิกคำขอ'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Slip Modal */}
      <BookingSlipModal
        booking={selectedBookingForSlip}
        isOpen={Boolean(selectedBookingForSlip)}
        onClose={() => setSelectedBookingForSlip(null)}
      />
    </div>
  );
};
