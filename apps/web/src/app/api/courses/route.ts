import { NextResponse } from "next/server";
import { CURATED_COURSES } from "@/lib/courses";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "free" | "paid" | null (all)
  const query = searchParams.get("q");

  let courses = CURATED_COURSES;

  // Filter by type
  if (type === "free") {
    courses = courses.filter((c) => c.type === "free");
  } else if (type === "paid") {
    courses = courses.filter((c) => c.type === "paid");
  }

  // Filter by search query
  if (query) {
    const q = query.toLowerCase();
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ courses, count: courses.length });
}
