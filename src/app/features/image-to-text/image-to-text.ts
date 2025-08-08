import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_KEY } from './api-key';

@Component({
  selector: 'app-image-to-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-to-text.html',
  styleUrl: './image-to-text.scss'
})
export class ImageToText {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  extractedText: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient) { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    this.error = '';
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result as string;
    reader.readAsDataURL(file);
  }

  extractText(): void {
    if (!this.selectedFile) return;

    this.loading = true;
    this.extractedText = '';
    this.error = '';

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    this.http.post<{ text: string }>(
      'https://api.api-ninjas.com/v1/imagetotext',
      formData,
      {
        headers: new HttpHeaders({
          'X-Api-Key': API_KEY
        })
      }
    ).subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.extractedText = response.map(item => item.text).join('\n');
        } else {
          this.error = 'Error extracting text.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error extracting text.';
        this.loading = false;
      }
    });
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.extractedText);
  }
}
