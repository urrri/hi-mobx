import { createRoot } from '@urrri/hi-mobx';
import { TodoList } from './todoList';
// import { TodoNew } from '../stores/todoNew';

export const rootStore = createRoot({
  TodoList,
  // TodoNew,
});
export type RootStore = typeof rootStore;
