declare namespace ttyplayer {
  interface TTYPlayerOptions {
    parent: Element;
    cols?: number;
    rows?: number;
    footerStyle?: string;
  }
  class TTYPlayer {
    constructor(options: TTYPlayerOptions);
    load(url: string): void;
    play(): void;
    pause(): void;
    resume(): void;
    resumePlay(): void;
    destroy(): void;
  }
}
