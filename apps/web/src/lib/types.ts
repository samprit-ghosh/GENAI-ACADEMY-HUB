// Shared types for papers and courses across the app
export type ResearchPaper = {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  pdfUrl: string;
  abstractUrl: string;
  publishedDate: string;
  categories: string[];
};

export type Course = {
  id: string;
  title: string;
  creator: string;
  platform: "YouTube" | "Coursera" | "Udemy" | "DeepLearning.AI";
  type: "free" | "paid";
  url: string;
  description: string;
  thumbnailUrl?: string;
};
