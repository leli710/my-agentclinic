import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { parseCourseProgress } from "../course-progress.js";

describe("course progress parser", () => {
  it("counts completed, blocked, and approval tasks within stages only", () => {
    const progress = parseCourseProgress(`# Board

## שלב 1 — Setup
- [x] Create project. **Status: done.**
- [ ] Review spec. **סטטוס: ממתינה לאישור.**
- [ ] Find source project. **סטטוס: חסומה.**

## רישום בדיקות ותוצאות
- [x] Test run.
`);

    assert.deepEqual(progress, {
      completedTasks: 1,
      totalTasks: 3,
      blockedTasks: 1,
      approvalTasks: 1,
      stages: [
        {
          number: 1,
          title: "Setup",
          completedTasks: 1,
          totalTasks: 3,
          blockedTasks: 1,
          approvalTasks: 1,
        },
      ],
    });
  });

  it("excludes lessons after the MVP from required course progress", () => {
    const progress = parseCourseProgress(`# Board

## שלב 8 — השלמת MVP
- [x] Complete MVP.

## שלב 9 — Optional extension
- [ ] Add a post-MVP skill.

## החלטות
- [x] This checkbox is not a stage task.
`);

    assert.equal(progress.completedTasks, 1);
    assert.equal(progress.totalTasks, 1);
    assert.deepEqual(progress.stages.map(({ number }) => number), [8]);
  });
});
