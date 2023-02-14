import { action, observable } from 'mobx';
import { BaseStore } from '@urrri/hi-mobx';
import type { TodoList } from './todoList';

export default class TodoItem extends BaseStore<TodoList> {
  id = Date.now();

  @observable text: string = '';

  @observable isDone: boolean = false;

  constructor(parent: TodoList, text: string) {
    super(parent);
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
