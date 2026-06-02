import os
import re
import json
import shutil

SRC_DIR = "/opt/cran_clean_mds/docs"
DEST_DIR = "/opt/telcostuff/public/docs"

os.makedirs(DEST_DIR, exist_ok=True)
os.makedirs(os.path.join(DEST_DIR, "acts"), exist_ok=True)
os.makedirs(os.path.join(DEST_DIR, "gazettes"), exist_ok=True)
os.makedirs(os.path.join(DEST_DIR, "regulations", "final"), exist_ok=True)
os.makedirs(os.path.join(DEST_DIR, "regulations", "draft"), exist_ok=True)

# List of all files we process
documents = []

# Gather all markdown files and assign IDs and clean names
# Categories: acts, gazettes, regulations/final, regulations/draft
categories = [
    ("acts", "acts"),
    ("gazettes", "gazettes"),
    ("regulations/final", "regulations/final"),
    ("regulations/draft", "regulations/draft")
]

# We will build a list of all known gazette numbers and document IDs to map references
known_gazettes = set()
known_docs = {} # id -> metadata

# Step 1: Collect files and assign new names and IDs
for folder_rel, doc_type in categories:
    folder_path = os.path.join(SRC_DIR, folder_rel)
    if not os.path.exists(folder_path):
        continue
    
    for filename in os.listdir(folder_path):
        if not filename.endswith(".md") or filename == "index.md":
            continue
            
        full_path = os.path.join(folder_path, filename)
        
        # New filename and ID
        new_filename = filename
        doc_id = ""
        
        if doc_type == "acts":
            doc_id = filename.replace(".md", "")
        elif doc_type == "gazettes":
            # Prepend GG for gazette number
            num_part = filename.replace(".md", "")
            new_filename = f"GG_{num_part}.md"
            doc_id = f"GG_{num_part}"
            known_gazettes.add(num_part)
        elif doc_type == "regulations/final":
            doc_id = "REG_FINAL_" + filename.replace(".md", "").replace(" ", "_")
        elif doc_type == "regulations/draft":
            doc_id = "REG_DRAFT_" + filename.replace(".md", "").replace(" ", "_")
            
        known_docs[doc_id] = {
            "id": doc_id,
            "original_name": filename,
            "new_filename": new_filename,
            "path_rel": folder_rel,
            "full_path": full_path,
            "type": doc_type.split("/")[0], # acts, gazettes, regulations
            "subtype": doc_type.split("/")[1] if "/" in doc_type else None
        }

# Month translation for parsing dates
months = {
    "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06",
    "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04", "jun": "06", "jul": "07", "aug": "08", "sep": "09",
    "oct": "10", "nov": "11", "dec": "12"
}

def clean_text_for_summary(text):
    # Remove front-matter
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            text = parts[2]
            
    # Remove markdown headers and tables
    text = re.sub(r'#+\s+.*', '', text)
    text = re.sub(r'\|.*\|', '', text)
    text = re.sub(r'[-=]{3,}', '', text)
    
    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:250] + "..." if len(text) > 250 else text

# Step 2: Read files, extract titles, dates, summaries, and copy them
processed_docs = []

for doc_id, info in known_docs.items():
    with open(info["full_path"], "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    title = ""
    date_str = ""
    
    # Try parsing front-matter title
    fm_match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        fm_content = fm_match.group(1)
        title_match = re.search(r'^title:\s*(.*)$', fm_content, re.MULTILINE)
        if title_match:
            title = title_match.group(1).strip().strip('"').strip("'")
            
    # Try finding title or heading if empty
    if not title:
        # Find first heading starting with ## or # that is not standard metadata
        headings = re.findall(r'^##\s+(.*)$', content, re.MULTILINE)
        for h in headings:
            h_clean = h.strip()
            if not any(x in h_clean.lower() for x in ["government gazette", "contents", "general notice", "generalnotices", "definitions", "purpose", "government notice"]):
                title = h_clean
                break
                
    # Fallback/specific rules
    if info["type"] == "gazettes":
        # Extract gazette number
        num = info["original_name"].replace(".md", "")
        # Find date in the file, like "WINDHOEK - 25 November 2011"
        date_match = re.search(r'(?:windhoek|dated|windhoek,)\s*[-–,]\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})', content, re.IGNORECASE)
        if date_match:
            raw_date = date_match.group(1)
            title = f"Government Gazette No. {num} ({raw_date})"
            # Convert date to YYYY-MM-DD
            parts = raw_date.split()
            if len(parts) == 3:
                day, month_str, year = parts
                month = months.get(month_str.lower(), "01")
                date_str = f"{year}-{month}-{int(day):02d}"
        else:
            title = f"Government Gazette No. {num}"
            
    # Override for acts/regulations if title is generic or missing
    is_generic = not title or any(x in title.lower() for x in ["government notice", "government gazette", "contents", "notice", "general notice", "page", "office of the prime minister", "promulgation of act", "republic of namibia"])
    if (info["type"] == "acts" or info["type"] == "regulations") and is_generic:
        fn_clean = info["original_name"].replace(".md", "").replace("-", " ").replace("_", " ")
        title = fn_clean.title()
        if "Act 8 Of 2009" in title:
            title = "Communications Act 8 of 2009"
        elif "Amendment Act" in title:
            title = "Communications Amendment Act 2020"
        elif "Licensin" in title:
            title = title.replace("Licensin", "Licensing")
            
    # Clean up any trailing brackets/formatting
    if title:
        title = re.sub(r'\s+', ' ', title).strip()
        
    summary = clean_text_for_summary(content)
    
    # Copy file to destination
    dest_file_path = os.path.join(DEST_DIR, info["path_rel"], info["new_filename"])
    shutil.copy2(info["full_path"], dest_file_path)
    
    processed_docs.append({
        "id": doc_id,
        "title": title,
        "type": info["type"],
        "subtype": info["subtype"],
        "filename": os.path.join("docs", info["path_rel"], info["new_filename"]),
        "date": date_str if date_str else None,
        "summary": summary,
        "content_length": len(content),
        "content_preview": content[:1000] # for references matching
    })

# Step 3: Build connections/links between documents
links = []
connections_count = {doc["id"]: 0 for doc in processed_docs}

# We scan each document's raw content to find mentions of other documents
for source_doc in processed_docs:
    source_id = source_doc["id"]
    # Read the full copied content to scan
    dest_file_path = os.path.join(DEST_DIR, source_doc["filename"].replace("docs/", ""))
    with open(dest_file_path, "r", encoding="utf-8") as f:
        full_content = f.read()
        
    # Set to store links for this document to avoid duplicates
    target_ids = set()
    
    # Look for gazette numbers in content: "GG XXXX", "Gazette No. XXXX", "Gazette XXXX", "No. XXXX"
    # To avoid matching random 4-digit numbers, look for context
    gazette_matches = re.findall(r'(?:gazette|gg|notice|no\.|no)\s*(\d{4})', full_content, re.IGNORECASE)
    for g_num in gazette_matches:
        target_gg_id = f"GG_{g_num}"
        if target_gg_id in connections_count and target_gg_id != source_id:
            target_ids.add(target_gg_id)
            
    # Look for Act references
    if "act 8 of 2009" in full_content.lower() or "communications act" in full_content.lower():
        act_id = "Communications_Act_8_of_2009"
        if act_id != source_id:
            target_ids.add(act_id)
            
    if "amendment act" in full_content.lower() or "communications amendment act" in full_content.lower():
        act_id = "Communications-Amendment-Act"
        if act_id != source_id:
            target_ids.add(act_id)
            
    # Check for direct mentions of regulation filenames or parts of them
    for other_doc in processed_docs:
        other_id = other_doc["id"]
        if other_id == source_id or other_id in target_ids:
            continue
        
        # Check if ID/Name is referenced in content
        # E.g. "NUMBERING-REGULATIONS" or "Broadcasting_Code"
        short_name = other_id.replace("REG_FINAL_", "").replace("REG_DRAFT_", "").replace("_", " ").replace("-", " ")
        if len(short_name) > 8 and short_name.lower() in full_content.lower():
            target_ids.add(other_id)

    # Save links
    for target_id in target_ids:
        links.append({
            "source": source_id,
            "target": target_id
        })
        connections_count[source_id] += 1
        connections_count[target_id] += 1

# Update connections count in node metadata
for doc in processed_docs:
    doc["linksCount"] = connections_count[doc["id"]]
    # Clean up preview since we don't want to send it in JSON metadata
    del doc["content_preview"]

# Write metadata file
metadata = {
    "nodes": processed_docs,
    "links": links
}

metadata_dest = os.path.join(DEST_DIR, "metadata.json")
with open(metadata_dest, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print(f"Processed {len(processed_docs)} documents.")
print(f"Generated {len(links)} links.")
print(f"Metadata written to {metadata_dest}")
