<script setup lang="ts">
// Use Volt wrapper components (wrappers around the underlying UI primitives)
import Button from '@/volt/Button.vue';
import Card from '@/volt/Card.vue';
import Avatar from '@/volt/Avatar.vue';
import Badge from '@/volt/Badge.vue';
import Dialog from '@/volt/Dialog.vue';

import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue';

const showModal = ref(false);
</script>

<template>
  <div class="bg-surface-900 text-surface-0 min-h-screen p-8">
    <Sidebar />
    <header class="mb-12">
      <h1 class="text-4xl font-bold text-primary-400 mb-1">Volt UI Design System</h1>
      <p class="m-0 text-surface-400">A showcase of components for the MMOLIKE-RPG.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <section class="bg-surface-800 p-5 rounded-lg shadow-xl">
        <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Buttons</h2>
        <div class="flex flex-wrap gap-2">
          <Button label="Primary Action" />
          <Button label="Secondary" severity="secondary" />
          <Button label="Danger" severity="danger" />
          <Button icon="pi pi-check" aria-label="Submit" />
        </div>
      </section>

      <section class="bg-surface-800 p-5 rounded-lg shadow-xl">
        <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Cards (Inventory Item)</h2>
        <Card class="max-w-md bg-surface-800">
          <template #header>
            <img alt="item" src="https://placehold.co/400x200/27272a/eab308?text=Longsword" class="w-full block rounded-t-md" />
          </template>
          <template #title><span class="text-primary-400">Sturdy Longsword of the Ancients</span></template>
          <template #subtitle><span class="text-surface-400">Unique Main Hand</span></template>
          <template #content>
            <p class="text-surface-0">
              A well-balanced longsword, humming with a faint, ancient power.
            </p>
          </template>
          <template #footer>
            <div class="flex gap-2">
              <Button label="Equip" icon="pi pi-check" />
              <Button label="Drop" icon="pi pi-times" severity="secondary" class="ml-2" />
            </div>
          </template>
        </Card>
      </section>
      
      <section class="bg-surface-800 p-5 rounded-lg shadow-xl">
        <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Progress Bars</h2>
        <div class="mb-3">
          <label class="block font-semibold mb-1">Health (75%)</label>
          <div class="bg-black/15 rounded-full h-3 overflow-hidden">
            <div class="h-full bg-green-500 transition-width duration-300 ease-in-out" style="width:75%"></div>
          </div>
        </div>
        <div class="mb-3">
          <label class="block font-semibold mb-1">Mana (40%)</label>
          <div class="bg-black/15 rounded-full h-3 overflow-hidden">
            <div class="h-full bg-sky-400 transition-width duration-300 ease-in-out" style="width:40%"></div>
          </div>
        </div>
        <div class="mb-3">
          <label class="block font-semibold mb-1">Experience (Loading)</label>
          <div class="bg-black/15 rounded-full h-3 overflow-hidden">
            <div class="h-full bg-primary-400 animate-ds-progress-indeterminate"></div>
          </div>
        </div>
      </section>

      <section class="bg-surface-800 p-5 rounded-lg shadow-xl flex flex-col items-center">
        <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2 w-full">Avatar & Badge</h2>
        <div class="relative mt-4">
           <Avatar image="https://placehold.co/150x150/27272a/eab308?text=BR" size="xlarge" shape="circle" />
           <Badge value="12" severity="danger" class="absolute -right-2 -bottom-2"></Badge>
        </div>
        <p class="mt-4 font-bold">BrickM</p>
        <p class="text-surface-400">Level 12 Knight</p>
      </section>

      <section class="bg-surface-800 p-5 rounded-lg shadow-xl md:col-span-2">
        <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Accordion (Quest Log)</h2>
        <div>
          <details class="bg-transparent border-b border-surface-700 py-2" open>
            <summary class="cursor-pointer flex items-center gap-2 font-semibold">
              <CheckCircleIcon class="w-5 h-5 text-green-400"/>
              <span>A Goblin Menace (Completed)</span>
            </summary>
            <div class="pt-2 pl-7 text-surface-0">Goblins are harassing travelers on the road. You have thinned their numbers.</div>
          </details>
          <details class="bg-transparent border-b border-surface-700 py-2">
            <summary class="cursor-pointer flex items-center gap-2 font-semibold">
              <ArrowPathIcon class="w-5 h-5 text-amber-400"/>
              <span>The Lost Artifact (In Progress)</span>
            </summary>
            <div class="pt-2 pl-7 text-surface-0">Find the ancient scroll that was lost in the Whispering Caves.</div>
          </details>
          <details class="bg-transparent border-b border-surface-700 py-2">
            <summary class="cursor-pointer flex items-center gap-2 font-semibold">
              <XCircleIcon class="w-5 h-5 text-gray-400"/>
              <span>Herbs for the Healer (Failed)</span>
            </summary>
            <div class="pt-2 pl-7 text-surface-0">The healer's patient succumbed before you could return with the Sunpetal.</div>
          </details>
        </div>
      </section>

      <section class="bg-surface-800 p-5 rounded-lg shadow-xl">
        <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Modal / Dialog</h2>
        <div class="flex flex-wrap gap-2">
          <Button label="Open Modal" @click="showModal = true" />
        </div>
        <Dialog v-model:visible="showModal" header="Example Modal" :modal="true" :closable="true">
          <p>This is a simple modal dialog using PrimeVue's Dialog component.</p>
          <div class="flex justify-end gap-2 mt-4">
            <Button label="Close" @click="showModal = false" />
          </div>
        </Dialog>
      </section>

    </div>
  </div>
</template>