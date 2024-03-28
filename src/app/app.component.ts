import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from './services/message.service';
import { delay, filter, merge, Observable, scan, shareReplay, Subject, tap } from "rxjs";

const MISSED_TIMEOUT = 100;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent{
  constructor(
    public message: MessageService,
  ) {
  }

  title = 'LC2';

  private missedmessagesArr: string[] = [];
  private missedMessagesSubject: Subject<string> = new Subject<string>();
  private missedMessages$: Observable<string> =
    this.missedMessagesSubject.asObservable();
  private newMessages$: Observable<string> = this.message.messages$.pipe(
    tap((res) => {
      if (this.freezed()) {
        this.missedmessagesArr.push(res.toString());
      }
    }),
    filter((res) => !this.freezed()),
    shareReplay(1)
  );

  public messages$: Observable<string[]> = merge(
    this.missedMessages$,
    this.newMessages$
  ).pipe(
    delay(MISSED_TIMEOUT),
    tap((res) => this.lastMessage.set(res)),
    scan((acc: string[], val: string) => {
      acc.push(val);
      return acc.slice(-10);
    }, [])
  );

  public freezed = signal<boolean>(false);
  public lastMessage = signal<string | null>(null);

  public async toggleFreeze() {
    if (this.freezed()) {
      for (const message of this.missedmessagesArr) {
      }
      while (this.missedmessagesArr.length) {
        const message = this.missedmessagesArr.shift();
        if (message) {
          this.missedMessagesSubject.next(message);
          await new Promise((r) => setTimeout(r, MISSED_TIMEOUT));
        }
      }
    }
    this.freezed.update((val) => !val);
  }

}
