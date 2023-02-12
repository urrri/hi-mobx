import { useState } from 'react';
import TodoItemClass from '../stores/todoItem';
import { useStore } from '../helpers/useStore';
import { onEnterPress } from '../helpers/useEnter';

interface Props {
  todo: TodoItemClass;
}

export function TodoItem({ todo }: Props) {
  const todoList = useStore();
  const [newText, setText] = useState('');
  const [isEditing, setEdit] = useState(false);

  const saveText = () => {
    todo.updateText(newText);
    setEdit(false);
    setText('');
  };

  return (
    <div className="todo-item">
      {isEditing ? (
        <div>
          <input type="text" onKeyDown={onEnterPress(saveText)} onChange={(e) => setText(e.target.value)} />
          <button type="button" onClick={saveText}>
            save
          </button>
        </div>
      ) : (
        <div>
          <span>{todo.text}</span>
          <input type="checkbox" onChange={todo.toggleIsDone} defaultChecked={todo.isDone} />
          <button type="button" onClick={() => setEdit(true)}>
            edit
          </button>
          <button type="button" onClick={() => todoList.removeTodo(todo)}>
            X
          </button>
        </div>
      )}
    </div>
  );
}
