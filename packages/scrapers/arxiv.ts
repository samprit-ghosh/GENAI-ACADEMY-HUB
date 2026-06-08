import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ArXiv API Endpoint for Computer Science / Machine Learning papers
// Max results set to 5 for demonstration, but you can increase this.
const ARXIV_API_URL = 'http://export.arxiv.org/api/query?search_query=cat:cs.LG+OR+cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=5';

async function fetchLatestPapers() {
  // console.log(`Fetching latest papers from ArXiv...`);
  
  try {
    const response = await fetch(ARXIV_API_URL);
    const xmlData = await response.text();
    
    // In a real production app, use 'fast-xml-parser' or similar to parse the XML properly.
    // Here we use simple regex for demonstration purposes to extract entries.
    const entries = xmlData.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    
    // console.log(`Found ${entries.length} new papers. Processing...`);

    for (const entry of entries) {
      // Extract title
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Unknown Title';

      // Extract abstract/summary
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';

      // Extract authors
      const authors = [...entry.matchAll(/<author>\s*<name>(.*?)<\/name>\s*<\/author>/g)].map(m => m[1]);
      const author_or_creator = authors.join(', ');

      // Extract PDF link
      const pdfMatch = entry.match(/<link title="pdf" href="(.*?)"/);
      const pdfUrl = pdfMatch ? pdfMatch[1] : null;

      if (!pdfUrl) continue;

      // Extract external URL (the abstract page)
      const idMatch = entry.match(/<id>(.*?)<\/id>/);
      const external_url = idMatch ? idMatch[1] : pdfUrl;

      // console.log(`\n📄 Saving to Database: ${title}`);
      // console.log(`🔗 PDF Link: ${pdfUrl}`);

      // 1. Save metadata to Postgres database
      await prisma.learning_resources.upsert({
        where: { external_url },
        update: {},
        create: {
          title,
          author_or_creator,
          type: 'journal_paper',
          description: summary,
          external_url,
          platform_name: 'ArXiv',
          tags: ['AI', 'Machine Learning'],
          is_free: true,
        },
      });

      // 2. Download the PDF locally
      await downloadPDF(pdfUrl, title);
    }
    
    // console.log('\n✅ Finished scraping ArXiv!');
  } catch (error) {
    console.error('Error fetching papers:', error);
  }
}

async function downloadPDF(pdfUrl: string, title: string) {
  try {
    // Create a safe filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
    const downloadDir = path.join(__dirname, 'downloads');
    
    // Ensure downloads directory exists
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const filePath = path.join(downloadDir, `${safeTitle}.pdf`);
    
    // Skip if we already downloaded it
    if (fs.existsSync(filePath)) {
      // console.log(`   ⏭️ PDF already downloaded.`);
      return;
    }

    // console.log(`   ⬇️ Downloading PDF...`);
    
    // Add .pdf to the ArXiv URL if it's missing (ArXiv quirk)
    const finalUrl = pdfUrl.endsWith('.pdf') ? pdfUrl : `${pdfUrl}.pdf`;
    
    const response = await fetch(finalUrl);
    const buffer = await response.arrayBuffer();
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    // console.log(`   💾 Saved to ${filePath}`);

  } catch (error) {
    console.error(`   ❌ Failed to download PDF:`, error);
  }
}

fetchLatestPapers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
