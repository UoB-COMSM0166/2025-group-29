// js/privacy.js
export function showPrivacyConsent(callback) {
  // create a full-screen overlay for privacy consent
  const overlay = document.createElement('div');
  overlay.id = 'privacyOverlay';
  Object.assign(overlay.style, {
    position:   'fixed',
    top:        '0',
    left:       '0',
    width:      '100vw',
    height:     '100vh',
    background: 'rgba(0,0,0,0.85)',
    color:      '#fff',
    display:    'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding:    '2em',
    zIndex:     '10000',
    textAlign:  'center',
    fontSize:   '1em',
    fontFamily: 'Minecraft, Arial, sans-serif'
  });

  // set the HTML content with message and action buttons
  overlay.innerHTML = `
    <h2>Privacy & Cookies</h2>
    <p>
      We use cookies and process data to provide and improve our services, 
      in accordance with EU privacy regulations (GDPR).
      By clicking “I Agree”, you consent to our use of cookies and data processing.
    </p>
    <div style="margin-top:1.5em;">
      <button id="agreeBtn" style="
        padding:0.75em 1.5em; margin-right:1em;
        font-size:1em; cursor:pointer;
        border:none; border-radius:4px;
        background:#28a745; color:#fff;
      ">I Agree & Continue</button>
      <button id="declineBtn" style="
        padding:0.75em 1.5em;
        font-size:1em; cursor:pointer;
        border:none; border-radius:4px;
        background:#dc3545; color:#fff;
      ">I Do Not Agree & Exit</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // when user agrees, remove overlay and call callback with true
  document.getElementById('agreeBtn').onclick = () => {
    overlay.remove();
    callback(true);
  };

  // when user declines, call callback with false
  document.getElementById('declineBtn').onclick = () => {
    callback(false);
  };
}