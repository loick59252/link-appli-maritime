#!/bin/bash

# ==============================
# ⚓ PUSH AUTOMATIQUE MARITIME
# ==============================

echo "📦 Ajout des fichiers..."
git add .

# Date / heure
DATE=$(date '+%Y-%m-%d')
HEURE=$(date '+%H:%M:%S')

# Message utilisateur
read -p "💬 Message complémentaire (optionnel) : " user_msg

# Message final formaté demandé :
# "Commit 'Date' - 'Heure'"
if [ -z "$user_msg" ]; then
  message="Commit '$DATE' - '$HEURE'"
else
  message="Commit '$DATE' - '$HEURE' - $user_msg"
fi

echo "✍️ Commit : $message"
git commit -m "$message"

# Branche actuelle
BRANCH=$(git branch --show-current)

echo "🚀 Push sur $BRANCH..."
git push origin "$BRANCH"

# ==============================
# 📜 CHANGELOG AUTOMATIQUE
# ==============================

CHANGELOG="CHANGELOG.md"

echo "📜 Mise à jour du changelog..."

# création si inexistant
if [ ! -f "$CHANGELOG" ]; then
  echo "# 📜 Changelog" > "$CHANGELOG"
  echo "" >> "$CHANGELOG"
fi

TEMP=$(mktemp)

{
  echo "## $DATE - $HEURE"
  echo "- $message"
  echo ""
  cat "$CHANGELOG"
} > "$TEMP"

mv "$TEMP" "$CHANGELOG"

echo "✅ Terminé !"
