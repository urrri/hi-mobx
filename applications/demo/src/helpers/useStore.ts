import { useContext } from 'react';
import { StoreContext } from './storeProvider';
import { TodoList } from '../stores/todoList';

export const useStore = (): TodoList => useContext(StoreContext);
