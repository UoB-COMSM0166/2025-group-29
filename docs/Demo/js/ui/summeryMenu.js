// js/ui/summaryMenu.js
import { supabase } from '../supabase.js';
import { switchTo } from '../router.js';

export const SummaryMenu = {
  el: null,
  show(totalScore) {
    // determine grade from total score
    let grade;
    if (totalScore >= 2000) grade = 'S';
    else if (totalScore >= 1500) grade = 'A';
    else if (totalScore >= 1000) grade = 'B';
    else grade = 'C';

    // create container element for summary
    this.el = document.createElement('div');
    this.el.className = 'summaryContainer';
    this.el.innerHTML = `
      <h2>Level Complete!</h2>
      <div class="summaryContent">
        <p><strong>Score:</strong> ${totalScore}</p>
        <p><strong>Grade:</strong> <span class="grade grade-${grade}">${grade}</span></p>
      </div>
      <div class="summaryActions">
        <button id="nextLevelBtn" class="menuButton">Next Level</button>
        <button id="retryBtn" class="menuButton">Retry</button>
        <button id="exitBtn" class="menuButton">Exit to Menu</button>
      </div>
    `;
    document.body.appendChild(this.el);

    // go to next level on click
    document.getElementById('nextLevelBtn').onclick = () => {
      switchTo('GAME');
    };
    // retry same level on click
    document.getElementById('retryBtn').onclick = () => {
      switchTo('GAME', { retry: true });
    };
    // exit to main menu on click
    document.getElementById('exitBtn').onclick = () => switchTo('MAIN_MENU');
  },
  hide() {
    // remove summary element if exists
    if (this.el) this.el.remove();
  }
};

// CSS to include in global stylesheet or inline styles:
/*
.summaryContainer {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 2em;
  border-radius: 8px;
  text-align: center;
  z-index: 1000;
}
.summaryContent p {
  font-size: 1.2em;
  margin: 0.5em 0;
}
.grade {
  display: inline-block;
  padding: 0.2em 0.6em;
  border-radius: 4px;
  font-size: 1.4em;
}
.grade-C { background: #888; }
.grade-B { background: #66c; }
.grade-A { background: #2c9; }
.grade-S { background: gold; color: #000; }
.summaryActions { margin-top: 1.5em; }
.summaryActions .menuButton { margin: 0 0.5em; }
*/