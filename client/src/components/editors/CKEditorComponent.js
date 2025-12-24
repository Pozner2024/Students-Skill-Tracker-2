import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

/**
 * Компонент для работы с CKEditor
 * Инициализирует редактор на указанном элементе и предоставляет методы для работы с ним
 */
export class CKEditorComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.editor = null;
    this.options = {
      initialData: options.initialData || '',
      readOnly: options.readOnly || false,
      placeholder: options.placeholder || 'Введите текст...',
      ...options,
    };
  }

  /**
   * Инициализирует редактор
   */
  async init() {
    try {
      const container = document.getElementById(this.containerId);
      if (!container) {
        throw new Error(`Элемент с id "${this.containerId}" не найден`);
      }

      // Создаем textarea для редактора
      const textarea = document.createElement('textarea');
      textarea.id = `${this.containerId}-editor`;
      textarea.value = this.options.initialData;
      container.appendChild(textarea);

      // Инициализируем CKEditor
      this.editor = await ClassicEditor.create(textarea, {
        placeholder: this.options.placeholder,
        toolbar: [
          'heading',
          '|',
          'bold',
          'italic',
          'underline',
          '|',
          'bulletedList',
          'numberedList',
          '|',
          'blockQuote',
          'link',
          '|',
          'undo',
          'redo',
        ],
      });

      // Устанавливаем режим только для чтения, если нужно
      if (this.options.readOnly) {
        this.editor.enableReadOnlyMode('readonly-mode');
      }

      return this.editor;
    } catch (error) {
      console.error('[CKEditorComponent] Ошибка при инициализации редактора:', error);
      throw error;
    }
  }

  /**
   * Получает данные из редактора
   */
  getData() {
    if (!this.editor) {
      throw new Error('Редактор не инициализирован');
    }
    return this.editor.getData();
  }

  /**
   * Устанавливает данные в редактор
   */
  setData(data) {
    if (!this.editor) {
      throw new Error('Редактор не инициализирован');
    }
    return this.editor.setData(data);
  }

  /**
   * Уничтожает редактор
   */
  async destroy() {
    if (this.editor) {
      await this.editor.destroy();
      this.editor = null;
      
      // Удаляем textarea
      const textarea = document.getElementById(`${this.containerId}-editor`);
      if (textarea && textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
    }
  }

  /**
   * Включает/выключает режим только для чтения
   */
  setReadOnly(readOnly) {
    if (!this.editor) {
      throw new Error('Редактор не инициализирован');
    }
    if (readOnly) {
      this.editor.enableReadOnlyMode('readonly-mode');
    } else {
      this.editor.disableReadOnlyMode('readonly-mode');
    }
  }
}

export default CKEditorComponent;

