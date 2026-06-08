import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Manually specify the monorepo workspace root to prevent Turbopack 
    // from scanning parent folders (like C:\Users\USER) where other lockfiles exist.
    root: path.resolve(__dirname, "../../"),
  },
};

export default nextConfig;
