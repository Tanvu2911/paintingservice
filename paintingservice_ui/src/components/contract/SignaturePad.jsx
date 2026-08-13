import { useRef, useEffect, useState, useCallback } from "react";

export default function SignaturePad({
  label = "Chữ ký giám sát / khảo sát viên *",
  onSignatureChange,
  disabled = false,
}) {
  const canvasRef = useRef(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [hasSignature, setHasSignature] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : 500;
    const height = 160;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      initCanvas();
    }, 50);
    return () => clearTimeout(timer);
  }, [initCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const start = (e) => {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const move = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
      setHasSignature(true);
    };

    const end = (e) => {
      if (!drawing) return;
      e.preventDefault();
      drawing = false;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        setSignatureDataUrl(dataUrl);
        onSignatureChange?.(dataUrl, true);
      } catch {
        // ignore
      }
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    canvas.addEventListener("touchcancel", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
      canvas.removeEventListener("touchcancel", end);
    };
  }, [disabled, onSignatureChange]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 160;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setSignatureDataUrl("");
    setHasSignature(false);
    onSignatureChange?.("", false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={clearSignature}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium"
          >
            Xóa chữ ký
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Vẽ chữ ký vào khung bên dưới trước khi xác nhận.
      </p>
      <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair block"
          style={{ height: 160, touchAction: "none" }}
        />
      </div>
      {hasSignature ? (
        <p className="text-xs text-emerald-600 font-medium">✓ Đã có chữ ký</p>
      ) : (
        <p className="text-xs text-amber-600">
          Chưa ký — bắt buộc trước khi gửi
        </p>
      )}
    </div>
  );
}
