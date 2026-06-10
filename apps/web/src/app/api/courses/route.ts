import { NextResponse } from "next/server";
import { CURATED_COURSES } from "@/lib/courses";
import fs from "fs";
import path from "path";
import https from "https";

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

function searchYouTubeDirect(query: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /"videoRenderer":\s*\{\s*"videoId":\s*"([a-zA-Z0-9_-]{11})"/g;
        let match;
        const ids: string[] = [];
        while ((match = regex.exec(data)) !== null) {
          ids.push(match[1]);
        }
        if (ids.length === 0) {
          const regex2 = /watch\?v=([a-zA-Z0-9_-]{11})/g;
          while ((match = regex2.exec(data)) !== null) {
            ids.push(match[1]);
          }
        }
        resolve([...new Set(ids)]);
      });
    }).on('error', reject);
  });
}

function getoEmbedInfo(id: string): Promise<any> {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function getFirstVideo(query: string) {
  try {
    const ids = await searchYouTubeDirect(query);
    if (ids.length > 0) {
      const firstId = ids[0];
      const info = await getoEmbedInfo(firstId);
      return {
        id: firstId,
        title: info ? info.title : `YouTube Video`,
        creator: info ? info.author_name : `YouTube Creator`
      };
    }
  } catch (e) {
    console.error("Failed to dynamically fetch first YouTube video:", e);
  }
  return null;
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
      
      const yt1 = await getFirstVideo(`${query} AI ML course programming`);
      const yt2 = await getFirstVideo(`${query} AI ML tutorial coding`);

      const dynamicCourses = [
        {
          id: `dyn-yt-${q}-1`,
          title: yt1 ? yt1.title : `YouTube: ${capitalizedQuery} Full Course Lectures`,
          creator: yt1 ? yt1.creator : "YouTube Academy",
          platform: "YouTube" as const,
          type: "free" as const,
          url: yt1 ? `https://www.youtube.com/watch?v=${yt1.id}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+course`,
          description: `Access a free, high-quality course video covering ${capitalizedQuery} on YouTube.`
        },
        {
          id: `dyn-yt-${q}-2`,
          title: yt2 ? yt2.title : `${capitalizedQuery} Practical Implementation Tutorials`,
          creator: yt2 ? yt2.creator : "Independent Tech Instructors",
          platform: "YouTube" as const,
          type: "free" as const,
          url: yt2 ? `https://www.youtube.com/watch?v=${yt2.id}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}+tutorial`,
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
