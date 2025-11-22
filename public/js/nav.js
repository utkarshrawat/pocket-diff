document.addEventListener("DOMContentLoaded", () => {
    const navHTML = `
        <a href="/" class="logo" style="text-decoration:none;">
            ⚡ Pocket<span style="color:#3b82f6">Diff</span>
        </a>
        <div class="nav-links">
            <a href="/" class="${isActive('')}">⚖️ Diff</a>
            <a href="/formatter/" class="${isActive('formatter')}">✨ Format</a>
            <a href="/tools/" class="${isActive('tools')}">🛠️ Dev Tools</a>
            <a href="/calculator/" class="${isActive('calculator')}">💸 Finance</a>
        </div>
    `;
    
    const navElement = document.querySelector('nav');
    if (navElement) navElement.innerHTML = navHTML;
});

function isActive(key) {
    const path = window.location.pathname;
    
    // Homepage
    if (key === '') {
        return (path === '/' || path.endsWith('index.html')) && !path.includes('formatter') && !path.includes('tools') && !path.includes('calculator')
            ? 'active-link' 
            : '';
    }
    
    // Sub-pages
    return path.includes(key) ? 'active-link' : '';
}