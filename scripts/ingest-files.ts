// scripts/ingest-files.ts - FILE-BASED INGESTION
// run with: 
//  npx tsx --env-file=.env.local scripts/ingest-files.ts --clear 

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Directory containing your files to ingest
  contentDir: './content',
  
  // File patterns to include
  patterns: [
    '**/*.md',      // Markdown files
    '**/*.txt',     // Text files
    '**/*.pdf',     // PDF files (requires pdf-parse)
    '**/*.json',    // JSON files
    '**/*.mdx',     // MDX files
  ],
  
  // Files/folders to ignore
  ignore: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
  ],
  
  // Chunking settings
  chunkSize: 500,
  chunkOverlap: 50,
  
  // Base URL for your portfolio (used in citations)
  baseUrl: 'https://ai-portfolio-psi-lyart.vercel.app',
};

// ============================================================================
// FILE PROCESSORS
// ============================================================================

interface FileProcessor {
  extensions: string[];
  process: (filePath: string) => Promise<string>;
}

// Markdown processor
const markdownProcessor: FileProcessor = {
  extensions: ['.md', '.mdx'],
  async process(filePath: string): Promise<string> {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      // Remove frontmatter from content
      content = content.replace(frontmatterRegex, '').trim();
    }
    
    // Remove markdown formatting for better embeddings
    content = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1')    // Remove inline code
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
      .replace(/#{1,6}\s+/g, '')       // Remove headers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // Remove emphasis
      .trim();
    
    return content;
  },
};

// Text processor
const textProcessor: FileProcessor = {
  extensions: ['.txt'],
  async process(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8').trim();
  },
};

// JSON processor
const jsonProcessor: FileProcessor = {
  extensions: ['.json'],
  async process(filePath: string): Promise<string> {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Convert JSON to readable text
    const stringify = (obj: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);
      
      if (typeof obj !== 'object' || obj === null) {
        return String(obj);
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => stringify(item, indent + 1)).join('\n');
      }
      
      return Object.entries(obj)
        .map(([key, value]) => {
          return `${spaces}${key}: ${stringify(value, indent + 1)}`;
        })
        .join('\n');
    };
    
    return stringify(json);
  },
};

// PDF processor (requires pdf-parse package)
const pdfProcessor: FileProcessor = {
  extensions: ['.pdf'],
  async process(filePath: string): Promise<string> {
    try {
      const pdfParseModule = require('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text.trim();
    } catch (error: any) {
      console.warn(`⚠️  Failed to parse PDF: ${error.message}`);
      console.warn(`   Skipping PDF: ${filePath}`);
      return '';
    }
  },
};

// Registry of all processors
const PROCESSORS: FileProcessor[] = [
  markdownProcessor,
  textProcessor,
  jsonProcessor,
  pdfProcessor,
];

// ============================================================================
// FILE DISCOVERY & METADATA
// ============================================================================

interface FileMetadata {
  filePath: string;
  relativePath: string;
  title: string;
  url: string;
  category: string;
  extension: string;
}

function extractMetadataFromPath(filePath: string): FileMetadata {
  const relativePath = path.relative(CONFIG.contentDir, filePath);
  const parsed = path.parse(relativePath);
  
  // Extract category from directory structure
  // e.g., "projects/dashboard/README.md" -> "projects"
  const parts = relativePath.split(path.sep);
  const category = parts.length > 1 ? parts[0] : 'general';
  
  // Generate title from filename
  // e.g., "my-awesome-project.md" -> "My Awesome Project"
  const title = parsed.name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  // Generate URL
  const urlPath = relativePath
    .replace(/\\/g, '/')
    .replace(/\.(md|mdx|txt|pdf|json)$/, '')
    .toLowerCase();
  
  const url = `${CONFIG.baseUrl}/${urlPath}`;
  
  return {
    filePath,
    relativePath,
    title,
    url,
    category,
    extension: parsed.ext,
  };
}

async function discoverFiles(): Promise<FileMetadata[]> {
  console.log(`🔍 Discovering files in: ${CONFIG.contentDir}\n`);
  
  if (!fs.existsSync(CONFIG.contentDir)) {
    throw new Error(`Content directory not found: ${CONFIG.contentDir}`);
  }
  
  const files: FileMetadata[] = [];
  
  for (const pattern of CONFIG.patterns) {
    const matches = await glob(pattern, {
      cwd: CONFIG.contentDir,
      ignore: CONFIG.ignore,
      absolute: true,
    });
    
    for (const filePath of matches) {
      const metadata = extractMetadataFromPath(filePath);
      files.push(metadata);
    }
  }
  
  return files;
}

// ============================================================================
// CONTENT EXTRACTION
// ============================================================================

async function extractContent(file: FileMetadata): Promise<string> {
  const processor = PROCESSORS.find(p => 
    p.extensions.includes(file.extension)
  );
  
  if (!processor) {
    console.warn(`⚠️  No processor for ${file.extension}, skipping: ${file.relativePath}`);
    return '';
  }
  
  try {
    return await processor.process(file.filePath);
  } catch (error: any) {
    console.error(`❌ Error processing ${file.relativePath}:`, error.message);
    return '';
  }
}

// ============================================================================
// CHUNKING
// ============================================================================

interface Chunk {
  content: string;
  index: number;
}

function chunkText(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/);
  
  const tokensPerWord = 1.3;
  const targetWords = Math.floor(CONFIG.chunkSize / tokensPerWord);
  const overlapWords = Math.floor(CONFIG.chunkOverlap / tokensPerWord);
  
  let i = 0;
  let chunkIndex = 0;
  
  while (i < words.length) {
    const chunkWords = words.slice(i, i + targetWords);
    const content = chunkWords.join(' ').trim();
    
    if (content.length > 0) {
      chunks.push({ content, index: chunkIndex++ });
    }
    
    i += targetWords - overlapWords;
  }
  
  return chunks;
}

// ============================================================================
// EMBEDDING & STORAGE
// ============================================================================

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const batchSize = 100;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    
    embeddings.push(...response.data.map(d => d.embedding));
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return embeddings;
}

async function storeDocuments(docs: any[]): Promise<void> {
  const batchSize = 10; // Smaller batches for better reliability
  let hasError = false;
  
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    // Retry logic
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        const { error } = await supabase.from('documents').insert(batch);
        
        if (error) {
          throw error;
        }
        
        console.log(`✅ Inserted batch ${batchNum} (${batch.length} docs)`);
        success = true;
        
        // Small delay between batches to avoid overwhelming the connection
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        retries--;
        console.log(`⚠️  Batch ${batchNum} failed, retrying... (${retries} attempts left)`);
        
        if (retries === 0) {
          console.error(`❌ Failed to insert batch ${batchNum} after 3 attempts:`, error);
          hasError = true;
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * (4 - retries)));
        }
      }
    }
  }
  
  if (hasError) {
    throw new Error('Some batches failed to insert');
  }
}

// ============================================================================
// MAIN INGESTION
// ============================================================================

async function ingest() {
  console.log('🚀 File-Based RAG Ingestion Pipeline\n');
  console.log('━'.repeat(70));
  
  const startTime = Date.now();
  let totalFiles = 0;
  let totalChunks = 0;
  let totalCost = 0;
  
  try {
    // Optional: clear existing data
    if (process.argv.includes('--clear')) {
      console.log('\n🗑️  Clearing existing documents...');
      await supabase
        .from('documents')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('✅ Cleared\n');
    }
    
    // 1. Discover files
    const files = await discoverFiles();
    
    if (files.length === 0) {
      console.log(`❌ No files found in ${CONFIG.contentDir}`);
      console.log(`\nCreate the directory and add files:`);
      console.log(`  mkdir -p ${CONFIG.contentDir}/projects`);
      console.log(`  echo "# My Project" > ${CONFIG.contentDir}/projects/example.md`);
      return;
    }
    
    console.log(`Found ${files.length} files:\n`);
    
    const filesByCategory = files.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(filesByCategory).forEach(([category, count]) => {
      console.log(`  📁 ${category}: ${count} file(s)`);
    });
    
    console.log('\n' + '━'.repeat(70));
    
    // 2. Process each file
    const allDocs: any[] = [];
    
    for (const file of files) {
      console.log(`\n📄 ${file.relativePath}`);
      console.log(`   Category: ${file.category}`);
      console.log(`   Title: ${file.title}`);
      
      // Extract content
      const content = await extractContent(file);
      
      if (!content || content.length < 50) {
        console.log(`   ⚠️  Skipped (empty or too short)`);
        continue;
      }
      
      console.log(`   Length: ${content.length} chars`);
      
      // Chunk content
      const chunks = chunkText(content);
      console.log(`   Chunks: ${chunks.length}`);
      
      // Generate embeddings
      console.log(`   Generating embeddings...`);
      const embeddings = await generateEmbeddings(
        chunks.map(c => c.content)
      );
      
      // Calculate cost
      const tokens = content.length / 4;
      const cost = (tokens / 1_000_000) * 0.02;
      totalCost += cost;
      
      // Prepare documents
      for (let i = 0; i < chunks.length; i++) {
        allDocs.push({
          title: file.title,
          url: file.url,
          content: chunks[i].content,
          chunk_index: chunks[i].index,
          total_chunks: chunks.length,
          embedding: embeddings[i],
          metadata: {
            category: file.category,
            file_path: file.relativePath,
            extension: file.extension,
          },
        });
      }
      
      totalFiles++;
      totalChunks += chunks.length;
      console.log(`   ✅ Processed ($${cost.toFixed(4)})`);
    }
    
    // 3. Store in Supabase
    if (allDocs.length > 0) {
      console.log(`\n💾 Storing ${allDocs.length} document chunks...`);
      try {
        await storeDocuments(allDocs);
        console.log('✅ All documents stored successfully');
      } catch (error: any) {
        console.error('⚠️  Some documents failed to store');
      }
    }
    
    // 4. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '━'.repeat(70));
    console.log('✨ Ingestion Complete!\n');
    console.log('📊 Statistics:');
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   Avg chunks/file: ${(totalChunks / totalFiles).toFixed(1)}`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   Duration: ${duration}s`);
    console.log('━'.repeat(70));
    
    // 5. Test query
    console.log('\n🔍 Testing search...');
    const testQuery = 'What projects are documented here?';
    const testEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });
    
    const { data: results } = await supabase.rpc('match_documents', {
      query_embedding: testEmbedding.data[0].embedding,
      match_threshold: 0.3,
      match_count: 5,
    });
    
    console.log(`Query: "${testQuery}"`);
    console.log(`Results: ${results?.length || 0} matches\n`);
    
    if (results && results.length > 0) {
      results.forEach((r: any, i: number) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   Match: ${(r.similarity * 100).toFixed(1)}%`);
        console.log(`   Preview: ${r.content.substring(0, 80)}...`);
      });
    }
    
    console.log('\n✅ Your RAG system is ready!');
    console.log(`\nNext: Start your dev server and ask questions about your content.`);
    
  } catch (error: any) {
    console.error('\n❌ Ingestion failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  console.log('\n📁 Content Directory:', path.resolve(CONFIG.contentDir));
  console.log('📋 Patterns:', CONFIG.patterns.join(', '));
  console.log('🚫 Ignoring:', CONFIG.ignore.join(', '));
  console.log();
  
  ingest();
}

export { ingest, extractContent, chunkText };