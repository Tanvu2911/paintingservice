import { useEffect, useRef, useState } from "react";

/**
 * ScrollReveal - Tự động kích hoạt hiệu ứng mờ dần rồi rõ dần từ dưới lên (fade-up, zoom-in, fade-left, fade-right)
 * khi người dùng cuộn trang tới vị trí của phần tử.
 * Sử dụng IntersectionObserver nguyên bản của trình duyệt, tối ưu 60fps phần cứng.
 */
export default function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 650,
  className = "",
  threshold = 0.1,
  once = false,
  as: Component = "div",
  ...props
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Nếu trình duyệt không hỗ trợ IntersectionObserver (môi trường đặc biệt), cho hiển thị luôn
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -25px 0px", // Kích hoạt mượt mà khi cuộn tới
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  // Các trạng thái CSS khởi tạo và khi visible
  const animationMap = {
    "fade-up": {
      init: "opacity-0 translate-y-8 pointer-events-none",
      active: "opacity-100 translate-y-0 pointer-events-auto",
    },
    "fade-down": {
      init: "opacity-0 -translate-y-8 pointer-events-none",
      active: "opacity-100 translate-y-0 pointer-events-auto",
    },
    "fade-left": {
      init: "opacity-0 -translate-x-8 pointer-events-none",
      active: "opacity-100 translate-x-0 pointer-events-auto",
    },
    "fade-right": {
      init: "opacity-0 translate-x-8 pointer-events-none",
      active: "opacity-100 translate-x-0 pointer-events-auto",
    },
    "zoom-in": {
      init: "opacity-0 scale-90 pointer-events-none",
      active: "opacity-100 scale-100 pointer-events-auto",
    },
    "fade": {
      init: "opacity-0 pointer-events-none",
      active: "opacity-100 pointer-events-auto",
    },
  };

  const anim = animationMap[animation] || animationMap["fade-up"];

  return (
    <Component
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${isVisible ? delay : 0}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`transition-all will-change-[transform,opacity] ${
        isVisible ? anim.active : anim.init
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
