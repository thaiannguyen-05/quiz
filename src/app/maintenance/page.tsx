export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <img
        src="/update-notification.png"
        alt="Đang cập nhật"
        className="mb-2 w-full max-w-sm rounded-2xl object-cover"
      />
      <h1 className="text-3xl font-extrabold tracking-[-0.04em]">
        Đang cập nhật
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-ink-soft">
        Hệ thống đang được cập nhật. Vui lòng quay lại sau ít phút. Cảm ơn bạn đã
        kiên nhẫn!
      </p>
    </main>
  );
}