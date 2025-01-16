# Реализация системы управления асинхронными задачами с приоритетами и зависимостями.
## Экземпляр класса TaskManager
### Возможные состояния (статус) задачи:
pending, 
in_progress, 
completed, 
failed, 
cancelled
### Основные методы:
addTask(task, priority, dependencies = []) - Добавляет задачу в очередь
executeTasks() - Запускает выполнение задач по приоритету и зависимостям
getStatus() - Возвращает объект, где ключ — ID задачи, значение — статус
cancelTask(taskId) - Отменяет задачу taskId
cancelDependentTasks(taskId) - Отменяет все задачи, зависящие от указанной taskId задачи.

