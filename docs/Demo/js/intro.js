// js/intro.js
document.addEventListener('DOMContentLoaded', () => {
  const images = [
    'assets/media/intro/1.png',
    'assets/media/intro/2-1.png',
    'assets/media/intro/2-2.png',
    'assets/media/intro/3.png',
    'assets/media/intro/4.png',
    'assets/media/intro/5-1.png',
    'assets/media/intro/5-2.png'
  ];

  // 每张图对应的字幕
  const subtitles = [
    `At the edge of the universe lies a forbidden realm—the
Graveyard of the Cosmos.
It is the tomb of civilizations, a nest of the unknown. For
decades, countless explorers, fleets, machines, and even
signals have vanished without a trace after entering.`,
    `In desperation, the Unified Government launched the "Hunter
Project": transforming humans into cybernetic warriors,
merging flesh and machine into combat units designed to
confront the bio-threats lurking within this deadly domain.`,
    // 第二张和第三张共用上面那段，所以这里也重复
    `In desperation, the Unified Government launched the "Hunter
Project": transforming humans into cybernetic warriors,
merging flesh and machine into combat units designed to
confront the bio-threats lurking within this deadly domain.`,
    `You are the 233rd-generation Hunter—equipped with
enhanced senses, a reconfigurable body, and a memory that
has been tampered with.`,
    `But in the final moment before you descend into sleep, you
vaguely hear a voice:
“This is a retrieval mission, not an exploration.”`,
    `When you awaken, only a single directive remains before you:
Hunt—until nothing is left.`,
    '' // 最后一张不显示文字
  ];

  let idx       = 0;
  const overlay = document.getElementById('introOverlay');
  const imgEl    = document.getElementById('introImage');
  const storyEl  = document.getElementById('storyText');

  let typingTimer = null;
  let charIndex   = 0;

  function startTyping(text) {
    clearInterval(typingTimer);
    storyEl.textContent = '';
    charIndex = 0;
    typingTimer = setInterval(() => {
      if (charIndex < text.length) {
        storyEl.textContent += text[charIndex++];
      } else {
        clearInterval(typingTimer);
      }
    }, 30);  // 30ms 打字速度
  }

  function showSubtitleForSlide(i) {
    const text = subtitles[i] || '';
    // 立刻清空并开始或隐藏
    clearInterval(typingTimer);
    storyEl.textContent = '';
    if (text) {
      storyEl.style.opacity = '1';
      startTyping(text);
    } else {
      storyEl.style.opacity = '0';
    }
  }

  imgEl.addEventListener('click', () => {
    if (idx < images.length - 1) {
      idx++;
      imgEl.classList.add('fade');
      imgEl.addEventListener('transitionend', function handler() {
        imgEl.removeEventListener('transitionend', handler);
        imgEl.src = images[idx];
        imgEl.classList.remove('fade');
        showSubtitleForSlide(idx);
      });
    } else {
      overlay.classList.add('hidden');
      overlay.addEventListener('transitionend', () => {
        overlay.remove();
        window.dispatchEvent(new Event('introFinished'));
      }, { once: true });
    }
  });

  // 初始显示第一张字幕
  showSubtitleForSlide(0);
});