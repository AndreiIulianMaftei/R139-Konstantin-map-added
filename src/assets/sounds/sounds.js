// src/utils/sounds.js
class XPSounds {
    constructor() {
      this.sounds = {
        click: new Audio('/assets/sounds/click.wav'),
        open: new Audio('/assets/sounds/window-open.wav'),
        close: new Audio('/assets/sounds/window-close.wav'),
        error: new Audio('/assets/sounds/error.wav')
      };
    }
  
    play(soundName) {
      if (this.sounds[soundName]) {
        this.sounds[soundName].currentTime = 0;
        this.sounds[soundName].play().catch(() => {
          // Ignore autoplay restrictions
        });
      }
    }
  }
  
  export const xpSounds = new XPSounds();
  
  // Usage in components
  import { xpSounds } from '../utils/sounds';
  
  const handleClick = () => {
    xpSounds.play('click');
    // Your click logic
  };