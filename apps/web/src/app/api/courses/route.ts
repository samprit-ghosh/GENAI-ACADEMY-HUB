import { NextResponse } from "next/server";
import { CURATED_COURSES } from "@/lib/courses";
import fs from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "courses-cache.json");

function readCache(): Record<string, any[]> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Failed to read courses cache:", err);
  }
  return {};
}

function writeCache(cache: Record<string, any[]>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed to write courses cache:", err);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "free" | "paid" | null (all)
  const query = searchParams.get("q");
  const aiRecommend = searchParams.get("ai") === "true";

  let courses = CURATED_COURSES;

  if (query) {
    const q = query.toLowerCase().trim();
    // 1. Get matches from local curated database
    let localMatches = CURATED_COURSES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );

    // 2. Check if we have this query in our cache
    const cache = readCache();
    if (cache[q]) {
      console.log(`[Cache Hit] Returning cached courses for query: "${q}"`);
      const combined = [...localMatches, ...cache[q]];
      const seen = new Set();
      courses = combined.filter((c) => {
        const titleKey = c.title.toLowerCase().trim();
        if (seen.has(titleKey)) return false;
        seen.add(titleKey);
        return true;
      });
    } 
    // 3. Fast Path: If local matches are sufficient (e.g. 3 or more), skip LLM
    else if (localMatches.length >= 3) {
      console.log(`[Fast Path] Local matches are sufficient (${localMatches.length}) for: "${q}"`);
      courses = localMatches;
    }
    // 4. Slow Path: Dynamically generate search-based course recommendations locally
    else if (aiRecommend) {
      console.log(`[Local Search Synthesis] Generating search-based course recommendations for: "${q}"`);
      const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);
      
      const dynamicCourses = [
        {
          id: `dyn-yt-${q}-1`,
          title: `YouTube: ${capitalizedQuery} Full Course Lectures`,
          creator: "YouTube Academy",
          platform: "YouTube" as const,
          type: "free" as const,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+course`,
          description: `Access a collection of free, high-quality course videos and lecture playlists covering ${capitalizedQuery} on YouTube.`
        },
        {
          id: `dyn-yt-${q}-2`,
          title: `${capitalizedQuery} Practical Implementation Tutorials`,
          creator: "Independent Tech Instructors",
          platform: "YouTube" as const,
          type: "free" as const,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+tutorial`,
          description: `Find code walkthroughs, hands-on demonstrations, and practical project builds for ${capitalizedQuery} on YouTube.`
        },
        {
          id: `dyn-coursera-${q}-1`,
          title: `Coursera: ${capitalizedQuery} Specialization Pathways`,
          creator: "Partner Universities & Companies",
          platform: "Coursera" as const,
          type: "paid" as const,
          url: `https://www.coursera.org/search?query=${encodeURIComponent(query)}`,
          description: `Browse premium structured courses, specializations, and professional certificates for ${capitalizedQuery} from top-tier universities on Coursera.`
        },
        {
          id: `dyn-udemy-${q}-1`,
          title: `Udemy: Complete ${capitalizedQuery} Bootcamps`,
          creator: "Industry Professionals & Engineers",
          platform: "Udemy" as const,
          type: "paid" as const,
          url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(query)}`,
          description: `Learn ${capitalizedQuery} from scratch through practical coding bootcamps and build real-world projects on Udemy.`
        }
      ];

      // Save to cache
      cache[q] = dynamicCourses;
      writeCache(cache);

      const combined = [...localMatches, ...dynamicCourses];
      const seen = new Set();
      courses = combined.filter((c) => {
        const titleKey = c.title.toLowerCase().trim();
        if (seen.has(titleKey)) return false;
        seen.add(titleKey);
        return true;
      });
    } else {
      courses = localMatches;
    }
  }

  // Filter by type
  if (type === "free") {
    courses = courses.filter((c) => c.type === "free");
  } else if (type === "paid") {
    courses = courses.filter((c) => c.type === "paid");
  }

  return NextResponse.json({ courses, count: courses.length });
}
