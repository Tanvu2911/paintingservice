import { useState, useEffect, useMemo, useCallback } from "react";
import AxiosConfig from "../util/AxiosConfig";
import {
  filterBookings,
  sortBookings,
  computeBookingStats,
} from "../util/bookingHistoryUtils";

const FETCHERS = {
  customer: () => AxiosConfig.get("/bookings/me"),
  survey: () => AxiosConfig.get("/staff/survey/jobs"),
  technician: () => AxiosConfig.get("/bookings/technician"),
  admin: () => AxiosConfig.get("/bookings"),
};

export default function useBookingHistory(role = "customer", showToast) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [technicianName, setTechnicianName] = useState("");
  const [customerName, setCustomerName] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetcher = FETCHERS[role] || FETCHERS.customer;
      const res = await fetcher();
      const data = res.data?.content || res.data || [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Không tải được lịch sử yêu cầu";
      setError(msg);
      showToast?.(msg, "error");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [role, showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = useMemo(() => {
    const result = filterBookings(bookings, {
      searchText,
      statusFilter,
      startDate,
      endDate,
      technicianName,
      customerName,
    });
    return sortBookings(result, sortOrder);
  }, [
    bookings,
    searchText,
    statusFilter,
    startDate,
    endDate,
    sortOrder,
    technicianName,
    customerName,
  ]);

  const stats = useMemo(() => computeBookingStats(bookings), [bookings]);

  return {
    bookings,
    filtered,
    stats,
    loading,
    error,
    refetch: fetchBookings,
    filters: {
      searchText,
      setSearchText,
      statusFilter,
      setStatusFilter,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      sortOrder,
      setSortOrder,
      technicianName,
      setTechnicianName,
      customerName,
      setCustomerName,
    },
  };
}
