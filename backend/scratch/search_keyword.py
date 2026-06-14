import os
import sys

keyword = 'dashboard'
search_dir = 'apps'
sys.path.append(os.getcwd())

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.py'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f, 1):
                        if keyword in line.lower():
                            print(f"{path}:{i}: {line.strip()}")
            except Exception:
                pass
