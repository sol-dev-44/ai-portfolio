#!/usr/bin/env python3
"""
parse_lsat_pdf.py - Parse official LSAT PrepTest PDFs into structured JSON

Usage:
    python parse_lsat_pdf.py path/to/preptest.pdf
    python parse_lsat_pdf.py --url https://example.com/preptest.pdf
    python parse_lsat_pdf.py --fetch-free  # Fetch all free official tests

Output goes to: backend/lsat_cache/questions/parsed_questions.json
"""

import argparse
import json
import re
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
import urllib.request

# Try importing PDF libraries with better error handling
HAS_PYMUPDF = False
HAS_PDFPLUMBER = False

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
    print("✅ PyMuPDF loaded")
except ImportError as e:
    print(f"⚠️ PyMuPDF not available: {e}")
except Exception as e:
    print(f"⚠️ PyMuPDF error: {e}")

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
    print("✅ pdfplumber loaded")
except ImportError as e:
    print(f"⚠️ pdfplumber not available: {e}")
except Exception as e:
    print(f"⚠️ pdfplumber error: {e}")

# Output directory
OUTPUT_DIR = Path("./lsat_cache/questions")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Free official LSAT PDF URLs
FREE_LSAT_PDFS = {
    "june-2007": "https://cache.careers360.mobi/media/uploads/froala_editor/files/LSAT-practice-set.pdf",
    "preptest-70": "https://img.cracklsat.net/lsat/pt/pt70.pdf",
    "preptest-93": "https://www.lsac.org/sites/default/files/media/January-2023-LSAT-Disclosure-Booklet.pdf",
}

# =============================================================================
# PDF TEXT EXTRACTION
# =============================================================================

def extract_text_pymupdf(pdf_path: str) -> str:
    """Extract text using PyMuPDF (fitz)."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def extract_text_pdfplumber(pdf_path: str) -> str:
    """Extract text using pdfplumber."""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text(pdf_path: str) -> str:
    """Extract text from PDF using available library."""
    if HAS_PYMUPDF:
        return extract_text_pymupdf(pdf_path)
    elif HAS_PDFPLUMBER:
        return extract_text_pdfplumber(pdf_path)
    else:
        raise ImportError("Install PyMuPDF (fitz) or pdfplumber: pip install PyMuPDF pdfplumber")

# =============================================================================
# QUESTION PARSING
# =============================================================================

def parse_logical_reasoning(text: str, preptest_id: str) -> List[Dict[str, Any]]:
    """Parse Logical Reasoning section questions."""
    questions = []
    
    # Pattern to find question blocks
    # Questions typically start with a number and end with answer choices
    question_pattern = re.compile(
        r'(\d+)\.\s+'  # Question number
        r'(.*?)'        # Stimulus/context
        r'(?=\n\s*\(A\))',  # Lookahead for answer A
        re.DOTALL
    )
    
    # Answer choice pattern
    answer_pattern = re.compile(
        r'\(A\)\s*(.*?)\s*'
        r'\(B\)\s*(.*?)\s*'
        r'\(C\)\s*(.*?)\s*'
        r'\(D\)\s*(.*?)\s*'
        r'\(E\)\s*(.*?)(?=\n\d+\.|GO ON|$)',
        re.DOTALL
    )
    
    # Find all question blocks
    for match in question_pattern.finditer(text):
        q_num = match.group(1)
        full_text = match.group(2).strip()
        
        # Try to separate stimulus from question stem
        # Look for common question stem indicators
        stem_indicators = [
            r'Which one of the following',
            r'The argument',
            r'The reasoning',
            r'The passage',
            r'Which of the following',
            r'The author',
            r'The statement',
            r'If the statements',
        ]
        
        stimulus = full_text
        question_stem = ""
        
        for indicator in stem_indicators:
            parts = re.split(f'({indicator})', full_text, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) >= 3:
                stimulus = parts[0].strip()
                question_stem = parts[1] + parts[2]
                break
        
        # Find answer choices after this question
        remaining = text[match.end():]
        answer_match = answer_pattern.search(remaining)
        
        if answer_match:
            options = [
                answer_match.group(1).strip(),
                answer_match.group(2).strip(),
                answer_match.group(3).strip(),
                answer_match.group(4).strip(),
                answer_match.group(5).strip(),
            ]
            
            questions.append({
                "id": f"{preptest_id}-lr-{q_num}",
                "preptest": preptest_id,
                "section": "logical_reasoning",
                "question_number": int(q_num),
                "context": stimulus,
                "question": question_stem or stimulus,
                "options": options,
                "answer": None,  # Would need answer key
            })
    
    return questions

def parse_analytical_reasoning(text: str, preptest_id: str) -> List[Dict[str, Any]]:
    """Parse Analytical Reasoning (Logic Games) section."""
    questions = []
    
    # Games typically start with "Questions X-Y" or a setup paragraph
    game_pattern = re.compile(
        r'Questions?\s+(\d+)[-–](\d+)\s+'  # Question range
        r'(.*?)'  # Game setup
        r'(?=Questions?\s+\d+|SECTION|$)',
        re.DOTALL | re.IGNORECASE
    )
    
    for game_match in game_pattern.finditer(text):
        start_q = int(game_match.group(1))
        end_q = int(game_match.group(2))
        setup = game_match.group(3).strip()
        
        # Extract individual questions from this game
        game_text = game_match.group(0)
        
        q_pattern = re.compile(
            r'(\d+)\.\s+(.*?)\s*'
            r'\(A\)\s*(.*?)\s*'
            r'\(B\)\s*(.*?)\s*'
            r'\(C\)\s*(.*?)\s*'
            r'\(D\)\s*(.*?)\s*'
            r'\(E\)\s*(.*?)(?=\n\d+\.|$)',
            re.DOTALL
        )
        
        for q_match in q_pattern.finditer(game_text):
            q_num = int(q_match.group(1))
            if start_q <= q_num <= end_q:
                questions.append({
                    "id": f"{preptest_id}-ar-{q_num}",
                    "preptest": preptest_id,
                    "section": "analytical_reasoning",
                    "question_number": q_num,
                    "context": setup,  # Game setup is shared
                    "question": q_match.group(2).strip(),
                    "options": [
                        q_match.group(3).strip(),
                        q_match.group(4).strip(),
                        q_match.group(5).strip(),
                        q_match.group(6).strip(),
                        q_match.group(7).strip(),
                    ],
                    "answer": None,
                })
    
    return questions

def parse_answer_key(text: str) -> Dict[int, str]:
    """Extract answer key from PDF."""
    answers = {}
    
    # Look for answer key section
    key_pattern = re.compile(
        r'(?:ANSWER KEY|Answer Key|ANSWERS)\s*'
        r'(.*?)(?:SECTION|$)',
        re.DOTALL | re.IGNORECASE
    )
    
    key_match = key_pattern.search(text)
    if key_match:
        key_text = key_match.group(1)
        
        # Parse "1. A", "2. B" format
        for match in re.finditer(r'(\d+)\.\s*([A-E])', key_text):
            answers[int(match.group(1))] = match.group(2)
    
    return answers

def parse_lsat_pdf(pdf_path: str, preptest_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Parse an LSAT PrepTest PDF into structured questions."""
    print(f"📄 Extracting text from {pdf_path}...")
    text = extract_text(pdf_path)
    
    if not preptest_id:
        # Try to extract from filename
        preptest_id = Path(pdf_path).stem.replace("_", "-").lower()
    
    print(f"📝 Parsing questions for {preptest_id}...")
    
    questions = []
    
    # Try to find and parse each section
    sections = [
        ("SECTION I", "SECTION II"),
        ("SECTION II", "SECTION III"),
        ("SECTION III", "SECTION IV"),
        ("SECTION IV", "ANSWER KEY"),
    ]
    
    for start, end in sections:
        start_idx = text.find(start)
        end_idx = text.find(end) if end else len(text)
        
        if start_idx == -1:
            continue
            
        section_text = text[start_idx:end_idx if end_idx > start_idx else len(text)]
        
        # Detect section type
        if "Analytical Reasoning" in section_text or "logic game" in section_text.lower():
            questions.extend(parse_analytical_reasoning(section_text, preptest_id))
        else:
            # Assume Logical Reasoning or Reading Comprehension
            questions.extend(parse_logical_reasoning(section_text, preptest_id))
    
    # Try to match answer key
    answers = parse_answer_key(text)
    for q in questions:
        q_num = q.get("question_number")
        if q_num and q_num in answers:
            q["answer"] = answers[q_num]
    
    print(f"✅ Parsed {len(questions)} questions")
    return questions

# =============================================================================
# SIMPLIFIED PARSING (for messy PDFs)
# =============================================================================

def simple_parse(text: str, preptest_id: str) -> List[Dict[str, Any]]:
    """Simpler regex-based parsing for messy PDF extractions."""
    questions = []
    
    # Very simple pattern: number + text + (A) through (E)
    pattern = re.compile(
        r'(\d+)\.\s+'  # Question number
        r'([\s\S]*?)'   # Any content
        r'\(A\)\s*([\s\S]*?)'
        r'\(B\)\s*([\s\S]*?)'
        r'\(C\)\s*([\s\S]*?)'
        r'\(D\)\s*([\s\S]*?)'
        r'\(E\)\s*([\s\S]*?)'
        r'(?=\d+\.\s|\Z)',  # Until next question or end
        re.MULTILINE
    )
    
    for match in pattern.finditer(text):
        q_num = match.group(1)
        content = match.group(2).strip()
        
        # Clean up the content
        content = re.sub(r'\s+', ' ', content)
        
        questions.append({
            "id": f"{preptest_id}-{q_num}",
            "preptest": preptest_id,
            "question_number": int(q_num),
            "context": "",
            "question": content,
            "options": [
                re.sub(r'\s+', ' ', match.group(i).strip())
                for i in range(3, 8)
            ],
            "answer": None,
        })
    
    return questions

# =============================================================================
# URL FETCHING
# =============================================================================

def download_pdf(url: str, output_path: Path) -> Path:
    """Download a PDF from URL."""
    print(f"⬇️  Downloading {url}...")
    urllib.request.urlretrieve(url, output_path)
    print(f"✅ Saved to {output_path}")
    return output_path

def fetch_free_preptests() -> List[Dict[str, Any]]:
    """Download and parse all free official PrepTests."""
    all_questions = []
    temp_dir = OUTPUT_DIR / "temp_pdfs"
    temp_dir.mkdir(exist_ok=True)
    
    for name, url in FREE_LSAT_PDFS.items():
        try:
            pdf_path = temp_dir / f"{name}.pdf"
            if not pdf_path.exists():
                download_pdf(url, pdf_path)
            
            questions = parse_lsat_pdf(str(pdf_path), name)
            if not questions:
                # Try simple parsing
                text = extract_text(str(pdf_path))
                questions = simple_parse(text, name)
            
            all_questions.extend(questions)
            
        except Exception as e:
            print(f"❌ Error processing {name}: {e}")
            continue
    
    return all_questions

# =============================================================================
# SAVING
# =============================================================================

def save_questions(questions: List[Dict[str, Any]], filename: str = "parsed_questions.json"):
    """Save parsed questions to JSON file, merging with existing."""
    output_path = OUTPUT_DIR / filename
    
    existing = []
    if output_path.exists():
        with open(output_path, 'r') as f:
            data = json.load(f)
            existing = data.get("questions", data if isinstance(data, list) else [])
    
    # Merge, avoiding duplicates by ID
    existing_ids = {q.get("id") for q in existing}
    new_questions = [q for q in questions if q.get("id") not in existing_ids]
    
    all_questions = existing + new_questions
    
    with open(output_path, 'w') as f:
        json.dump({
            "questions": all_questions,
            "total": len(all_questions),
            "updated_at": datetime.now().isoformat(),
            "sources": list(set(q.get("preptest", "unknown") for q in all_questions))
        }, f, indent=2)
    
    print(f"\n📊 Total questions: {len(all_questions)}")
    print(f"   New questions added: {len(new_questions)}")
    print(f"   Output: {output_path}")
    
    return len(new_questions)

# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Parse LSAT PrepTest PDFs")
    parser.add_argument("pdf_path", nargs="?", help="Path to PDF file")
    parser.add_argument("--url", help="URL to download PDF from")
    parser.add_argument("--fetch-free", action="store_true", help="Fetch all free official PrepTests")
    parser.add_argument("--preptest-id", help="PrepTest identifier (e.g., 'pt70')")
    parser.add_argument("--output", default="parsed_questions.json", help="Output filename")
    parser.add_argument("--simple", action="store_true", help="Use simple parsing (for messy PDFs)")
    
    args = parser.parse_args()
    
    # Check for PDF library
    if not HAS_PYMUPDF and not HAS_PDFPLUMBER:
        print("❌ No PDF library found!")
        print("   Install one of: pip install PyMuPDF pdfplumber")
        sys.exit(1)
    
    questions = []
    
    if args.fetch_free:
        questions = fetch_free_preptests()
    
    elif args.url:
        temp_path = OUTPUT_DIR / "temp_download.pdf"
        download_pdf(args.url, temp_path)
        
        if args.simple:
            text = extract_text(str(temp_path))
            questions = simple_parse(text, args.preptest_id or "downloaded")
        else:
            questions = parse_lsat_pdf(str(temp_path), args.preptest_id)
    
    elif args.pdf_path:
        if args.simple:
            text = extract_text(args.pdf_path)
            questions = simple_parse(text, args.preptest_id or Path(args.pdf_path).stem)
        else:
            questions = parse_lsat_pdf(args.pdf_path, args.preptest_id)
    
    else:
        parser.print_help()
        sys.exit(1)
    
    if questions:
        save_questions(questions, args.output)
    else:
        print("⚠️  No questions parsed. Try --simple flag for messy PDFs.")

if __name__ == "__main__":
    main()