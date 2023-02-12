// import React from 'react';
import './App.css';
import { TodoList } from './features/TodoList';
import { TodoNew } from './features/TodoNew';
import { StoreProvider } from './helpers/storeProvider';
import { TodoList as TodoListStore } from './stores/todoList';

const todoList = new TodoListStore([
  'Should Starting Writing in React',
  'Should Learn MobX',
  'Should Watch Once Piece :)',
]);

function App() {
  return (
    <StoreProvider value={todoList}>
      <div className="App">
        <TodoNew />
        <TodoList />
      </div>
    </StoreProvider>
  );
}

export default App;
