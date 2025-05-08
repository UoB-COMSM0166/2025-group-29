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
    ``
  ];

  let idx          = 0;
  const overlay    = document.getElementById('introOverlay');
  const imgEl      = document.getElementById('introImage');
  const storyEl    = document.getElementById('storyText');
  const clickEl    = document.getElementById('clickText');

  let typingTimer  = null;
  let charIndex    = 0;

  // 打字机效果
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
    }, 20); // 加快一些
  }

  // 显示第 i 页字幕
  function showSubtitleForSlide(i) {
    clearInterval(typingTimer);
    storyEl.textContent = '';
    const txt = subtitles[i] || '';
    if (txt) {
      storyEl.style.opacity = '1';
      startTyping(txt);
    } else {
      storyEl.style.opacity = '0';
    }
  }

  // “Click to continue” 省略号动画
  let dotCount = 0;
  const ellipsisTimer = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    clickEl.textContent = 'Click to continue' + '.'.repeat(dotCount);
  }, 500);

  // 点击切图
  imgEl.addEventListener('click', () => {
    if (idx < images.length - 1) {
      idx++;
      // 淡出当前图
      imgEl.classList.add('fade');
      imgEl.addEventListener('transitionend', function handler() {
        imgEl.removeEventListener('transitionend', handler);
        imgEl.src = images[idx];
        imgEl.classList.remove('fade');
        // 切换字幕
        showSubtitleForSlide(idx);
      });
    } else {
      // 最后一张，结束引导
      clearInterval(ellipsisTimer);
      overlay.classList.add('hidden');
      overlay.addEventListener('transitionend', () => {
        overlay.remove();
        window.dispatchEvent(new Event('introFinished'));
      }, { once: true });
    }
  });

  // 初始显示
  showSubtitleForSlide(0);
});