import { BaseStore, finalizeAsRoot } from '@urrri/hi-mobx';
import { TodoList } from './todoList';
import { TodoNew } from './todoNew';

class Root extends BaseStore<undefined, Root> {
  todoList = this.$createStore(TodoList);

  todoNew = this.$createStore(TodoNew);
}

export const RootStore = finalizeAsRoot(Root);
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type RootStore = Root;
