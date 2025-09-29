/**
 * Password Generator UI Logic (Gold Standard Scaffold)
 * ----------------------------------------------------
 * Responsibilities:
 *  - Maintain a single state object describing current selections
 *  - Secure password generation using crypto.getRandomValues
 *  - Reflect slider changes in UI + state
 *  - Validate selections (at least one charset required)
 *  - Provide copy-to-clipboard with status feedback
 *  - Clear flow resets everything deterministically
 *  - No external dependencies
 *  - Accessible: ARIA updates, focus management, status messages
 */

(function() {
  // ------------------ Constants ------------------
  const CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()_+[]{}|;:,.<>/?~-'
  };

  const MIN_LEN = 8;
  const MAX_LEN = 64;
  const DEFAULT_LEN = 16; // matches initial HTML value

  // ------------------ State ------------------
  const state = {
    length: DEFAULT_LEN,
    useUpper: true,
    useLower: true,
    useDigits: true,
    useSymbols: false,
    generated: ''
  };

  // ------------------ DOM Refs ------------------
  const output = document.getElementById('passwordOutput');
  const copyBtn = document.getElementById('copyBtn');
  const lengthSlider = document.getElementById('lengthSlider');
  const lengthValue = document.getElementById('lengthValue');
  const hint = document.getElementById('copyHint');
  const generateBtn = document.getElementById('generateBtn');
  const clearBtn = document.getElementById('clearBtn');

  const upperEl = document.getElementById('optUpper');
  const lowerEl = document.getElementById('optLower');
  const digitsEl = document.getElementById('optNumbers');
  const symbolsEl = document.getElementById('optSymbols');

  // ------------------ Utility Helpers ------------------
  function secureRandomIndices(count, maxExclusive) {
    // Returns an array of random integers in [0, maxExclusive)
    const arr = new Uint32Array(count);
    crypto.getRandomValues(arr);
    const result = new Array(count);
    for (let i = 0; i < count; i++) {
      result[i] = arr[i] % maxExclusive;
    }
    return result;
  }

  function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function buildPool() {
    let pool = '';
    if (state.useUpper) pool += CHARSETS.upper;
    if (state.useLower) pool += CHARSETS.lower;
    if (state.useDigits) pool += CHARSETS.digits;
    if (state.useSymbols) pool += CHARSETS.symbols;
    return pool;
  }

  function atLeastOneSelected() {
    return state.useUpper || state.useLower || state.useDigits || state.useSymbols;
  }

  function announce(msg) {
    hint.textContent = msg;
    // Clear after a delay for ephemeral messages
    if (msg) setTimeout(() => { if (hint.textContent === msg) hint.textContent = ''; }, 3000);
  }

  function updateLengthUI() {
    lengthValue.textContent = state.length;
    lengthSlider.setAttribute('aria-valuenow', String(state.length));
  }

  function reflectPassword() {
    output.value = state.generated;
    copyBtn.disabled = state.generated.length === 0;
  }

  // ------------------ Generation Logic ------------------
  function generatePassword() {
    if (!atLeastOneSelected()) {
      announce('Select at least one character set');
      state.generated = '';
      reflectPassword();
      return;
    }
    const pool = buildPool();
    const len = state.length;

    // Guarantee at least one char from each chosen set (if multiple sets)
    const required = [];
    if (state.useUpper) required.push(randomChar(CHARSETS.upper));
    if (state.useLower) required.push(randomChar(CHARSETS.lower));
    if (state.useDigits) required.push(randomChar(CHARSETS.digits));
    if (state.useSymbols) required.push(randomChar(CHARSETS.symbols));

    const remainingCount = Math.max(0, len - required.length);
    const indices = secureRandomIndices(remainingCount, pool.length);
    const chars = [...required];
    for (let i = 0; i < remainingCount; i++) {
      chars.push(pool[indices[i]]);
    }
    // Shuffle result to avoid predictable grouping of required picks
    fisherYatesShuffle(chars);
    state.generated = chars.join('');
    reflectPassword();
    announce('Password generated');
  }

  function randomChar(str) {
    const n = secureRandomIndices(1, str.length)[0];
    return str[n];
  }

  // ------------------ Event Handlers ------------------
  function onSliderInput() {
    const val = Number(lengthSlider.value);
    state.length = clamp(val, MIN_LEN, MAX_LEN);
    updateLengthUI();
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function onGenerateClick() { generatePassword(); }

  async function onCopyClick() {
    if (!state.generated) return;
    try {
      await navigator.clipboard.writeText(state.generated);
      announce('Copied to clipboard');
    } catch {
      announce('Copy failed');
    }
  }

  function onClearClick() {
    // Reset state to defaults
    state.length = MIN_LEN;
    state.useUpper = false;
    state.useLower = false;
    state.useDigits = false;
    state.useSymbols = false;
    state.generated = '';
    // Reflect UI
    lengthSlider.value = String(state.length);
    updateLengthUI();
    upperEl.checked = false;
    lowerEl.checked = false;
    digitsEl.checked = false;
    symbolsEl.checked = false;
    reflectPassword();
    announce('Cleared');
  }

  function onOptionChange() {
    state.useUpper = upperEl.checked;
    state.useLower = lowerEl.checked;
    state.useDigits = digitsEl.checked;
    state.useSymbols = symbolsEl.checked;
  }

  // ------------------ Init ------------------
  function init() {
    // Initial sync
    reflectPassword();
    updateLengthUI();

    // Listeners
    lengthSlider.addEventListener('input', onSliderInput);
    copyBtn.addEventListener('click', onCopyClick);
    generateBtn.addEventListener('click', onGenerateClick);
    clearBtn.addEventListener('click', onClearClick);
    upperEl.addEventListener('change', onOptionChange);
    lowerEl.addEventListener('change', onOptionChange);
    digitsEl.addEventListener('change', onOptionChange);
    symbolsEl.addEventListener('change', onOptionChange);
  }

  init();
})();
