// Stop words list to filter out non-informative words
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", 
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", 
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", 
  "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", 
  "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", 
  "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", 
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", 
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", 
  "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", 
  "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", 
  "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", 
  "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", 
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
  // Action words often used in queries
  "explain", "describe", "tell", "summarize", "summary", "brief", "one", "liner", "what", "is"
]);

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(word => word.length > 0);
}

export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter(t => !STOP_WORDS.has(t));
}

export function getSentences(text: string): string[] {
  // Split by ., !, ? followed by space.
  return text.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(s => {
    const wordCount = s.split(/\s+/).length;
    // Filter out heavy math/LaTeX formulas
    const hasMath = /[\^{}\\]/.test(s) || (s.match(/=/g) || []).length > 2 || (s.match(/[^a-zA-Z0-9\s.,?!'"-]/g) || []).length > 10;
    return s.length > 20 && wordCount >= 5 && !hasMath;
  });
}

/**
 * Calculates a TF-IDF-like score for sentences given a query.
 */
export function calculateSentenceScores(query: string, sentences: string[]) {
  const queryTokens = removeStopWords(tokenize(query));
  if (queryTokens.length === 0) return sentences.map(() => 0);

  const N = sentences.length;
  const sentenceTokens = sentences.map(s => removeStopWords(tokenize(s)));
  
  // Calculate Document Frequency (DF) for IDF
  const idf: Record<string, number> = {};
  for (const token of queryTokens) {
    let docCount = 0;
    for (const tokens of sentenceTokens) {
      if (tokens.includes(token)) docCount++;
    }
    // +1 smoothing
    idf[token] = Math.log(N / (docCount + 1)) + 1;
  }

  // Calculate TF-IDF score for each sentence
  const scores = sentences.map((_, i) => {
    let score = 0;
    const tokens = sentenceTokens[i];
    const totalWords = tokens.length || 1;
    
    for (const token of queryTokens) {
      const tf = tokens.filter(t => t === token).length / totalWords;
      score += tf * idf[token];
    }
    return score;
  });

  return scores;
}

/**
 * Extracts the best sentences to answer a question.
 */
export function extractAnswer(query: string, text: string, topN: number = 2): string {
  const sentences = getSentences(text);
  if (sentences.length === 0) return "I could not find any text to analyze.";

  const scores = calculateSentenceScores(query, sentences);
  
  const ranked = sentences.map((s, i) => ({ sentence: s, score: scores[i] }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return "I couldn't find a specific answer to that in the text.";
  }

  // Return the top N sentences
  return ranked.slice(0, topN).map(r => r.sentence).join(" ");
}

/**
 * Extractive summarization: scores sentences based on global word frequencies.
 */
export function extractSummary(text: string, numSentences: number = 3): string {
  const sentences = getSentences(text);
  if (sentences.length <= numSentences) return text;

  const allTokens = removeStopWords(tokenize(text));
  const wordFreq: Record<string, number> = {};
  for (const word of allTokens) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  const scores = sentences.map(s => {
    const tokens = removeStopWords(tokenize(s));
    let score = 0;
    for (const token of tokens) {
      score += wordFreq[token] || 0;
    }
    // Normalize by length to not heavily bias super long sentences
    return score / (tokens.length || 1);
  });

  const rankedIndices = sentences.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  // Re-sort the selected indices chronologically
  const topIndices = rankedIndices.slice(0, numSentences).sort((a, b) => a - b); 

  return topIndices.map(i => sentences[i]).join(" ");
}

/**
 * Gets a 1-sentence brief summary.
 */
export function extractOneLiner(text: string): string {
  return extractSummary(text, 1);
}
