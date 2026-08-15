import { useEffect, useState } from "react";
import AxiosConfig from "../../../util/AxiosConfig";
import Modal from "../../common/Modal";

export default function CreateContractModal({
    isOpen,
    onClose,
    order,
    bookingDetails = [],
    onSuccess,
    showToast,
}) {
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        content: "",
        totalAmount: "",
        depositAmount: "",
        remainingAmount: "",
    });

    /**
     * Lấy booking detail mới nhất
     */
    const latestDetail =
        bookingDetails && bookingDetails.length > 0
            ? bookingDetails[0]
            : null;

    /**
     * Dữ liệu khảo sát từ nhân viên
     */
    const surveyNote =
        latestDetail?.surveyNote ||
        order?.surveyNote ||
        "";

    const materialNote =
        latestDetail?.materialNote ||
        order?.materialNote ||
        "";

    const materialShortage =
        latestDetail?.materialShortage ||
        order?.materialShortage ||
        "";

    /**
     * Khi mở modal thì lấy dữ liệu đơn hàng
     */
    useEffect(() => {
        if (!isOpen || !order) return;

        const total =
            order.totalAmount != null
                ? order.totalAmount
                : "";

        const deposit =
            order.depositAmount != null
                ? order.depositAmount
                : "";

        const remaining =
            order.remainingAmount != null
                ? order.remainingAmount
                : "";

        setForm({
            content: generateDefaultContractContent(order, latestDetail),
            totalAmount: total,
            depositAmount: deposit,
            remainingAmount: remaining,
        });
    }, [isOpen, order, bookingDetails]);

    /**
     * Thay đổi input
     */
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /**
     * Tự tính tiền còn lại
     */
    const handleMoneyChange = (e) => {
        const { name, value } = e.target;

        const total =
            name === "totalAmount"
                ? Number(value || 0)
                : Number(form.totalAmount || 0);

        const deposit =
            name === "depositAmount"
                ? Number(value || 0)
                : Number(form.depositAmount || 0);

        const remaining = Math.max(total - deposit, 0);

        setForm((prev) => ({
            ...prev,
            [name]: value,
            remainingAmount: remaining,
        }));
    };

    /**
     * Lập hợp đồng
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!order?.id) {
            showToast?.("Không xác định được đơn hàng", "error");
            return;
        }

        if (!form.content.trim()) {
            showToast?.("Vui lòng nhập nội dung hợp đồng", "error");
            return;
        }

        if (!form.totalAmount || Number(form.totalAmount) <= 0) {
            showToast?.("Vui lòng nhập tổng giá trị hợp đồng", "error");
            return;
        }

        if (
            form.depositAmount !== "" &&
            Number(form.depositAmount) < 0
        ) {
            showToast?.("Tiền cọc không hợp lệ", "error");
            return;
        }

        if (
            Number(form.depositAmount || 0) >
            Number(form.totalAmount || 0)
        ) {
            showToast?.(
                "Tiền cọc không được lớn hơn tổng giá trị hợp đồng",
                "error"
            );
            return;
        }

        try {
            setLoading(true);

            /**
             * Payload gửi Backend
             *
             * Nếu DTO backend của bạn đang dùng tên field khác
             * thì chỉ cần sửa object này.
             */
            const payload = {
                bookingId: Number(order.id),
                content: form.content.trim(),
                totalAmount: Number(form.totalAmount),
                depositAmount: Number(form.depositAmount || 0),
                remainingAmount: Number(form.remainingAmount || 0),
            };

            console.log("CREATE CONTRACT PAYLOAD:", payload);

            const res = await AxiosConfig.post("/contracts", payload);

            showToast?.(
                "Đã lập hợp đồng thành công. Hợp đồng đang chờ duyệt."
            );

            onSuccess?.(res.data);

            onClose?.();
        } catch (err) {
            console.error("Lỗi lập hợp đồng:", err);

            showToast?.(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Không thể lập hợp đồng",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!loading) onClose?.();
            }}
            title={`Lập hợp đồng cho đơn #${order.id}`}
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-5"
            >
                {/* ================= THÔNG TIN KHÁCH ================= */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-3">
                        Thông tin khách hàng
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <Info
                            label="Khách hàng"
                            value={
                                order.customerName ||
                                order.customer?.fullName ||
                                order.customer?.username ||
                                "—"
                            }
                        />

                        <Info
                            label="Số điện thoại"
                            value={
                                order.customerPhone ||
                                order.phoneNumber ||
                                order.customer?.phoneNumber ||
                                "—"
                            }
                        />

                        <Info
                            label="Địa chỉ"
                            value={order.address || "—"}
                        />

                        <Info
                            label="Mã đơn"
                            value={`#${order.id}`}
                        />
                    </div>
                </div>

                {/* ================= BÁO CÁO KHẢO SÁT ================= */}
                <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-blue-600">
                                Báo cáo khảo sát
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                                Dữ liệu do Giám sát gửi lên
                            </p>
                        </div>

                        <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                            Đã nhận báo cáo
                        </span>
                    </div>

                    {surveyNote && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-slate-500 mb-1">
                                Ghi chú khảo sát
                            </p>

                            <p className="text-sm text-slate-700 whitespace-pre-line">
                                {surveyNote}
                            </p>
                        </div>
                    )}

                    {materialNote && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-slate-500 mb-1">
                                Vật tư
                            </p>

                            <p className="text-sm text-slate-700 whitespace-pre-line">
                                {materialNote}
                            </p>
                        </div>
                    )}

                    {materialShortage && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-xs font-bold text-amber-700 mb-1">
                                Báo thiếu vật tư
                            </p>

                            <p className="text-sm text-amber-800 whitespace-pre-line">
                                {materialShortage}
                            </p>
                        </div>
                    )}

                    {!surveyNote &&
                        !materialNote &&
                        !materialShortage && (
                            <p className="text-sm text-slate-400">
                                Không có ghi chú khảo sát.
                            </p>
                        )}
                </div>

                {/* ================= GIÁ HỢP ĐỒNG ================= */}
                <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-3">
                        Giá trị hợp đồng
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <MoneyInput
                            label="Tổng giá trị"
                            name="totalAmount"
                            value={form.totalAmount}
                            onChange={handleMoneyChange}
                            required
                        />

                        <MoneyInput
                            label="Tiền cọc"
                            name="depositAmount"
                            value={form.depositAmount}
                            onChange={handleMoneyChange}
                        />

                        <MoneyInput
                            label="Còn lại"
                            name="remainingAmount"
                            value={form.remainingAmount}
                            readOnly
                        />
                    </div>
                </div>

                {/* ================= NỘI DUNG HỢP ĐỒNG ================= */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">
                            Nội dung hợp đồng
                        </label>

                        <span className="text-[10px] text-slate-400">
                            Admin có thể chỉnh sửa
                        </span>
                    </div>

                    <textarea
                        name="content"
                        value={form.content}
                        onChange={handleChange}
                        rows={16}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed resize-y"
                        placeholder="Nhập nội dung hợp đồng..."
                    />
                </div>

                {/* ================= NOTE ================= */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <strong>Lưu ý:</strong>{" "}
                    Sau khi lập, hợp đồng chưa được gửi khách ngay.
                    Admin cần kiểm tra và duyệt hợp đồng trước khi hệ thống
                    chuyển sang trạng thái chờ khách ký.
                </div>

                {/* ================= BUTTON ================= */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => onClose?.()}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-50"
                    >
                        {loading
                            ? "Đang lập hợp đồng..."
                            : "📜 Lập hợp đồng"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* =========================================================
   TẠO NỘI DUNG HỢP ĐỒNG MẶC ĐỊNH
========================================================= */

function generateDefaultContractContent(order, detail) {
    const customerName =
        order?.customerName ||
        order?.customer?.fullName ||
        order?.customer?.username ||
        "Khách hàng";

    const customerPhone =
        order?.customerPhone ||
        order?.phoneNumber ||
        order?.customer?.phoneNumber ||
        "—";

    const address = order?.address || "—";

    const surveyNote =
        detail?.surveyNote ||
        order?.surveyNote ||
        "Không có";

    const materialNote =
        detail?.materialNote ||
        order?.materialNote ||
        "Không có";

    const materialShortage =
        detail?.materialShortage ||
        order?.materialShortage ||
        "Không có";

    return `HỢP ĐỒNG DỊCH VỤ

I. THÔNG TIN KHÁCH HÀNG

Họ và tên: ${customerName}
Số điện thoại: ${customerPhone}
Địa chỉ thực hiện: ${address}


II. NỘI DUNG CÔNG VIỆC

Căn cứ vào yêu cầu của khách hàng và kết quả khảo sát thực tế, hai bên thống nhất thực hiện dịch vụ theo nội dung đã được khảo sát và thống nhất.


III. KẾT QUẢ KHẢO SÁT

${surveyNote}


IV. VẬT TƯ

${materialNote}


V. VẬT TƯ CÒN THIẾU

${materialShortage}


VI. GIÁ TRỊ HỢP ĐỒNG

Tổng giá trị hợp đồng: [CẬP NHẬT]
Tiền đặt cọc: [CẬP NHẬT]
Số tiền còn lại: [CẬP NHẬT]


VII. TIẾN ĐỘ THỰC HIỆN

Thời gian thực hiện sẽ được hai bên thống nhất dựa trên điều kiện thực tế và lịch thi công.


VIII. TRÁCH NHIỆM CÁC BÊN

Bên cung cấp dịch vụ có trách nhiệm thực hiện công việc đúng nội dung đã thống nhất.

Khách hàng có trách nhiệm cung cấp thông tin cần thiết, phối hợp trong quá trình thực hiện và thanh toán theo thỏa thuận.


IX. XÁC NHẬN

Hợp đồng có hiệu lực sau khi được các bên xác nhận và ký điện tử theo quy định của hệ thống.
`;
}

/* =========================================================
   INFO
========================================================= */

function Info({ label, value }) {
    return (
        <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">
                {label}
            </p>

            <p className="text-sm text-slate-800 mt-0.5">
                {value}
            </p>
        </div>
    );
}

/* =========================================================
   MONEY INPUT
========================================================= */

function MoneyInput({
    label,
    name,
    value,
    onChange,
    readOnly = false,
    required = false,
}) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
                {label}
            </label>

            <input
                type="number"
                name={name}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                required={required}
                min="0"
                className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm ${readOnly
                    ? "bg-slate-100 text-slate-500"
                    : "bg-white focus:ring-2 focus:ring-blue-500"
                    }`}
            />
        </div>
    );
}