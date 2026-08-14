import { useState, useEffect, useCallback, useMemo } from "react";
import AxiosConfig from "../util/AxiosConfig";

export default function useWalletData(userId, showToast) {
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AxiosConfig.get("/salary-histories");
      const all = Array.isArray(res.data) ? res.data : [];
      const mine = userId
        ? all.filter((s) => Number(s.workerId) === Number(userId))
        : all;
      setSalaryHistory(mine);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Không tải được dữ liệu ví";
      setError(msg);
      showToast?.(msg, "error");
      setSalaryHistory([]);
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const balance = useMemo(
    () =>
      salaryHistory
        .filter((s) => s.paymentStatus !== "PAID")
        .reduce((sum, s) => sum + (Number(s.amountEarned) || 0), 0),
    [salaryHistory]
  );

  const paidTotal = useMemo(
    () =>
      salaryHistory
        .filter((s) => s.paymentStatus === "PAID")
        .reduce((sum, s) => sum + (Number(s.amountEarned) || 0), 0),
    [salaryHistory]
  );

  const totalEarned = useMemo(
    () =>
      salaryHistory.reduce(
        (sum, s) => sum + (Number(s.amountEarned) || 0),
        0
      ),
    [salaryHistory]
  );

  return {
    salaryHistory,
    balance,
    paidTotal,
    totalEarned,
    loading,
    error,
    refetch: fetchData,
  };
}
