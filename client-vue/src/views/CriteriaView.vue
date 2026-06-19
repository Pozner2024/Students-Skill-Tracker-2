<script setup lang="ts">
const scores10 = [8, 8, 8, 10, 10, 10, 10, 10, 10, 16]
const scores15 = [4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 10, 12, 12]
const grades10 = [
  ['1-8', 1],
  ['9-16', 2],
  ['17-27', 3],
  ['28-38', 4],
  ['39-49', 5],
  ['50-65', 6],
  ['66-76', 7],
  ['86-90', 8],
  ['91-95', 9],
  ['96-100', 10],
] as const
const grades15 = [
  ['1-8', 1],
  ['9-16', 2],
  ['17-26', 3],
  ['27-36', 4],
  ['37-48', 5],
  ['49-59', 6],
  ['60-70', 7],
  ['71-80', 8],
  ['81-91', 9],
  ['92-100', 10],
] as const
</script>

<template>
  <main id="criteria" class="container my-4">
    <h1>Оценочные критерии тестов</h1>
    <section>
      <div class="criteria-container">
        <div class="alert alert-info mb-4" role="alert">
          <div class="criteria-explanation">
            <p class="mb-2">
              Данные таблицы описывают систему оценивания тестов по количеству набранных баллов. В
              зависимости от числа вопросов в тесте (10 или 15), каждая таблица отображает
              максимальные баллы, которые можно получить за каждый вопрос, а также шкалу перевода
              общего числа баллов в итоговую оценку.
            </p>
            <p class="mb-2">
              - Первая таблица показывает распределение баллов для теста с 10 вопросами: каждому
              вопросу присвоен вес в баллах, который влияет на итоговую оценку.
            </p>
            <p class="mb-2">
              - Вторая таблица иллюстрирует, как сумма набранных баллов по тесту с 10 вопросами
              переводится в оценку по десятибалльной шкале.
            </p>
            <p class="mb-2">
              - Третья таблица описывает распределение баллов для теста с 15 вопросами, аналогично
              первой таблице, где каждый вопрос имеет свой вес.
            </p>
            <p class="mb-2">
              - Четвертая таблица аналогично второй показывает перевод суммы баллов теста с 15
              вопросами в итоговую оценку.
            </p>
            <p class="mb-2">
              Это позволяет наглядно увидеть, сколько баллов можно получить за каждый вопрос и как это
              влияет на итоговый результат тестирования.
            </p>
          </div>
        </div>

        <h2 class="mb-3">
          Шкала определяющая максимальное количество баллов за каждое задание для теста с 10 вопросами
        </h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table">
            <thead class="table-dark">
              <tr>
                <th>№ вопроса</th>
                <th v-for="n in scores10.length" :key="n">{{ n }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Количество баллов</strong></td>
                <td v-for="(s, i) in scores10" :key="i">{{ s }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mb-3 mt-4">Шкала перевода суммарного количества баллов для теста с 10 вопросами</h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table small-table">
            <thead class="table-dark">
              <tr>
                <th>Количество баллов</th>
                <th class="grade-column">Оценка</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in grades10" :key="row[0]">
                <td>{{ row[0] }}</td>
                <td class="grade-column">
                  <strong>{{ row[1] }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mb-3 mt-4">
          Шкала определяющая максимальное количество баллов за каждое задание для теста с 15 вопросами
        </h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table">
            <thead class="table-dark">
              <tr>
                <th>№ вопроса</th>
                <th v-for="n in scores15.length" :key="n">{{ n }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Количество баллов</strong></td>
                <td v-for="(s, i) in scores15" :key="i">{{ s }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mb-3 mt-4">Шкала перевода суммарного количества баллов для теста с 15 вопросами</h2>
        <div class="table-responsive">
          <table class="table table-bordered table-striped table-hover criteria-table small-table">
            <thead class="table-dark">
              <tr>
                <th>Количество баллов</th>
                <th class="grade-column">Оценка</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in grades15" :key="row[0]">
                <td>{{ row[0] }}</td>
                <td class="grade-column">
                  <strong>{{ row[1] }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </main>
</template>
