import type { ReadingStatus } from "@/types/book";
import { saveToLibrary } from "@/app/actions/library";
import { Button } from "./ui/button";

const statuses: { value: ReadingStatus; label: string }[] = [
  { value: "want_to_read", label: "읽고 싶어요" },
  { value: "reading", label: "읽는 중" },
  { value: "completed", label: "완독" },
];

export function LibraryControls({ volumeId, currentStatus }: { volumeId: string; currentStatus?: string | null }) {
  return <form action={saveToLibrary} className="flex flex-wrap gap-2">
    <input type="hidden" name="volumeId" value={volumeId} />
    <label className="sr-only" htmlFor="reading-status">독서 상태</label>
    <select id="reading-status" name="status" defaultValue={currentStatus ?? "want_to_read"} className="h-11 rounded-full border border-[var(--line)] bg-white px-4 font-sans text-sm font-semibold outline-none focus:border-[var(--teal)]">
      {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
    </select>
    <Button type="submit" variant="accent">{currentStatus ? "상태 저장" : "내 서재에 추가"}</Button>
  </form>;
}

