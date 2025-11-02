#!/bin/bash
# check-links.sh - Validate all internal markdown links
# Part of Phase 0: Preparation & Safety Net

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking all internal markdown links..."
echo ""

BROKEN_LINKS=0
TOTAL_LINKS=0

# Find all markdown files in docs/ and root
find . -name "*.md" -type f | grep -E "(^./[A-Z]|^./docs/)" | sort | while read file; do
    # Skip files in node_modules or .git
    [[ "$file" =~ node_modules|\.git ]] && continue

    # Extract all markdown links [text](link)
    grep -oP '\[.*?\]\(\K[^)]+' "$file" 2>/dev/null | while read link; do
        TOTAL_LINKS=$((TOTAL_LINKS + 1))

        # Skip external links (http/https)
        [[ "$link" =~ ^https?:// ]] && continue

        # Skip anchors (same page)
        [[ "$link" =~ ^# ]] && continue

        # Skip mailto links
        [[ "$link" =~ ^mailto: ]] && continue

        # Resolve relative path
        dir=$(dirname "$file")

        # Remove anchor from link for file existence check
        link_file="${link%%#*}"

        # Build full path
        if [[ "$link_file" == /* ]]; then
            # Absolute path from repo root
            target=".$link_file"
        else
            # Relative path
            target="$dir/$link_file"
        fi

        # Normalize path (remove ./ and ../)
        target=$(realpath -m "$target")

        # Check if target exists (file or directory)
        if [ ! -f "$target" ] && [ ! -d "$target" ]; then
            echo -e "${RED}✗ BROKEN:${NC} $file"
            echo -e "  ${YELLOW}→${NC} $link"
            echo -e "  ${YELLOW}Expected at:${NC} $target"
            echo ""
            BROKEN_LINKS=$((BROKEN_LINKS + 1))
        fi
    done
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $BROKEN_LINKS -eq 0 ]; then
    echo -e "${GREEN}✅ All internal links are valid!${NC}"
else
    echo -e "${RED}❌ Found $BROKEN_LINKS broken link(s)${NC}"
    exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
