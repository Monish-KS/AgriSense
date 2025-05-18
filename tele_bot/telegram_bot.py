import logging
import os
import firebase_admin
from firebase_admin import credentials, firestore
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes
from google.generativeai import GenerativeModel, configure

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO)

# --- Firebase Init ---
cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# --- Gemini Init ---
configure(api_key="XXXXX")
model = GenerativeModel("gemini-2.0-flash")

# --- Telegram Bot Token ---
BOT_TOKEN = "XXXXXXXXX"

# --- Languages ---
LANGUAGES = {
    "en": "English 🇬🇧",
    "hi": "Hindi 🇮🇳",
    "ta": "Tamil 🇮🇳",
    "te": "Telugu 🇮🇳",
    "ml": "Malayalam 🇮🇳"
}

# --- Start Handler ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    # Language selection buttons
    keyboard = [
        [InlineKeyboardButton(name, callback_data=f"lang_{code}")]
        for code, name in LANGUAGES.items()
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "👋 Welcome to AgroBot!\nPlease select your preferred language:",
        reply_markup=reply_markup
    )

# --- Set Language Handler ---
async def setlang(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(name, callback_data=f"lang_{code}")]
        for code, name in LANGUAGES.items()
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "🌐 Choose your new language preference:",
        reply_markup=reply_markup
    )

# --- Handle Language Selection ---
async def handle_language_choice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    user_id = str(query.from_user.id)
    lang_code = query.data.split("_")[1]

    db.collection("users").document(user_id).set({
        "language": lang_code,
        "farm_id": "farm001"
    })

    await query.edit_message_text(
        f"✅ Language set to: {LANGUAGES[lang_code]}"
    )

# --- Status Handler ---
async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    user_doc = db.collection("users").document(user_id).get()

    if not user_doc.exists:
        await update.message.reply_text("❗Please set your language using /start first.")
        return

    user_data = user_doc.to_dict()
    lang = user_data.get("language", "en")
    farm_id = user_data.get("farm_id", "farm001")

    farm_doc = db.collection("farms").document(farm_id).get()
    if not farm_doc.exists:
        await update.message.reply_text("❌ Farm data not found.")
        return

    farm = farm_doc.to_dict()

    # Prompt for Gemini
    prompt = f"""
You are an agriculture assistant bot. Respond in {LANGUAGES[lang].split()[0]} language.

Give a simple, emoji-filled update for the following farm:

🌾 Farm Name: {farm['name']}
🌡️ Temperature: {farm['temperature']}°C
💧 Moisture: {farm['moisture']}%
💦 Humidity: {farm['humidity']}%

Make it understandable to rural farmers. Keep it short and friendly.
"""

    gemini_response = model.generate_content(prompt)
    reply = gemini_response.text.strip()

    await update.message.reply_text(reply)

# --- Main Function ---
def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("setlang", setlang))
    app.add_handler(CallbackQueryHandler(handle_language_choice, pattern="^lang_"))

    app.run_polling()

if __name__ == "__main__":
    main()
