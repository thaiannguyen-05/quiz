"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "late-night-reminder-shown";

function isLateNightVN(): boolean {
  try {
    const now = new Date();
    const vn = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
    );
    const hour = vn.getHours();
    return hour >= 0 && hour < 5;
  } catch {
    return false;
  }
}

export function LateNightReminder() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLateNightVN()) return;
    setOpen(true);
  }, []);

  function close() {
    setOpen(false);
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nhắc nhở"
      description="Muộn rồi, nghỉ ngơi một chút nhé."
      size="sm"
    >
      <p className="text-base font-semibold leading-relaxed text-ink">
        Có bận có nhiều deadline thì cũng nên ăn và ngủ sớm nhé
      </p>
      <div className="mt-6 flex justify-end">
        <Button onClick={close}>Đã hiểu</Button>
      </div>
    </Modal>
  );
}
