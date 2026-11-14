export interface CourseStageProgress {
  number: number;
  title: string;
  completedTasks: number;
  totalTasks: number;
  blockedTasks: number;
  approvalTasks: number;
}

export interface CourseProgress {
  completedTasks: number;
  totalTasks: number;
  blockedTasks: number;
  approvalTasks: number;
  stages: CourseStageProgress[];
}

const lastRequiredCourseStage = 8;

export function parseCourseProgress(markdown: string): CourseProgress {
  const stages: CourseStageProgress[] = [];
  let currentStage: CourseStageProgress | undefined;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^## שלב (\d+) — (.+)$/.exec(line);
    if (heading) {
      const stageNumber = Number(heading[1]);
      if (stageNumber > lastRequiredCourseStage) {
        currentStage = undefined;
        continue;
      }
      currentStage = {
        number: stageNumber,
        title: heading[2],
        completedTasks: 0,
        totalTasks: 0,
        blockedTasks: 0,
        approvalTasks: 0,
      };
      stages.push(currentStage);
      continue;
    }

    if (line.startsWith("## ")) {
      currentStage = undefined;
      continue;
    }

    const task = /^- \[([ x])\] (.+)$/i.exec(line);
    if (!currentStage || !task) {
      continue;
    }

    currentStage.totalTasks += 1;
    if (task[1].toLowerCase() === "x") {
      currentStage.completedTasks += 1;
      continue;
    }

    if (/סטטוס:\s*חסומה/.test(task[2])) {
      currentStage.blockedTasks += 1;
    }
    if (/ממתינה לאישור|ממתין לאישור/.test(task[2])) {
      currentStage.approvalTasks += 1;
    }
  }

  return {
    completedTasks: stages.reduce((total, stage) => total + stage.completedTasks, 0),
    totalTasks: stages.reduce((total, stage) => total + stage.totalTasks, 0),
    blockedTasks: stages.reduce((total, stage) => total + stage.blockedTasks, 0),
    approvalTasks: stages.reduce((total, stage) => total + stage.approvalTasks, 0),
    stages,
  };
}
