// import React from 'react';
import './App.css';
import { TodoList } from './features/TodoList';
import { TodoNew } from './features/TodoNew';
import { StoreProvider } from './stores/storeProvider';
import { rootStore } from './stores/rootStore';

function App() {
  return (
    <StoreProvider value={rootStore}>
      <div className="App">
        <TodoNew />
        <TodoList />
      </div>
    </StoreProvider>
  );
}

export default App;
