import { BaseStore } from '@urrri/hi-mobx';
import { TodoList } from './todoList';
import { TodoNew } from './todoNew';

// export const rootStore = createRoot({
//   TodoList,
//   // TodoNew,
// });
// export type RootStore = typeof rootStore;

// class R extends BaseStore<never, R> {
//   x = this.$createStore(X);
// }

export class RootStore extends BaseStore<never, RootStore> {
  todoList = this.$createStore(TodoList);

  todoNew = this.$createStore(TodoNew);
}

// export const rootStore: RootStore = createRoot({}, RootStore);
