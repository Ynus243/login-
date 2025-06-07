<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";
const store = useAccountStore();
const { accounts } = storeToRefs(store);

const rawLabels = ref<string[]>([]);
const validity = ref<{ labels: boolean; login: boolean; password: boolean }[]>(
  []
);

function initializeValidity() {
  validity.value = accounts.value.map(() => ({
    labels: true,
    login: true,
    password: true,
  }));
}

function updateRawLabels() {
  rawLabels.value = accounts.value.map((a) =>
    (a?.labels ?? []).map((l) => l.text).join("; ")
  );
}

async function loadData() {
  await store.loadFromStorage();
  initializeValidity();
  updateRawLabels();
}

onMounted(() => {
  loadData();
});

watch(accounts, () => {
  initializeValidity();
  updateRawLabels();
});

function onLabelsBlur(index: number) {
  const raw = rawLabels.value[index] ?? "";
  if (raw.length > 50) {
    validity.value[index].labels = false;
    return;
  }
  const parsed = raw
    .split(";")
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
  accounts.value[index].labels = parsed;
  validity.value[index].labels = true;
}

function onTypeChange(index: number) {
  if (accounts.value[index].type === "LDAP") {
    accounts.value[index].password = null;
  }
}

function validate(index: number) {
  const acc = accounts.value[index];
  validity.value[index].login =
    acc.login?.length > 0 && acc.login.length <= 100;
  validity.value[index].password =
    acc.type === "Локальная"
      ? !!acc.password && acc.password.length > 0 && acc.password.length <= 100
      : true;
}

function addAccount() {
  store.addAccount();
  rawLabels.value.push("");
  validity.value.push({ labels: true, login: true, password: true });
}

function removeAccount(id: string) {
  const idx = accounts.value.findIndex((a) => a.id === id);
  if (idx !== -1) {
    rawLabels.value.splice(idx, 1);
    validity.value.splice(idx, 1);
    store.deleteAccount(id);
  }
}
</script>
<template>
  <div class="p-4">
    <div class="flex items-center gap-2 mb-2">
      <h2>Учетные записи</h2>
      <div class="p-4 border border-gray-200 rounded-xl" @click="addAccount()">
        <img src="/assets/img/plus.png" class="w-4 h-4" alt="" />
      </div>
    </div>
   <el-alert
      title="Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;"
      type="info"
      show-icon
      class="mb-4"
    />
    <el-table v-if="accounts.length > 0" :data="accounts" style="width: 100%">
      <el-table-column label="Метки">
        <template #default="{ row, $index }">
          <el-input v-model="rawLabels[$index]" @blur="onLabelsBlur($index)" placeholder="Метки"
            :class="{ 'is-invalid': !validity[$index].labels }" />
        </template>
      </el-table-column>

      <el-table-column label="Тип записи" width="140">
        <template #default="{ row, $index }">
          <el-select v-model="row.type" placeholder="Тип" @change="onTypeChange($index)">
            <el-option label="LDAP" value="LDAP" />
            <el-option label="Локальная" value="Локальная" />
          </el-select>
        </template>
      </el-table-column>

      <el-table-column label="Логин">
        <template #default="{ row, $index }">
          <el-input v-model="row.login" @blur="validate($index)" placeholder="Логин"
            :class="{ 'is-invalid': !validity[$index].login }" />
        </template>
      </el-table-column>

      <el-table-column label="Пароль" v-if="accounts.some((a) => a.type === 'Локальная')">
        <template #default="{ row, $index }">
          <el-input v-if="row.type === 'Локальная'" v-model="row.password" show-password placeholder="Пароль"
            @blur="validate($index)" :class="{ 'is-invalid': !validity[$index].password }" />
        </template>
      </el-table-column>

      <el-table-column label=" " width="60">
        <template #default="{ row }">
          <img src="/assets/img/trash.png" alt="" @click="removeAccount(row.id)" />
        </template>
      </el-table-column>
    </el-table>
  </div>
  <modal ref="_modalRef" />
</template>

<style scoped>
.is-invalid input {
  border-color: red;
}
</style>
