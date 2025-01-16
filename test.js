const TaskStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

class TaskManager {
  constructor(maxConcurrentTasks = 2) {
    this.tasks = {};
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.activeTasks = 0;
    this.taskQueue = [];
  }

  addTask(task, priority, dependencies = []) {
    const taskId = `task${Object.keys(this.tasks).length + 1}`;
    this.tasks[taskId] = {
      task,
      priority,
      dependencies,
      status: TaskStatus.PENDING,
    };
    this.taskQueue.push(taskId);
    return taskId;
  }

  async executeTasks() {
    const canExecuteTask = (taskId) => {
      return (
        this.tasks[taskId].status === TaskStatus.PENDING &&
        this.tasks[taskId].dependencies.every(
          (dep) => this.tasks[dep]?.status === TaskStatus.COMPLETED
        )
      );
    };

    while (this.taskQueue.length > 0 || this.activeTasks > 0) {
      this.taskQueue = this.taskQueue.filter(
        (taskId) => this.tasks[taskId]?.status === TaskStatus.PENDING
      );

      this.taskQueue.sort(
        (a, b) => this.tasks[a].priority - this.tasks[b].priority
      );

      const executableTasks = this.taskQueue.filter(canExecuteTask);
      const tasksToRun = executableTasks.slice(
        0,
        this.maxConcurrentTasks - this.activeTasks
      );

      if (tasksToRun.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      tasksToRun.forEach((taskId) => {
        this.activeTasks++;
        this.tasks[taskId].status = TaskStatus.IN_PROGRESS;
        this.taskQueue.splice(this.taskQueue.indexOf(taskId), 1);

        this.tasks[taskId]
          .task()
          .then(() => {
            this.tasks[taskId].status = TaskStatus.COMPLETED;
          })
          .catch((err) => {
            console.log(err);
            this.tasks[taskId].status = TaskStatus.FAILED;
            this.cancelDependentTasks(taskId);
          })
          .finally(() => {
            this.activeTasks--;
          });
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  getStatus() {
    return Object.fromEntries(
      Object.entries(this.tasks).map(([id, { status }]) => [id, status])
    );
  }

  cancelDependentTasks(taskId) {
    Object.entries(this.tasks).forEach(([id, task]) => {
      if (
        task.dependencies.includes(taskId) &&
        task.status === TaskStatus.PENDING
      ) {
        task.status = TaskStatus.CANCELLED;
        this.cancelDependentTasks(id);
        console.log(
          `Задача ${id} отменена из-за отмены задачи ${taskId}`.replace(
            /task/g,
            ""
          )
        );
      }
    });
  }

  cancelTask(taskId) {
    if (
      this.tasks[taskId] &&
      this.tasks[taskId].status === TaskStatus.PENDING
    ) {
      this.tasks[taskId].status = TaskStatus.CANCELLED;
      this.cancelDependentTasks(taskId);
      console.log(`Задача ${taskId} отменена`.replace("task", ""));
    }
  }
}

const taskManager = new TaskManager(3); // По дефолту лимит одновременных задач = 2

taskManager.addTask(
  async () => {
    console.log("Задача 1 началась");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Задача 1 завершена");
  },
  2,
  []
);

taskManager.addTask(
  async () => {
    console.log("Задача 2 началась");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Задача 2 завершена");
  },
  1,
  []
);

// Вызываем ошибку
taskManager.addTask(
  async () => {
    console.log("Задача 3 началась");
    await new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Ошибка в задаче 3")), 2500)
    );
  },
  3,
  ["task2"]
);

taskManager.addTask(
  async () => {
    console.log("Задача 4 началась");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Задача 4 завершена");
  },
  3,
  ["task1", "task2"]
);

taskManager.addTask(
  async () => {
    console.log("Задача 5 началась");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Задача 5 завершена");
  },
  2,
  ["task3"]
);

// Эту задачу отменяем
taskManager.addTask(
  async () => {
    console.log("Задача 6 началась");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Задача 6 завершена");
  },
  2,
  ["task4"]
);

taskManager.addTask(
  async () => {
    console.log("Задача 7 началась");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Задача 7 завершена");
  },
  3,
  ["task6"]
);

taskManager.addTask(
  async () => {
    console.log("Задача 8 началась");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Задача 8 завершена");
  },
  1,
  ["task1", "task2", "task4"]
);

// Выполнение задач
(async () => {
  // Отмена задачи 6
  setTimeout(() => {
    taskManager.cancelTask("task6");
  }, 1500);

  await taskManager.executeTasks();
  console.log("Выполнение завершено. Статус выполненных задач :");
  console.log(taskManager.getStatus());
})();
