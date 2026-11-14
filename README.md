<div dir="rtl">

# Agent Clinic — מרפאת תחזוקה לסוכני תוכנה

Agent Clinic היא אפליקציה מקומית לניהול סוכני תוכנה ולתיעוד תקלות, חומרתן והטיפולים שבוצעו. “מרפאה” ו“מחלות” הן מטאפורה לתחזוקת תוכנה בלבד — המערכת אינה מיועדת לאנשים ואינה נותנת ייעוץ רפואי.

## מה אפשר לעשות?

- לראות Dashboard בעברית עם ספירות סוכנים, תקלות פתוחות וחומרה.
- לעקוב אחרי התקדמות משימות הקורס בעמוד `/course`, המחושב ישירות מ־`TASKS.md`.
- להוסיף סוכני תוכנה, לעדכן את פרטיהם ולהשבית/להפעיל אותם.
- לתעד תקלה, לשייך אותה לסוכן, ולסווג חומרה ומצב.
- לתעד טיפול ותוצאה ולעקוב אחרי תקלות פתוחות, בטיפול ונפתרות.
- לעבוד עם מסד SQLite מקומי ונתוני דוגמה פיקטיביים.

הממשק בנוי בעברית וב־RTL ומותאם למסכים צרים. Pico CSS והעיצוב הנוסף מוגשים מקובצי הפרויקט המקומיים; אין שימוש ב־CDN או בשירות ענן בזמן ריצה.

## דרישות

- Node.js ‏22.12 ומעלה (נדרש עבור Vitest 4.1.2; הפרויקט נבדק עם Node.js ‏25.2.1).
- npm.

## התקנה, בדיקה והרצה

מתיקיית הפרויקט, ב־PowerShell:

```powershell
npm ci
npm test
npm start
```

פתחי בדפדפן את [http://127.0.0.1:3000](http://127.0.0.1:3000). השרת מאזין ל־loopback בלבד, כך שאינו פתוח למכשירים אחרים ברשת. לעצירתו לחצי `Ctrl+C` בחלון שבו הוא פועל.

`npm test` מריץ תחילה TypeScript Strict Build ואחר כך את בדיקות Vitest שב־`src/test/`. סביבת הבדיקות משתמשת ב־SQLite בזיכרון, כך שהבדיקות אינן משנות את מסד הנתונים המקומי.

## נתונים מקומיים

בפתיחה הראשונה נוצר `data/agent-clinic.sqlite`, מוחלות עליו מיגרציות SQL ונוספים נתוני דוגמה פיקטיביים. נתוני הדוגמה מתווספים רק כאשר מסד הנתונים ריק. קובצי SQLite מוחרגים מ־Git.

אפשר לבחור קובץ אחר באמצעות משתנה הסביבה `AGENT_CLINIC_DB`, למשל:

```powershell
$env:AGENT_CLINIC_DB = "data/clinic-test.sqlite"
npm start
```

## מבנה הפרויקט

- `src/domain.ts` — טיפוסי סוכנים, תקלות ומצבים.
- `src/db.ts` — SQLite, מיגרציות, נתוני דוגמה ושאילתות.
- `src/app.ts` — נתיבי Hono, טפסים וולידציה.
- `src/views.ts` — תצוגות המסכים.
- `src/views/header.ts`,‏ `src/views/main.ts`,‏ `src/views/footer.ts` ו־`src/views/layout.ts` — רכיבי Layout משותפים.
- `src/views/props.ts` — טיפוסי Props עצמאיים לתצוגות.
- `src/test/` — בדיקות אוטומטיות.
- `migrations/` — קובצי SQL ממוספרים.
- `public/styles.css` — עיצוב מקומי ותמיכה רספונסיבית.
- `specs/` — מסמכי Constitution ומפרטי Features.
- `TASKS.md` — לוח התקדמות קורס Spec-Driven Development.
- `CHANGELOG.md` — שינויים מאומתים שטרם שוחררו.

אפשר לפתוח את [לוח מצב המרפאה](http://127.0.0.1:3000/) או את [לוח התקדמות הקורס](http://127.0.0.1:3000/course) לאחר הפעלת השרת.

## מסמכי התכנון

- `specs/mission.md` — מטרת המוצר והיקפו.
- `specs/techstack.md` — טכנולוגיות וכללי פיתוח ובדיקה.
- `specs/roadmap.md` — סדרי העדיפויות ל־MVP.
- `specs/features/hello-hono.md` — שרת Hono ונתיב הדוגמה `GET /api/hello`.
- `specs/features/agents-and-ailments.md` — ניהול סוכנים, תקלות וטיפולים.
- `specs/features/course-progress-dashboard.md` — לוח ההתקדמות המקומי של מטלות הקורס.
- `specs/2026-11-14-hello-hono/`,‏ `specs/2026-11-14-agents-and-ailments/` ו־`specs/2026-11-14-mvp/` — דרישות, תוכניות ואימותים מובנים.
- `.github/skills/feature-spec/SKILL.md` — ראיון דרישות ויצירת Feature Spec.
- `.github/skills/context7-docs/SKILL.md` — חיפוש תיעוד עדכני באמצעות Context7 CLI ללא MCP.
- `.github/skills/changelog/SKILL.md` — כתיבת CHANGELOG על בסיס שינויים מאומתים.

## הערת תהליך

הקורס המקורי מציע שימוש ב־Claude Code, אך אפשר לפתח ולבדוק את הפרויקט בכלים המקומיים הזמינים. בפרויקט הזה לא נעשה שימוש ב־Claude Code, ולא נדרשת רכישה או התחברות לשירות בתשלום.

</div>
