import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_KEY } from './api-key';

interface ImageToTextResponse {
  text: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-image-to-text',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-to-text.html',
  styleUrls: ['./image-to-text.scss']
})
export class ImageToText {
  private static readonly VALID_TYPES = ['image/jpeg', 'image/png'];
  private static readonly MAX_SIZE = 2 * 1024 * 1024;
  private static readonly API_URL = 'https://api.api-ninjas.com/v1/imagetotext';

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  extractedText = '';
  loading = false;
  isDragOver = false;

  toasts: ToastMessage[] = [];
  private toastId = 0;
  toastType: 'success' | 'error' = 'success';
  showToastFlag: boolean = false;

  constructor(private http: HttpClient) { }

  private showToast(message: string, type: 'success' | 'error' = 'success', duration = 3000): void {
    const id = this.toastId++;
    this.toasts.push({ id, message, type });

    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, duration);
  }

  get canExtract(): boolean {
    return !!this.selectedFile && !this.loading;
  }

  private isValidFile(file: File): boolean {
    if (file.size > ImageToText.MAX_SIZE) {
      this.showToast('Максимальний розмір файлу — 2MB.', 'error');
      return false;
    }
    if (!ImageToText.VALID_TYPES.includes(file.type)) {
      this.showToast('Дозволені лише JPEG або PNG.', 'error');
      return false;
    }
    return true;
  }

  private processFile(file: File): void {
    if (!this.isValidFile(file)) return;

    this.selectedFile = file;
    this.extractedText = '';

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);

    this.showToast('Файл успішно завантажено!', 'success');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.processFile(input.files[0]);
    }
  }

  async extractText(): Promise<void> {
    if (!this.selectedFile) return;

    this.loading = true;
    this.extractedText = '';

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    try {
      const response = await firstValueFrom(
        this.http.post<ImageToTextResponse[]>(ImageToText.API_URL, formData, {
          headers: new HttpHeaders({ 'X-Api-Key': API_KEY })
        })
      );

      if (Array.isArray(response)) {
        this.extractedText = response.map(item => item.text).join('\n');
        this.showToast('Текст успішно розпізнано!', 'success');
      } else {
        this.showToast('Невірний формат відповіді.', 'error');
      }
    } catch {
      this.showToast('Помилка при вилученні тексту.', 'error');
    } finally {
      this.loading = false;
    }
  }

  copyToClipboard(): void {
    if (!this.extractedText) return;
    navigator.clipboard
      .writeText(this.extractedText)
      .then(() => this.showToast('Текст скопійовано в буфер!', 'success'))
      .catch(() => this.showToast('Не вдалося скопіювати текст.', 'error'));
  }

  removeFile(fileInput?: HTMLInputElement): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.extractedText = '';
    if (fileInput) fileInput.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileExtension(file: File): string {
    return file.type ? file.type.split('/')[1].toUpperCase() : file.name.split('.').pop()?.toUpperCase() || '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.processFile(files[0]);
    }
  }
}
