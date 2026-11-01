/** client-only helpers สำหรับสแกนบาร์โค้ดด้วย BarcodeDetector API (Chrome/Safari 17+) */

export function isBarcodeSupported(): boolean {
  // globalThis === window ใน browser; ใน SSR จะเป็น false ตามธรรมชาติ (Node ไม่มี BarcodeDetector)
  return Boolean((globalThis as { BarcodeDetector?: unknown }).BarcodeDetector);
}

type DetectorLike = { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> };

/**
 * เปิดกล้องหลังแล้ว loop detect ด้วย rAF
 * - เจอ ISBN (13/10 หลัก) → เรียก onResult (debounce เล่มเดิม 2 วินาที)
 * - เบราว์เซอร์ไม่รองรับ → onUnsupported ทันที
 * - return stop function ปิด stream และหยุด loop
 */
export function startScan(
  video: HTMLVideoElement,
  onResult: (isbn: string) => void,
  onUnsupported: () => void,
): () => void {
  if (!isBarcodeSupported()) {
    onUnsupported();
    return () => undefined;
  }

  let stopped = false;
  let rafId = 0;
  let stream: MediaStream | null = null;
  let lastValue = "";
  let lastTime = 0;

  const Detector = (window as unknown as {
    BarcodeDetector: new (options?: { formats?: string[] }) => DetectorLike;
  }).BarcodeDetector;

  const detector = new Detector({
    formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
  });

  const loop = async () => {
    if (stopped) return;
    try {
      const codes = await detector.detect(video);
      const value = codes[0]?.rawValue ?? "";
      const now = Date.now();
      if (value && /^\d{10}(\d{3})?$|^\d{9}[\dX]$/.test(value) && !(value === lastValue && now - lastTime < 2000)) {
        lastValue = value;
        lastTime = now;
        onResult(value);
      }
    } catch {
      // frame บาง frame detect ไม่ได้ — ข้าม
    }
    if (!stopped) rafId = requestAnimationFrame(() => void loop());
  };

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((mediaStream) => {
      if (stopped) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = mediaStream;
      video.srcObject = mediaStream;
      video.play();
      void loop();
    })
    .catch(() => {
      if (!stopped) onUnsupported();
    });

  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
    stream?.getTracks().forEach((track) => track.stop());
  };
}
