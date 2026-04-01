import os
import re

def remove_comments(file_path):
    # 1. Skip binary files by checking extensions we actually care about
    valid_extensions = {'.py', '.js', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.sh'}
    ext = os.path.splitext(file_path)[1]
    
    if ext not in valid_extensions:
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"Skipping binary/non-utf8 file: {file_path}")
        return

    # --- REGEX LOGIC ---
    # C-Style
    if ext in ['.js', '.java', '.cpp', '.c', '.cs', '.php']:
        pattern = r"(\".*?\"|\'.*?\')|(/\*.*?\*/|//[^\r\n]*)"
        def replacer(match):
            return match.group(1) if match.group(1) else ""
        new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)

    # Scripting (Python, Bash, etc.)
    elif ext in ['.py', '.rb', '.sh']:
        # This regex protects shebangs (#!/bin/bash) and strings
        pattern = r"(\".*?\"|\'.*?\')|((?<!^)[ \t]*#.*)" 
        def replacer(match):
            return match.group(1) if match.group(1) else ""
        new_content = re.sub(pattern, replacer, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Cleaned: {file_path}")

# Run in current directory
for filename in os.listdir('.'):
    # 2. Don't process directories or this script itself
    if os.path.isfile(filename) and filename != 'cd.py':
        remove_comments(filename)