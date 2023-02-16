import './App.css';
import { TodoList } from './views/TodoList';
import { TodoNew } from './views/TodoNew';
import { StoreProvider } from './stores/storeProvider';
import { RootStore } from './stores/rootStore';

const rootStore = new RootStore();
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
