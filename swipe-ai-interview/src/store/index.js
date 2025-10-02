import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import candidates from './candidatesSlice';
import interview from './interviewSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

function createNoopStorage() {
  return {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
}

const storage =
  typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();

const rootReducer = combineReducers({
  candidates,
  interview,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['candidates'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export const useAppDispatch = () => useDispatch();


