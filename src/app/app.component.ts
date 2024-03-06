import { buffer, filter, interval, take, map, BehaviorSubject, Observable, Subject, takeUntil, takeWhile } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MessageService } from './services/message.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  public messages$ = new BehaviorSubject<string[]>([]);
  public latest10Messages$: Observable<string[]> = new Observable();

  private isBuffered = false;
  private isMainStreamPaused = false;
  private destroy$ = new Subject();

  constructor(public message: MessageService) {}

  ngOnInit(): void {
    this.message.messages$
      .pipe(
        buffer(
          this.message.messages$.pipe(filter(() => !this.isBuffered))
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((messages) => {
        if (messages.length > 1) {
          this.isMainStreamPaused = true;
          this.emitBufferedMessages(messages);
        } else {
          if (!this.isMainStreamPaused) {
            this.messages$.next([
              ...this.messages$.getValue(),
              messages.toString(),
            ]);
          }
        }
      });

      this.latest10Messages$ = this.messages$.pipe(
        map((msgs: string[]) => {
          if (msgs.length > 10) {
            return msgs.slice(msgs.length - 10, msgs.length)
          } else {
            return msgs;
          }
        }),
      )
  }

  private emitBufferedMessages(messages: string[]) {
    interval(100)
      .pipe(
        takeWhile(() => !this.isBuffered),
        take(messages.length),
        map((i) => messages[i]),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (msg) => {
          this.messages$.next([
            ...this.messages$.getValue(),
            msg,
          ]);
        },
        complete: () => { this.isMainStreamPaused = false; }
      });
  }

  public toggleBuffer() {
    this.isBuffered = !this.isBuffered;
  }

  public trackByFn(_: number, msg: string) {
    return msg;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
