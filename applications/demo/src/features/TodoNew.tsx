import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../helpers/useStore';
import { onEnterPress } from '../helpers/useEnter';

export const TodoNew = observer(() => {
  const [newTodo, setTodo] = useState('');
  const todoList = useStore();

  const addTodo = () => {
    todoList.addTodo(newTodo);
    setTodo('');
  };

  return (
    <div className="todo-new">
      <input type="text" value={newTodo} onKeyDown={onEnterPress(addTodo)} onChange={(e) => setTodo(e.target.value)} />
      <button type="button" onClick={addTodo}>
        Add Todo
      </button>
    </div>
  );
});
