import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Account } from '@/types/Account';

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([]);

  // LocalStorage persist
  watch(accounts, () => {
    localStorage.setItem('accounts', JSON.stringify(accounts.value));
  }, { deep: true });

  const loadFromStorage = () => {
    const raw = localStorage.getItem('accounts');
    if (raw) accounts.value = JSON.parse(raw);
  };

  const addAccount = () => {
    accounts.value.push({
      id: crypto.randomUUID(),
      labels: [],
      type: 'LDAP',
      login: '',
      password: null,
      isValid: false
    });
  };

  const deleteAccount = (id: string) => {
    accounts.value = accounts.value.filter(a => a.id !== id);
  };

  return { accounts, addAccount, deleteAccount, loadFromStorage };
});
