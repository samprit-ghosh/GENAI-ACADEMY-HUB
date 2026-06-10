const { YoutubeTranscript } = require('youtube-transcript');

async function run() {
  const videoId = "D1eL1EnxXXQ"; // The video ID from the user's screenshot
  
  try {
    console.log("Testing default fetch...");
    const resDefault = await YoutubeTranscript.fetchTranscript(videoId);
    console.log("Default first line:", resDefault[0]?.text);
  } catch (e) {
    console.error("Default failed:", e.message);
  }

  try {
    console.log("Testing fetch with { lang: 'en' }...");
    const resEn = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    console.log("English first line:", resEn[0]?.text);
  } catch (e) {
    console.error("English failed:", e.message);
  }
}

run();
