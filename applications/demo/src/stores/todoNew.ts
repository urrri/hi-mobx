import { action } from 'mobx';
import { BaseStore } from '@urrri/hi-mobx';
import type { RootStore } from './rootStore';

export class TodoNew extends BaseStore<RootStore> {
  @action
  addTodo = (text: string) => {
    this.$rootStore.todoList.addTodo(text);
  };
}
