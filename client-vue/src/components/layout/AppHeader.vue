<script setup lang="ts">
import { RouterLink } from 'vue-router'
import logo from '@/assets/logo_vgik.png'
</script>

<template>
  <section id="header" class="header site-header">
    <div class="container-fluid">
      <div class="header-content d-flex align-items-center justify-content-between">
        <RouterLink
          to="/"
          class="logo-link text-decoration-none flex-shrink-0"
          aria-label="На главную"
        >
          <img :src="logo" alt="Логотип" class="logo img-fluid" id="logo" />
        </RouterLink>
        <h1 class="text-end flex-grow-1 ms-3">
          <span class="header-title-line header-title-main">Кондитер-Pro</span>
          <span class="header-title-line">Контроль и оценка компетенций обучающихся</span>
          <span class="header-title-line">по учебному предмету "Специальная технология"</span>
        </h1>
      </div>
    </div>
  </section>
</template>
