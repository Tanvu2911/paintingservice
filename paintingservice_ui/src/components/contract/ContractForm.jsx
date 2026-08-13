import { useState } from "react";
import SignaturePad from "./SignaturePad";

export default function ContractForm({
  initialContent = "",
  onSubmit,
  submitting = false,
}) {
  const [customerAgreed, setCustomerAgreed] = useState(true);
  const [contractContent, setContractContent] = useState(initialContent);
  const [rejectReason, setRejectReason] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [hasSignature, setHasSignature] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({
      customerAgreed,
      contractContent,
      rejectReason,
      signatureDataUrl,
      hasSignature,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Khách hàng có đồng ý làm không?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCustomerAgreed(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
              customerAgreed
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            ✅ Đồng ý làm
          </button>
          <button
            type="button"
            onClick={() => setCustomerAgreed(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
              !customerAgreed
                ? "border-rose-600 bg-rose-50 text-rose-700"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            ❌ Không đồng ý
          </button>
        </div>
      </div>

      {customerAgreed ? (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nội dung hợp đồng *
            </label>
            <textarea
              value={contractContent}
              onChange={(e) => setContractContent(e.target.value)}
              rows={10}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <SignaturePad
            label="Chữ ký giám sát / khảo sát viên *"
            onSignatureChange={(dataUrl, hasSig) => {
              setSignatureDataUrl(dataUrl);
              setHasSignature(hasSig);
            }}
          />
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lý do khách không đồng ý *
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Nhập lý do khách không đồng ý làm..."
            className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      )}

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold shadow transition"
        >
          {submitting
            ? "Đang gửi..."
            : customerAgreed
            ? "Lập hợp đồng & Gửi Admin"
            : "Xác nhận hủy đơn"}
        </button>
      </div>
    </form>
  );
}
