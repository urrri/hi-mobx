import { action, computed, observable } from 'mobx';
import { BaseStore } from '@urrri/hi-mobx';
import TodoItem from './todoItem';

const initialList = ['Should Starting Writing in React', 'Should Learn Hi-MobX', 'Should Watch Once Piece :)'];
export class TodoList extends BaseStore {
  @observable.shallow list: TodoItem[] = [];

  onStoreInit() {
    initialList.forEach((text) => this.addTodo(text));
  }

  @action
  addTodo = (text: string) => {
    this.list.push(this.$createStore(TodoItem, text));
  };

  @action
  removeTodo = (todo: TodoItem) => {
    this.list.splice(this.list.indexOf(todo), 1);
  };

  @computed
  get finishedTodos(): TodoItem[] {
    return this.list.filter((todo) => todo.isDone);
  }

  @computed
  get openTodos(): TodoItem[] {
    return this.list.filter((todo) => !todo.isDone);
  }
}
