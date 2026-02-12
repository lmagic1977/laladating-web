// Simple bilingual toggle - Add before </body>
(function() {
  const savedLang = localStorage.getItem('locale') || 
    (navigator.language.split('-')[0] === 'zh' ? 'zh' : 'en');
  document.documentElement.setAttribute('lang', savedLang);
  
  // Create toggle button
  const toggle = document.createElement('button');
  toggle.id = 'lang-toggle';
  toggle.innerHTML = '<span' + (savedLang === 'en' ? ' class="active"' : '') + '>EN</span> | <span' + (savedLang === 'zh' ? ' class="active"' : '') + '>中文</span>';
  toggle.onclick = function() {
    const current = document.documentElement.getAttribute('lang');
    const next = current === 'zh' ? 'en' : 'zh';
    document.documentElement.setAttribute('lang', next);
    localStorage.setItem('locale', next);
    
    // Update button
    toggle.innerHTML = '<span' + (next === 'en' ? ' class="active"' : '') + '>EN</span> | <span' + (next === 'zh' ? ' class="active"' : '') + '>中文</span>';
    
    // Dispatch event for reactive components
    window.dispatchEvent(new CustomEvent('langChange', { detail: next }));
  };
  
  // Insert after nav or first nav element
  const nav = document.querySelector('nav');
  if (nav) {
    const container = document.createElement('div');
    container.id = 'lang-switch';
    container.appendChild(toggle);
    nav.parentElement.insertBefore(container, nav.nextSibling);
  }
})();
