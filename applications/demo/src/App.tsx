// import React from 'react';
import './App.css';
import { createRoot } from '@urrri/hi-mobx';
import { TodoList } from './views/TodoList';
import { TodoNew } from './views/TodoNew';
import { StoreProvider } from './stores/storeProvider';
import { RootStore } from './stores/rootStore';

const rootStore = createRoot({}, RootStore);
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
