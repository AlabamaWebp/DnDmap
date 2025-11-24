import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import io, { Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: Socket | undefined;
  constructor(private http: HttpClient, private router: Router) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.unsubscribe();
      }
    });
  }

  isConnect() {
    return this.socket ? true : false;
  }
  connect() {
    this.socket = io('http://10.64.206.189:4001');
  }
  disconnect() {
    this.events.clear();
    this.socket?.close();
  }
  events = new Set<string>();
  on(eventName: string, callback: any) {
    this.isConnect() ? 0 : this.connect();
    if (!this.isConnect()) return;
    if (!this.events.has(eventName)) {
      this.events.add(eventName);
      this.socket?.on(eventName, callback);
    }
  }
  off(ev: string[]) {
    ev.forEach((e) => this.events.delete(e));
  }
  emit(eventName: string, data: any = undefined) {
    if (this.isConnect()) this.connect();
    if (!this.isConnect()) return;
    this.socket?.emit(eventName, data);
  }
  unsubscribe() {
    this.events.forEach((el: string) => {
      this.socket?.off(el);
    });
    // this.events.clear();
  }
}
