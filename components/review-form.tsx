import { Star } from "lucide-react";
import { deleteReview, saveReview } from "@/app/actions/review";
import { Button } from "./ui/button";

type Review = { id: string; rating: number | null; review_text: string | null };
export function ReviewForm({ volumeId, review }: { volumeId: string; review?: Review | null }) {
  return <div className="space-y-4">
    <form action={saveReview} className="space-y-4">
      <input type="hidden" name="volumeId" value={volumeId} />
      <fieldset>
        <legend className="mb-2 font-sans text-sm font-semibold">내 별점</legend>
        <div className="flex gap-2">
          {[1,2,3,4,5].map((rating) => <label key={rating} className="cursor-pointer">
            <input className="peer sr-only" type="radio" name="rating" value={rating} defaultChecked={(review?.rating ?? 0) === rating} />
            <span className="grid size-11 place-items-center rounded-full border border-[var(--line)] text-[#c4c0bb] transition peer-checked:border-[#d4a514] peer-checked:bg-[#fbf3d6] peer-checked:text-[#b57a0b] hover:border-[#d4a514]" aria-label={`${rating}점`}><Star size={19} fill="currentColor" /></span>
          </label>)}
        </div>
      </fieldset>
      <label className="block font-sans text-sm font-semibold" htmlFor="reviewText">리뷰 <span className="font-normal text-[var(--muted)]">(선택)</span></label>
      <textarea id="reviewText" name="reviewText" maxLength={2000} defaultValue={review?.review_text ?? ""} placeholder="이 책에 대한 생각을 남겨보세요." className="min-h-32 w-full resize-y rounded-2xl border border-[var(--line)] bg-white p-4 outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[#e2f2f1]" />
      <Button type="submit" variant="primary">{review ? "평가 수정" : "평가 저장"}</Button>
    </form>
    {review && <form action={deleteReview}><input type="hidden" name="reviewId" value={review.id} /><input type="hidden" name="volumeId" value={volumeId} /><Button type="submit" variant="ghost" className="px-1 text-[#a3271b]">평가 삭제</Button></form>}
  </div>;
}
