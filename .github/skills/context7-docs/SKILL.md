---
name: context7-docs
description: "Use when current, version-specific library documentation is needed; fetch official public docs through the Context7 CLI (ctx7 search, library, docs) without MCP."
argument-hint: "Library and documentation question"
user-invocable: true
---

# תיעוד עדכני באמצעות Context7 CLI

## מטרה

להביא תיעוד עדכני של ספריות מתוך Context7 באמצעות `ctx7` בלבד. ה־Skill אינו מגדיר MCP Server ואינו קורא כלים `resolve-library-id` או `query-docs`.

## תהליך

1. זהה את הספרייה, הגרסה והשאלה המדויקת. העדף את גרסת הספרייה שמותקנת בפרויקט.
2. לשאלה ממוקדת, הרץ `ctx7 search "<question about the library>"` כדי לאתר ספרייה ותיעוד רלוונטיים.
3. אם נדרש בירור נפרד, הרץ `ctx7 library <library-name> "<question>"`, ואז השתמש במזהה שהוחזר ב־`ctx7 docs <library-id> "<question>"`.
4. השתמש בתיעוד כמקור משלים; בדוק שהדוגמאות מתאימות לגרסה ולסביבה של הפרויקט.
5. ציין את הספרייה, המזהה/הגרסה וקישורי המקור שסופקו בפלט. אם לא נמצאו מסמכים מתאימים, אמור זאת במפורש ואל תמציא תשובה.
6. שמור על פרטיות: אל תכלול קוד פרטי, נתוני משתמש, סיסמאות או API keys בשאילתות.
7. אין להגדיר, להפעיל או להציע MCP במקומו של CLI. אין להציג OAuth או יצירת API key כתנאי לחיפוש אם פקודת CLI רגילה עובדת ללא התחברות.
8. אם נדרשת התחברות, הסבר את אפשרות החשבון החינמי ואת מגבלותיו; לעולם אל תבקש סיסמה או Token בצ'אט ואל תפעיל התחברות בשם המשתמשת.

## דוגמאות

```powershell
ctx7 search "Hono routing middleware for Node.js"
ctx7 library hono "serve a Hono application on Node.js"
ctx7 docs /llmstxt/hono_dev_llms_txt "route parameters and HTTP methods"
```
