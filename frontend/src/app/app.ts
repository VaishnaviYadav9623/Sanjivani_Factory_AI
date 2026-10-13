
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  pageTitle = 'AI Farmer Assistant';
  question = '';
  loading = false;
  messages: ChatMessage[] = [];

  constructor(private http: HttpClient) {}

  askQuestion(value: string): void {
    this.question = value;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.question.trim();

    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    this.question = '';
    this.loading = true;

    this.http.post<{ answer: string }>(
      'http://localhost:3000/api/chat',
      { question: text }
    ).subscribe({
      next: (result) => {
        this.messages.push({
          role: 'assistant',
          text: result.answer || 'No answer was returned.'
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Chat request failed:', error);
        this.messages.push({
          role: 'assistant',
          text: error.error?.error ||
            'Unable to connect to the server. Make sure api.ts is running.'
        });
        this.loading = false;
      }
    });
  }

  showFarmers(): void {
    this.pageTitle = 'Farmer Records';
  }

  showAnalytics(): void {
    this.pageTitle = 'Agricultural Analytics';
  }
}
