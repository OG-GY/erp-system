"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddAttendanceModal } from "@/components/attendance/AddAttendanceModal";

export function AddAttendanceRecordButton({
  employees,
  todayValue,
}: {
  employees: { id: string; fullName: string }[];
  todayValue: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add record
      </button>

      {open ? (
        <AddAttendanceModal
          employees={employees}
          todayValue={todayValue}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
