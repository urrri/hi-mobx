import { observer } from 'mobx-react-lite';
import { useStore } from '../helpers/useStore';
import { TodoItem } from './TodoItem';

export const TodoList = observer(() => {
  const todoList = useStore();

  return (
    <div className="todo-list">
      <div className="open-todos">
        <span>Open Todos</span>
        {todoList.openTodos.map((todo) => (
          <TodoItem key={`${todo.id}-${todo.text}`} todo={todo} />
        ))}
      </div>
      <div className="finished-todos">
        <span>Finished Todos</span>
        {todoList.finishedTodos.map((todo) => (
          <TodoItem key={`${todo.id}-${todo.text}`} todo={todo} />
        ))}
      </div>
    </div>
  );
});
