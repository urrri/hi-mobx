import { action, observable } from 'mobx';
import { BaseStore, HStoreOptions } from '@urrri/hi-mobx';
import type { TodoList } from './todoList';

export default class TodoItem extends BaseStore<TodoList> {
  id = Date.now();

  @observable text: string = '';

  @observable isDone: boolean = false;

  constructor(options: HStoreOptions<TodoList>, text: string) {
    super(options);
    this.text = text;
  }

  @action
  toggleIsDone = () => {
    this.isDone = !this.isDone;
  };

  @action
  updateText = (text: string) => {
    this.text = text;
  };
}
