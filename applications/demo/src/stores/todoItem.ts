import { action, observable } from 'mobx';
import { BaseStore, HParentStore } from '@urrri/hi-mobx';

export default class TodoItem extends BaseStore {
  id = Date.now();

  @observable text: string = '';

  @observable isDone: boolean = false;

  constructor(parent: HParentStore, text: string) {
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
