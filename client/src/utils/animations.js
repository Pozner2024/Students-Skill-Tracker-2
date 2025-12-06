/**
 * Утилиты для анимаций и визуальных эффектов
 */

import confetti from "canvas-confetti";

/**
 * Эффект конфетти при успешном завершении теста
 * @param {number} score - Набранные баллы
 * @param {number} maxScore - Максимальные баллы
 */
export function celebrateScore(score, maxScore) {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) {
    // Взрыв конфетти для отличного результата (9-10)
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
    });

    // Дополнительный взрыв через 300мс
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFD700", "#FF6B6B", "#4ECDC4"],
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FFD700", "#FF6B6B", "#4ECDC4"],
      });
    }, 300);
  } else if (percentage >= 70) {
    // Умеренный конфетти для хорошего результата (7-8)
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#4ECDC4", "#45B7D1", "#96CEB4"],
    });
  } else if (percentage >= 50) {
    // Небольшой конфетти для удовлетворительного результата (5-6)
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
      colors: ["#96CEB4", "#FFEAA7"],
    });
  }
}

/**
 * Анимация появления элемента (fade in + slide up)
 * @param {HTMLElement} element - Элемент для анимации
 * @param {number} delay - Задержка в мс
 */
export function fadeInUp(element, delay = 0) {
  if (!element) return;

  setTimeout(() => {
    // Сбрасываем все предыдущие стили для единообразия
    element.style.opacity = "";
    element.style.transform = "";
    element.style.transition = "";

    // Принудительно применяем начальное состояние
    element.style.opacity = "0";
    element.style.transform = "translateY(120px)";
    element.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";

    // Запускаем анимацию в следующем кадре (двойной requestAnimationFrame для гарантии)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
      });
    });
  }, delay);
}

/**
 * Анимация появления карточек с задержкой (stagger)
 * @param {NodeList|Array} elements - Элементы для анимации
 * @param {number} staggerDelay - Задержка между элементами в мс
 */
export function staggerFadeIn(elements, staggerDelay = 100) {
  if (!elements || elements.length === 0) return;

  Array.from(elements).forEach((element, index) => {
    fadeInUp(element, index * staggerDelay);
  });
}

/**
 * Pulse эффект для элемента
 * @param {HTMLElement} element - Элемент
 * @param {number} duration - Длительность в мс
 */
export function pulse(element, duration = 1000) {
  if (!element) return;

  element.style.animation = `pulse ${duration}ms ease-in-out`;
  element.classList.add("pulse-animation");

  setTimeout(() => {
    element.style.animation = "";
    element.classList.remove("pulse-animation");
  }, duration);
}

/**
 * Shake эффект (тряска) для элемента
 * @param {HTMLElement} element - Элемент
 */
export function shake(element) {
  if (!element) return;

  element.classList.add("shake-animation");
  setTimeout(() => {
    element.classList.remove("shake-animation");
  }, 500);
}

/**
 * Success checkmark анимация
 * @param {HTMLElement} element - Элемент для анимации
 */
export function successCheckmark(element) {
  if (!element) return;

  element.classList.add("success-checkmark");
  setTimeout(() => {
    element.classList.remove("success-checkmark");
  }, 1000);
}

/**
 * Progress ring анимация
 * @param {HTMLElement} ring - Элемент кольца прогресса
 * @param {number} percentage - Процент заполнения (0-100)
 * @param {number} duration - Длительность анимации в мс
 */
export function animateProgressRing(ring, percentage, duration = 1000) {
  if (!ring) return;

  const circumference = 2 * Math.PI * 45; // радиус 45
  const offset = circumference - (percentage / 100) * circumference;

  ring.style.transition = `stroke-dashoffset ${duration}ms ease-in-out`;
  ring.style.strokeDashoffset = offset;
}

/**
 * Smooth scroll к элементу
 * @param {string|HTMLElement} target - Селектор или элемент
 * @param {object} options - Опции скролла
 */
export function smoothScrollTo(target, options = {}) {
  const element =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!element) return;

  const { behavior = "smooth", block = "start", inline = "nearest" } = options;

  element.scrollIntoView({
    behavior,
    block,
    inline,
  });
}

/**
 * Typing эффект (печать текста)
 * @param {HTMLElement} element - Элемент для текста
 * @param {string} text - Текст для печати
 * @param {number} speed - Скорость печати в мс
 */
export function typeText(element, text, speed = 50) {
  if (!element) return;

  element.textContent = "";
  let index = 0;

  const typeInterval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text[index];
      index++;
    } else {
      clearInterval(typeInterval);
    }
  }, speed);
}

/**
 * Counter анимация (счетчик от 0 до значения)
 * @param {HTMLElement} element - Элемент для отображения
 * @param {number} target - Целевое значение
 * @param {number} duration - Длительность в мс
 */
export function animateCounter(element, target, duration = 2000) {
  if (!element) return;

  const start = 0;
  const increment = target / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = Math.round(target);
      clearInterval(timer);
    } else {
      element.textContent = Math.round(current);
    }
  }, 16);
}

/**
 * Ripple эффект (волна при клике)
 * @param {Event} event - Событие клика
 * @param {string} color - Цвет волны
 */
export function createRipple(event, color = "rgba(255, 255, 255, 0.6)") {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
  circle.style.backgroundColor = color;
  circle.classList.add("ripple");

  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}

/**
 * Gradient анимация фона
 * @param {HTMLElement} element - Элемент для анимации
 * @param {Array} colors - Массив цветов для градиента
 * @param {number} duration - Длительность одного цикла в мс
 */
export function animateGradient(element, colors, duration = 5000) {
  if (!element) return;

  let currentIndex = 0;

  setInterval(() => {
    const nextIndex = (currentIndex + 1) % colors.length;
    element.style.background = `linear-gradient(135deg, ${colors[currentIndex]}, ${colors[nextIndex]})`;
    element.style.transition = `background ${duration}ms ease`;
    currentIndex = nextIndex;
  }, duration);
}
